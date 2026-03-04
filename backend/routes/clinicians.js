import express from "express";
import db from "../config/db.js";

const router = express.Router();

// Get all clinicians (Psychiatrists, Psychologists, Therapists)
router.get("/clinicians", (req, res) => {
  const sql = "SELECT id, username, email, type FROM users WHERE type IN ('Psychiatrist', 'Psychologist', 'Therapist') ORDER BY username";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    res.json({ clinicians: results });
  });
});

// Get single clinician by ID
router.get("/clinicians/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = "SELECT id, username, email, type FROM users WHERE id = ? AND type IN ('Psychiatrist', 'Psychologist', 'Therapist')";
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Clinician not found" });
    }
    
    res.json(results[0]);
  });
});

export default router;