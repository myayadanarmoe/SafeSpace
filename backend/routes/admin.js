import express from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js";

const router = express.Router();

// Get all users with pagination and search
router.get("/admin/users", (req, res) => {
  const { search = '', page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  let countQuery = "SELECT COUNT(*) as total FROM users";
  let query = "SELECT id, username, email, type, profile_pic, created_at FROM users";
  let queryParams = [];
  let countParams = [];

  if (search) {
    const searchPattern = `%${search}%`;
    query += " WHERE username LIKE ? OR email LIKE ? OR type LIKE ?";
    countQuery += " WHERE username LIKE ? OR email LIKE ? OR type LIKE ?";
    queryParams = [searchPattern, searchPattern, searchPattern];
    countParams = [searchPattern, searchPattern, searchPattern];
  }

  query += " ORDER BY id DESC LIMIT ? OFFSET ?";
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
        return res.status(500).json({ message: "Database error" });
      }

      res.json({
        users: results,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      });
    });
  });
});

// Get single user by ID (admin)
router.get("/admin/users/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = "SELECT id, username, email, type, profile_pic, created_at FROM users WHERE id = ?";
  
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

// Update user (username, email, and role) - MORE SPECIFIC ROUTE FIRST
router.put("/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  const { username, email, type } = req.body;
  
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
  
  const sql = "UPDATE users SET username = ?, email = ?, type = ? WHERE id = ?";
  
  db.query(sql, [username, email, type, id], (err, result) => {
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
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User updated successfully" });
  });
});

// Update user role only - LESS SPECIFIC ROUTE AFTER
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

// Create new user (admin)
router.post("/admin/users", async (req, res) => {
  const { username, email, password, type = 'Free User' } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email and password are required" });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const sql = "INSERT INTO users (username, email, password, type) VALUES (?, ?, ?, ?)";
    
    db.query(sql, [username, email, hashedPassword, type], (err, result) => {
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
      
      res.status(201).json({ 
        message: "User created successfully",
        userId: result.insertId 
      });
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