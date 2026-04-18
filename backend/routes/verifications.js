import express from "express";
import db from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Ensure upload directory exists
const uploadDir = "uploads/student-ids";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "student-id-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images and PDF files are allowed"));
  }
});

// Submit youth verification request with duplicate detection
router.post("/verifications/youth", upload.single("studentIdImage"), (req, res) => {
  console.log("📝 Received youth verification request");
  console.log("Body:", req.body);
  console.log("File:", req.file);
  
  const { userId, fullName, dateOfBirth, idType, idNumber, school, grade, parentName, parentPhone, parentEmail } = req.body;
  const studentIdImage = req.file ? `/uploads/student-ids/${req.file.filename}` : null;

  if (!userId || !fullName || !dateOfBirth || !idNumber) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // First, get the user's email from the database
  const getUserEmailSql = "SELECT email FROM users WHERE id = ?";
  
  db.query(getUserEmailSql, [userId], (emailErr, emailResults) => {
    if (emailErr) {
      console.error("❌ Error fetching user email:", emailErr);
      return res.status(500).json({ message: "Database error" });
    }

    if (emailResults.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userEmail = emailResults[0].email;

    // Check for duplicate submissions from the same user
    const checkUserSql = `
      SELECT * FROM youth_verifications 
      WHERE userID = ? AND status IN ('pending', 'approved')
      LIMIT 1
    `;

    db.query(checkUserSql, [userId], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("❌ MySQL error:", checkErr);
        return res.status(500).json({ message: "Database error" });
      }

      if (checkResults.length > 0) {
        const existing = checkResults[0];
        if (existing.status === 'approved') {
          return res.status(400).json({ message: "You are already verified as a youth user!" });
        }
        if (existing.status === 'pending') {
          return res.status(400).json({ message: "You already have a pending verification request" });
        }
      }

      // Check for potential duplicate accounts (same name, email, or ID)
      const checkDuplicateSql = `
        SELECT 
          v.*, 
          u.name, u.email,
          CASE 
            WHEN u.id != ? AND u.name = ? THEN 'name'
            WHEN u.id != ? AND u.email = ? THEN 'email'
            WHEN v.idNumber = ? AND v.userID != ? THEN 'id_number'
            WHEN v.userID != ? AND v.dateOfBirth = ? THEN 'date_of_birth'
            ELSE NULL
          END as match_type
        FROM youth_verifications v
        JOIN users u ON v.userID = u.id
        WHERE v.status = 'approved'
          AND (
            u.name = ? 
            OR u.email = ? 
            OR v.idNumber = ?
            OR v.dateOfBirth = ?
          )
          AND v.userID != ?
        LIMIT 1
      `;

      db.query(checkDuplicateSql, [
        userId, fullName,
        userId, userEmail,
        idNumber, userId,
        userId, dateOfBirth,
        fullName, userEmail, idNumber, dateOfBirth, userId
      ], (dupErr, dupResults) => {
        if (dupErr) {
          console.error("❌ Duplicate check error:", dupErr);
        }

        let warning = null;
        if (dupResults && dupResults.length > 0) {
          const match = dupResults[0];
          switch(match.match_type) {
            case 'name':
              warning = `⚠️ Warning: Another user with the name "${match.name}" is already verified as youth. Please verify this isn't a duplicate account.`;
              break;
            case 'email':
              warning = `⚠️ Warning: The email "${match.email}" is already associated with a verified youth account.`;
              break;
            case 'id_number':
              warning = `⚠️ Warning: This ID number has been used in a previous verification.`;
              break;
            case 'date_of_birth':
              warning = `⚠️ Warning: Someone with the same birth date is already verified.`;
              break;
          }
        }

        // Insert the verification request
        const sql = `
          INSERT INTO youth_verifications 
          (userID, fullName, dateOfBirth, idType, idNumber, school, grade, parentName, parentPhone, parentEmail, studentIdImage, status, admin_notes) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        `;

        db.query(sql, [userId, fullName, dateOfBirth, idType, idNumber, school, grade, parentName, parentPhone, parentEmail, studentIdImage, warning || null], (err, result) => {
          if (err) {
            console.error("❌ MySQL error:", err);
            return res.status(500).json({ message: "Database error: " + err.message });
          }

          console.log("✅ Verification submitted with ID:", result.insertId);
          
          const responseMessage = warning 
            ? `Verification submitted but ${warning} The admin will review carefully.`
            : "Verification submitted successfully! You will be notified within 24-48 hours.";
          
          res.status(201).json({
            message: responseMessage,
            verificationId: result.insertId,
            warning: warning
          });
        });
      });
    });
  });
});

