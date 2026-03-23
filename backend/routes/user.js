import express from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Profile Update Route
router.put("/user/update", upload.single('profilePic'), async (req, res) => {
  console.log("👤 PROFILE UPDATE HIT");
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);

  const { userId, name, email, currentPassword, newPassword } = req.body;
  const profilePic = req.file ? `/uploads/${req.file.filename}` : null;

  if (!userId || !name || !email) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    db.query("SELECT * FROM users WHERE id = ?", [userId], async (err, results) => {
      if (err) {
        console.error("❌ MySQL error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = results[0];

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password is required to set new password" });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
      }

      let updateSql = "UPDATE users SET name = ?, email = ?";
      let updateParams = [name, email];

      if (newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updateSql += ", password = ?";
        updateParams.push(hashedPassword);
      }

      if (profilePic) {
        updateSql += ", profile_pic = ?";
        updateParams.push(profilePic);
      }

      updateSql += " WHERE id = ?";
      updateParams.push(userId);

      db.query(updateSql, updateParams, (err, result) => {
        if (err) {
          console.error("❌ MySQL error:", err);
          
          if (err.code === "ER_DUP_ENTRY") {
            if (err.sqlMessage.includes("name")) {
              return res.status(400).json({ message: "Name already exists" });
            } else {
              return res.status(400).json({ message: "Email already exists" });
            }
          }
          
          return res.status(500).json({ message: "Database error" });
        }

        db.query("SELECT id, name, email, type, profile_pic, created_at FROM users WHERE id = ?", [userId], (err, userData) => {
          if (err) {
            return res.json({ message: "Profile updated successfully" });
          }
          
          res.json({ 
            message: "Profile updated successfully",
            user: userData[0]
          });
        });
      });
    });
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Current User Route
router.get("/user/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = "SELECT id, name, email, type, profile_pic, created_at FROM users WHERE id = ?";
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(results[0]);
  });
});

// Get all regular users (Standard, Premium, Youth)
router.get("/users/regular", (req, res) => {
  const sql = `
    SELECT u.id, u.name, u.email, u.type, u.created_at,
           p.name, p.date_of_birth, p.gender, p.address, p.phNo, p.emergencyContact
    FROM users u
    LEFT JOIN patients p ON u.id = p.patientID
    WHERE u.type IN ('Standard User', 'Premium User', 'Youth User')
    ORDER BY u.created_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// Update user (for staff) - FIXED with proper date handling
router.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const { email, name, phNo, date_of_birth, gender, address, emergencyContact } = req.body;
  
  console.log("Updating user:", { id, email, name, phNo, date_of_birth, gender, address, emergencyContact });
  
  // Validate required fields
  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }
  
  // First update users table
  const userSql = "UPDATE users SET name = ?, email = ? WHERE id = ?";
  
  db.query(userSql, [name, email, id], (userErr, userResult) => {
    if (userErr) {
      console.error("❌ Users table update error:", userErr);
      
      if (userErr.code === "ER_DUP_ENTRY") {
        if (userErr.sqlMessage.includes("name")) {
          return res.status(400).json({ message: "Name already exists" });
        } else {
          return res.status(400).json({ message: "Email already exists" });
        }
      }
      
      return res.status(500).json({ message: "Database error updating user" });
    }
    
    console.log("Users table updated:", userResult);
    
    // Only update patients table if any patient fields are provided
    if (name || phNo || date_of_birth || gender || address || emergencyContact) {
      
      // Check if patient record exists
      const checkPatientSql = "SELECT * FROM patients WHERE patientID = ?";
      
      db.query(checkPatientSql, [id], (checkErr, checkResults) => {
        if (checkErr) {
          console.error("❌ Check patient error:", checkErr);
          return res.status(500).json({ message: "Database error checking patient" });
        }
        
        console.log("Patient check results:", checkResults);
        
        // Handle date_of_birth - convert empty string to null
        const formattedDate = date_of_birth && date_of_birth.trim() !== '' ? date_of_birth : null;
        
        if (checkResults.length > 0) {
          // Update existing patient record
          const patientSql = `
            UPDATE patients 
            SET name = ?, phNo = ?, date_of_birth = ?, gender = ?, address = ?, emergencyContact = ?
            WHERE patientID = ?
          `;
          
          db.query(patientSql, [
            name || '', 
            phNo || '', 
            formattedDate, // This will be null for empty strings
            gender || '', 
            address || '', 
            emergencyContact || '', 
            id
          ], (patientErr, patientResult) => {
            if (patientErr) {
              console.error("❌ Patients table update error:", patientErr);
              return res.status(500).json({ message: "Database error updating patient details" });
            }
            
            console.log("Patients table updated:", patientResult);
            res.json({ message: "User updated successfully" });
          });
        } else {
          // Insert new patient record
          const insertPatientSql = `
            INSERT INTO patients (patientID, name, phNo, date_of_birth, gender, address, emergencyContact)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          
          db.query(insertPatientSql, [
            id, 
            name || '', 
            phNo || '', 
            formattedDate, // This will be null for empty strings
            gender || '', 
            address || '', 
            emergencyContact || ''
          ], (insertErr, insertResult) => {
            if (insertErr) {
              console.error("❌ Patients table insert error:", insertErr);
              return res.status(500).json({ message: "Database error creating patient record" });
            }
            
            console.log("Patients table inserted:", insertResult);
            res.json({ message: "User updated successfully" });
          });
        }
      });
    } else {
      // No patient fields to update
      res.json({ message: "User updated successfully" });
    }
  });
});

