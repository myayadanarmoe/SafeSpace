import express from "express";
import db from "../config/db.js";

const router = express.Router();

// Get all therapies
router.get("/therapies", (req, res) => {
  const sql = "SELECT * FROM therapy ORDER BY therapyName";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// Get single therapy
router.get("/therapies/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = "SELECT * FROM therapy WHERE therapyID = ?";
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Therapy not found" });
    }
    
    res.json(results[0]);
  });
});

export default router;