// Get user's verification status
router.get("/verifications/youth/status/:userId", (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT id, status, submitted_at, reviewed_at, admin_notes
    FROM youth_verifications 
    WHERE userID = ?
    ORDER BY submitted_at DESC
    LIMIT 1
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.json({ verified: false, status: null });
    }

    res.json({
      verified: results[0].status === 'approved',
      status: results[0].status,
      submitted_at: results[0].submitted_at,
      reviewed_at: results[0].reviewed_at,
      notes: results[0].admin_notes
    });
  });
});

// Admin: Get all pending verifications with duplicate warnings
router.get("/verifications/youth/pending", (req, res) => {
  const sql = `
    SELECT 
      v.*, 
      u.name, u.email,
      (
        SELECT COUNT(*) FROM youth_verifications v2 
        WHERE v2.status = 'approved' 
        AND (v2.fullName = v.fullName OR v2.idNumber = v.idNumber)
      ) as potential_duplicates
    FROM youth_verifications v
    JOIN users u ON v.userID = u.id
    WHERE v.status = 'pending'
    ORDER BY v.submitted_at ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// Admin: Get detailed duplicate info for a verification (INCLUDES studentIdImage)
router.get("/verifications/youth/duplicates/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      v.*,
      u.name, u.email,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'name', u2.name,
            'email', u2.email,
            'fullName', v2.fullName,
            'dateOfBirth', DATE_FORMAT(v2.dateOfBirth, '%Y-%m-%d'),
            'idNumber', v2.idNumber,
            'submitted_at', DATE_FORMAT(v2.submitted_at, '%Y-%m-%d %H:%i:%s'),
            'studentIdImage', v2.studentIdImage
          )
        )
        FROM youth_verifications v2
        JOIN users u2 ON v2.userID = u2.id
        WHERE v2.status = 'approved'
          AND v2.userID != v.userID
          AND (
            v2.fullName = v.fullName 
            OR v2.idNumber = v.idNumber
            OR u2.email = u.email
            OR v2.dateOfBirth = v.dateOfBirth
          )
      ) as possible_duplicates
    FROM youth_verifications v
    JOIN users u ON v.userID = u.id
    WHERE v.id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error: " + err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Verification not found" });
    }
    
    let result = results[0];
    if (result.possible_duplicates && typeof result.possible_duplicates === 'string') {
      try {
        result.possible_duplicates = JSON.parse(result.possible_duplicates);
      } catch(e) {
        result.possible_duplicates = [];
      }
    }
    
    res.json(result);
  });
});

// Admin: Approve youth verification
router.put("/verifications/youth/approve/:id", (req, res) => {
  const { id } = req.params;
  const { adminId } = req.body;

  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ message: "Transaction error" });
    }

    const updateSql = `
      UPDATE youth_verifications 
      SET status = 'approved', reviewed_at = NOW(), reviewed_by = ?
      WHERE id = ?
    `;

    db.query(updateSql, [adminId, id], (updateErr, updateResult) => {
      if (updateErr) {
        return db.rollback(() => {
          console.error("❌ MySQL error:", updateErr);
          res.status(500).json({ message: "Database error" });
        });
      }

      if (updateResult.affectedRows === 0) {
        return db.rollback(() => {
          res.status(404).json({ message: "Verification not found" });
        });
      }

      // Get userID from verification
      const getUserSql = "SELECT userID FROM youth_verifications WHERE id = ?";
      
      db.query(getUserSql, [id], (getErr, getResults) => {
        if (getErr || getResults.length === 0) {
          return db.rollback(() => {
            res.status(404).json({ message: "Verification not found" });
          });
        }

        const userId = getResults[0].userID;

        // Update user type to Youth User
        const updateUserSql = "UPDATE users SET type = 'Youth User' WHERE id = ?";
        
        db.query(updateUserSql, [userId], (userErr) => {
          if (userErr) {
            return db.rollback(() => {
              console.error("❌ User update error:", userErr);
              res.status(500).json({ message: "User update error" });
            });
          }

          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => {
                res.status(500).json({ message: "Commit error" });
              });
            }

            res.json({ message: "Youth verification approved! User upgraded to Youth User." });
          });
        });
      });
    });
  });
});

// Admin: Reject youth verification
router.put("/verifications/youth/reject/:id", (req, res) => {
  const { id } = req.params;
  const { adminId, rejectReason } = req.body;

  const sql = `
    UPDATE youth_verifications 
    SET status = 'rejected', reviewed_at = NOW(), reviewed_by = ?, admin_notes = ?
    WHERE id = ?
  `;

  db.query(sql, [adminId, rejectReason, id], (err, result) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Verification not found" });
    }

    res.json({ message: "Verification rejected" });
  });
});

export default router;