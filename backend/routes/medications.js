import express from "express";
import db from "../config/db.js";

const router = express.Router();

// Get all medications
router.get("/medications", (req, res) => {
  const sql = "SELECT * FROM medication ORDER BY medicationName";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// Get single medication
router.get("/medications/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = "SELECT * FROM medication WHERE medicationID = ?";
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Medication not found" });
    }
    
    res.json(results[0]);
  });
});

export default router;