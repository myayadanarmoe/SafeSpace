import express from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js";

const router = express.Router();

// Get all users with pagination and search (includes clinician data and diagnoses)
router.get("/admin/users", (req, res) => {
  const { search = '', page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  let countQuery = "SELECT COUNT(*) as total FROM users";
  let query = `
    SELECT u.id, u.username, u.email, u.type, u.profile_pic, u.created_at,
           c.licenseNumber, 
           c.about,
           GROUP_CONCAT(DISTINCT d.diagnosisName) as diagnoses
    FROM users u
    LEFT JOIN clinicians c ON u.id = c.userID
    LEFT JOIN user_diagnosis ud ON u.id = ud.userID
    LEFT JOIN diagnosis d ON ud.diagnosisID = d.diagnosisID
  `;
  let queryParams = [];
  let countParams = [];

  if (search) {
    const searchPattern = `%${search}%`;
    query += " WHERE u.username LIKE ? OR u.email LIKE ? OR u.type LIKE ?";
    countQuery += " WHERE username LIKE ? OR email LIKE ? OR type LIKE ?";
    queryParams = [searchPattern, searchPattern, searchPattern];
    countParams = [searchPattern, searchPattern, searchPattern];
  }

  query += " GROUP BY u.id, c.licenseNumber, c.about ORDER BY u.id DESC LIMIT ? OFFSET ?";
  queryParams.push(parseInt(limit), parseInt(offset));

  db.query(countQuery, countParams, (countErr, countResult) => {
    if (countErr) {
      console.error("❌ Count query error:", countErr);
      return res.status(500).json({ message: "Database error" });
    }

    const total = countResult[0].total;

    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error("❌ MySQL error:", err);
        return res.status(500).json({ message: "Database error: " + err.sqlMessage });
      }

      // Parse diagnoses string to array and ensure licenseNumber and about are included
      const users = results.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        type: user.type,
        profile_pic: user.profile_pic,
        created_at: user.created_at,
        licenseNumber: user.licenseNumber || '', // Include even if null
        about: user.about || '', // Include even if null
        diagnoses: user.diagnoses ? user.diagnoses.split(',') : []
      }));

      res.json({
        users,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      });
    });
  });
});

