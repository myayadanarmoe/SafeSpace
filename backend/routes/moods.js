import express from "express";
import db from "../config/db.js";

const router = express.Router();

// Get all moods
router.get("/moods", (req, res) => {
  const sql = "SELECT * FROM mood ORDER BY moodName";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// Get single mood
router.get("/moods/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = "SELECT * FROM mood WHERE moodID = ?";
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Mood not found" });
    }
    
    res.json(results[0]);
  });
});

export default router;