// Reset password (generate temporary password)
router.post("/users/:id/reset-password", (req, res) => {
  const { id } = req.params;
  
  // Generate temporary password (8 characters)
  const tempPassword = Math.random().toString(36).slice(-8);
  
  bcrypt.hash(tempPassword, 10, (err, hash) => {
    if (err) {
      console.error("❌ Bcrypt error:", err);
      return res.status(500).json({ message: "Error generating password" });
    }
    
    const sql = "UPDATE users SET password = ? WHERE id = ?";
    
    db.query(sql, [hash, id], (updateErr, result) => {
      if (updateErr) {
        console.error("❌ MySQL error:", updateErr);
        return res.status(500).json({ message: "Database error" });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`🔑 Temporary password for user ${id}: ${tempPassword}`);
      
      res.json({ 
        message: "Password reset successful",
        tempPassword: tempPassword
      });
    });
  });
});

// Get single patient details
router.get("/users/:id/details", (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT u.id, u.email, u.type, u.created_at,
           u.name, p.date_of_birth, p.gender, p.address, p.phNo, p.emergencyContact
    FROM users u
    LEFT JOIN patients p ON u.id = p.patientID
    WHERE u.id = ?
  `;
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(results[0]);
  });
});

// Add this route to get user details with clinician/patient info
router.get("/users/:id/details", (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT 
      u.id, u.name, u.email, u.type, u.profile_pic, u.created_at,
      c.phone, c.address, c.about, c.primary_branch_id,
      p.date_of_birth, p.gender, p.address as patient_address, p.phNo, p.emergencyContact
    FROM users u
    LEFT JOIN clinicians c ON u.id = c.userID
    LEFT JOIN patients p ON u.id = p.userID
    WHERE u.id = ?
  `;
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(results[0]);
  });
});

