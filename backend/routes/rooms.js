import express from "express";
import db from "../config/db.js";

const router = express.Router();

// Get all active rooms
router.get("/rooms", (req, res) => {
  const sql = `
    SELECT r.*, b.city, b.location 
    FROM rooms r
    LEFT JOIN branches b ON r.branch_id = b.branch_id
    WHERE r.is_active = 1
    ORDER BY r.branch_id, r.room_number
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// Get rooms by branch
router.get("/rooms/branch/:branchId", (req, res) => {
  const { branchId } = req.params;
  
  const sql = `
    SELECT * FROM rooms 
    WHERE branch_id = ? AND is_active = 1
    ORDER BY room_number
  `;
  
  db.query(sql, [branchId], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// Get single room
router.get("/rooms/:roomId", (req, res) => {
  const { roomId } = req.params;
  
  const sql = `
    SELECT r.*, b.city, b.location 
    FROM rooms r
    LEFT JOIN branches b ON r.branch_id = b.branch_id
    WHERE r.room_id = ?
  `;
  
  db.query(sql, [roomId], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    res.json(results[0]);
  });
});

export default router;