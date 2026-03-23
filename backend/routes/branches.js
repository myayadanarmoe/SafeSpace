import express from "express";
import db from "../config/db.js";

const router = express.Router();

// Get all branches
router.get("/branches", (req, res) => {
  const sql = "SELECT * FROM branches WHERE is_active = true ORDER BY city, location";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// Get single branch by ID
router.get("/branches/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = "SELECT * FROM branches WHERE branch_id = ?";
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Branch not found" });
    }
    
    res.json(results[0]);
  });
});

// Get rooms for a branch
router.get("/branches/:id/rooms", (req, res) => {
  const { id } = req.params;
  
  const sql = "SELECT * FROM rooms WHERE branch_id = ? AND is_active = true ORDER BY room_number";
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

export default router;