// Update the profile update route to handle all fields
router.put("/user/update", upload.single('profilePic'), async (req, res) => {
  const { 
    userId, name, email, currentPassword, newPassword,
    phone, address, about, primaryBranchId,
    dateOfBirth, gender, patientAddress, phNo, emergencyContact
  } = req.body;
  
  const profilePic = req.file ? `/uploads/${req.file.filename}` : null;

  if (!userId || !name || !email) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    db.query("SELECT * FROM users WHERE id = ?", [userId], async (err, results) => {
      if (err) {
        console.error("❌ MySQL error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = results[0];

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password is required to set new password" });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
      }

      // Update users table
      let updateSql = "UPDATE users SET name = ?, email = ?";
      let updateParams = [name, email];

      if (newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updateSql += ", password = ?";
        updateParams.push(hashedPassword);
      }

      if (profilePic) {
        updateSql += ", profile_pic = ?";
        updateParams.push(profilePic);
      }

      updateSql += " WHERE id = ?";
      updateParams.push(userId);

      db.query(updateSql, updateParams, (err, result) => {
        if (err) {
          console.error("❌ MySQL error:", err);
          if (err.code === "ER_DUP_ENTRY") {
            if (err.sqlMessage.includes("email")) {
              return res.status(400).json({ message: "Email already exists" });
            }
          }
          return res.status(500).json({ message: "Database error" });
        }

        // Update clinicians table if user is a clinician
        const clinicianTypes = ['Psychiatrist', 'Psychologist', 'Therapist'];
        if (clinicianTypes.includes(user.type) && (phone || address || about || primaryBranchId)) {
          const checkClinicianSql = "SELECT * FROM clinicians WHERE userID = ?";
          
          db.query(checkClinicianSql, [userId], (checkErr, checkResults) => {
            if (checkErr) {
              console.error("❌ MySQL error:", checkErr);
              return;
            }
            
            if (checkResults.length > 0) {
              const updateClinicianSql = `
                UPDATE clinicians 
                SET phone = ?, address = ?, about = ?, primary_branch_id = COALESCE(?, primary_branch_id)
                WHERE userID = ?
              `;
              db.query(updateClinicianSql, [phone || null, address || null, about || null, primaryBranchId || null, userId]);
            } else if (phone || address || about) {
              const insertClinicianSql = `
                INSERT INTO clinicians (userID, phone, address, about, primary_branch_id)
                VALUES (?, ?, ?, ?, ?)
              `;
              db.query(insertClinicianSql, [userId, phone || null, address || null, about || null, primaryBranchId || null]);
            }
          });
        }

        // Update patients table if user is a patient
        const patientTypes = ['Standard User', 'Premium User', 'Youth User'];
        if (patientTypes.includes(user.type) && (dateOfBirth || gender || patientAddress || phNo || emergencyContact)) {
          const checkPatientSql = "SELECT * FROM patients WHERE userID = ?";
          
          db.query(checkPatientSql, [userId], (checkErr, checkResults) => {
            if (checkErr) {
              console.error("❌ MySQL error:", checkErr);
              return;
            }
            
            if (checkResults.length > 0) {
              const updatePatientSql = `
                UPDATE patients 
                SET date_of_birth = ?, gender = ?, address = ?, phNo = ?, emergencyContact = ?
                WHERE userID = ?
              `;
              db.query(updatePatientSql, [
                dateOfBirth || null, 
                gender || null, 
                patientAddress || null, 
                phNo || null, 
                emergencyContact || null, 
                userId
              ]);
            } else if (dateOfBirth || gender || patientAddress || phNo || emergencyContact) {
              const insertPatientSql = `
                INSERT INTO patients (userID, date_of_birth, gender, address, phNo, emergencyContact)
                VALUES (?, ?, ?, ?, ?, ?)
              `;
              db.query(insertPatientSql, [
                userId, 
                dateOfBirth || null, 
                gender || null, 
                patientAddress || null, 
                phNo || null, 
                emergencyContact || null
              ]);
            }
          });
        }

        db.query("SELECT id, name, email, type, profile_pic, created_at FROM users WHERE id = ?", [userId], (err, userData) => {
          if (err) {
            return res.json({ message: "Profile updated successfully" });
          }
          
          res.json({ 
            message: "Profile updated successfully",
            user: userData[0]
          });
        });
      });
    });
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;