// Get all diagnoses for dropdown
router.get("/admin/diagnoses", (req, res) => {
  const sql = "SELECT * FROM diagnosis ORDER BY diagnosisName";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// Get single user by ID (admin) - includes clinician data and diagnoses
router.get("/admin/users/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT u.id, u.username, u.email, u.type, u.profile_pic, u.created_at,
           c.licenseNumber, c.about,
           GROUP_CONCAT(DISTINCT d.diagnosisID) as diagnosisIds,
           GROUP_CONCAT(DISTINCT d.diagnosisName) as diagnosisNames
    FROM users u
    LEFT JOIN clinicians c ON u.id = c.userID
    LEFT JOIN user_diagnosis ud ON u.id = ud.userID
    LEFT JOIN diagnosis d ON ud.diagnosisID = d.diagnosisID
    WHERE u.id = ?
    GROUP BY u.id, c.licenseNumber, c.about
  `;
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const user = results[0];
    user.diagnosisIds = user.diagnosisIds ? user.diagnosisIds.split(',').map(Number) : [];
    user.diagnosisNames = user.diagnosisNames ? user.diagnosisNames.split(',') : [];
    user.licenseNumber = user.licenseNumber || '';
    user.about = user.about || '';
    
    res.json(user);
  });
});

// UPDATE USER ROLE ONLY - MORE SPECIFIC ROUTE FIRST
router.put("/admin/users/:id/role", (req, res) => {
  const { id } = req.params;
  const { type } = req.body;
  
  const validTypes = [
    'Free User',
    'Premium User',
    'Youth User',
    'Staff',
    'Admin',
    'Psychiatrist',
    'Psychologist',
    'Therapist'
  ];
  
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: "Invalid user type" });
  }
  
  const sql = "UPDATE users SET type = ? WHERE id = ?";
  
  db.query(sql, [type, id], (err, result) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User role updated successfully" });
  });
});

// UPDATE FULL USER - LESS SPECIFIC ROUTE AFTER
router.put("/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  const { username, email, type, licenseNumber, about, diagnosisIds } = req.body;
  
  const validTypes = [
    'Free User',
    'Premium User',
    'Youth User',
    'Staff',
    'Admin',
    'Psychiatrist',
    'Psychologist',
    'Therapist'
  ];
  
  if (!username || !email) {
    return res.status(400).json({ message: "Username and email are required" });
  }
  
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: "Invalid user type" });
  }
  
  // First update users table
  const userSql = "UPDATE users SET username = ?, email = ?, type = ? WHERE id = ?";
  
  db.query(userSql, [username, email, type, id], (err, userResult) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      
      if (err.code === "ER_DUP_ENTRY") {
        if (err.sqlMessage.includes("username")) {
          return res.status(400).json({ message: "Username already exists" });
        } else {
          return res.status(400).json({ message: "Email already exists" });
        }
      }
      
      return res.status(500).json({ message: "Database error" });
    }
    
    if (userResult.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Handle clinician data if user is a mental health professional
    const clinicianTypes = ['Psychiatrist', 'Psychologist', 'Therapist'];
    
    if (clinicianTypes.includes(type)) {
      // Check if clinician record exists
      const checkSql = "SELECT * FROM clinicians WHERE userID = ?";
      
      db.query(checkSql, [id], (checkErr, checkResults) => {
        if (checkErr) {
          console.error("❌ MySQL error:", checkErr);
          return res.status(500).json({ message: "Database error" });
        }
        
        if (checkResults.length > 0) {
          // Update existing clinician record
          const updateClinicianSql = "UPDATE clinicians SET licenseNumber = ?, about = ? WHERE userID = ?";
          
          db.query(updateClinicianSql, [licenseNumber || null, about || null, id], (updateErr) => {
            if (updateErr) {
              console.error("❌ MySQL error:", updateErr);
              return res.status(500).json({ message: "Database error" });
            }
            
            // Handle diagnoses
            handleDiagnoses(id, diagnosisIds, res);
          });
        } else {
          // Insert new clinician record
          const insertClinicianSql = "INSERT INTO clinicians (userID, licenseNumber, about) VALUES (?, ?, ?)";
          
          db.query(insertClinicianSql, [id, licenseNumber || null, about || null], (insertErr) => {
            if (insertErr) {
              console.error("❌ MySQL error:", insertErr);
              return res.status(500).json({ message: "Database error" });
            }
            
            // Handle diagnoses
            handleDiagnoses(id, diagnosisIds, res);
          });
        }
      });
    } else {
      // Not a clinician, remove any clinician data and diagnoses
      const deleteClinicianSql = "DELETE FROM clinicians WHERE userID = ?";
      
      db.query(deleteClinicianSql, [id], (delErr) => {
        if (delErr) {
          console.error("❌ MySQL error:", delErr);
          return res.status(500).json({ message: "Database error" });
        }
        
        const deleteDiagnosesSql = "DELETE FROM user_diagnosis WHERE userID = ?";
        
        db.query(deleteDiagnosesSql, [id], (delDiagErr) => {
          if (delDiagErr) {
            console.error("❌ MySQL error:", delDiagErr);
            return res.status(500).json({ message: "Database error" });
          }
          
          res.json({ message: "User updated successfully" });
        });
      });
    }
  });
});

// Helper function to handle diagnoses
function handleDiagnoses(userId, diagnosisIds, res) {
  // First delete existing diagnoses
  const deleteSql = "DELETE FROM user_diagnosis WHERE userID = ?";
  
  db.query(deleteSql, [userId], (delErr) => {
    if (delErr) {
      console.error("❌ MySQL error:", delErr);
      return res.status(500).json({ message: "Database error" });
    }
    
    // Then insert new diagnoses if any
    if (diagnosisIds && diagnosisIds.length > 0) {
      let completed = 0;
      let hasError = false;
      
      for (const diagnosisId of diagnosisIds) {
        const insertSql = "INSERT INTO user_diagnosis (userID, diagnosisID) VALUES (?, ?)";
        
        db.query(insertSql, [userId, diagnosisId], (insertErr) => {
          if (insertErr) {
            console.error("❌ MySQL error:", insertErr);
            hasError = true;
          }
          
          completed++;
          
          if (completed === diagnosisIds.length) {
            if (hasError) {
              return res.status(500).json({ message: "Error inserting diagnoses" });
            }
            res.json({ message: "User updated successfully" });
          }
        });
      }
    } else {
      res.json({ message: "User updated successfully" });
    }
  });
}

// Create new user (admin) - with optional clinician data
router.post("/admin/users", async (req, res) => {
  const { username, email, password, type = 'Free User', licenseNumber, about, diagnosisIds } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email and password are required" });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userSql = "INSERT INTO users (username, email, password, type) VALUES (?, ?, ?, ?)";
    
    db.query(userSql, [username, email, hashedPassword, type], (err, userResult) => {
      if (err) {
        console.error("❌ MySQL error:", err);
        
        if (err.code === "ER_DUP_ENTRY") {
          if (err.sqlMessage.includes("username")) {
            return res.status(400).json({ message: "Username already exists" });
          } else {
            return res.status(400).json({ message: "Email already exists" });
          }
        }
        
        return res.status(500).json({ message: "Database error" });
      }
      
      const userId = userResult.insertId;
      
      // If user is a clinician, insert clinician data
      const clinicianTypes = ['Psychiatrist', 'Psychologist', 'Therapist'];
      
      if (clinicianTypes.includes(type) && licenseNumber) {
        const clinicianSql = "INSERT INTO clinicians (userID, licenseNumber, about) VALUES (?, ?, ?)";
        
        db.query(clinicianSql, [userId, licenseNumber, about || null], (clinErr) => {
          if (clinErr) {
            console.error("❌ MySQL error:", clinErr);
            return res.status(500).json({ message: "Error creating clinician record" });
          }
          
          // Insert diagnoses if any
          if (diagnosisIds && diagnosisIds.length > 0) {
            let completed = 0;
            let hasError = false;
            
            for (const diagnosisId of diagnosisIds) {
              const diagSql = "INSERT INTO user_diagnosis (userID, diagnosisID) VALUES (?, ?)";
              
              db.query(diagSql, [userId, diagnosisId], (diagErr) => {
                if (diagErr) {
                  console.error("❌ MySQL error:", diagErr);
                  hasError = true;
                }
                
                completed++;
                
                if (completed === diagnosisIds.length) {
                  if (hasError) {
                    return res.status(500).json({ message: "Error inserting diagnoses" });
                  }
                  res.status(201).json({ 
                    message: "User and clinician created successfully",
                    userId: userId
                  });
                }
              });
            }
          } else {
            res.status(201).json({ 
              message: "User and clinician created successfully",
              userId: userId
            });
          }
        });
      } else {
        res.status(201).json({ 
          message: "User created successfully",
          userId: userId
        });
      }
    });
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user
router.delete("/admin/users/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = "DELETE FROM users WHERE id = ?";
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User deleted successfully" });
  });
});

// Get all available user types
router.get("/admin/user-types", (req, res) => {
  const types = [
    'Free User',
    'Premium User',
    'Youth User',
    'Staff',
    'Admin',
    'Psychiatrist',
    'Psychologist',
    'Therapist'
  ];
  
  res.json(types);
});

export default router;