import express from "express";
import db from "../config/db.js";

const router = express.Router();

// Get availability for a clinician
router.get("/availability/:clinicianId", (req, res) => {
  const { clinicianId } = req.params;
  
  console.log("🔍 Fetching availability for user ID:", clinicianId);
  
  // Using userID column name
  const sql = "SELECT * FROM clinicianavailability WHERE userID = ? ORDER BY FIELD(day_of_the_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), startTime";
  
  db.query(sql, [clinicianId], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    res.json({ availability: results });
  });
});

// Add availability slot with validation
router.post("/availability", (req, res) => {
  const { clinicianID, day_of_the_week, startTime, endTime } = req.body;
  
  if (!clinicianID || !day_of_the_week || !startTime || !endTime) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  
  // Validate that end time is after start time
  if (startTime >= endTime) {
    return res.status(400).json({ message: "End time must be after start time" });
  }
  
  // Check for overlapping slots - using userID column
  const overlapSql = `
    SELECT * FROM clinicianavailability 
    WHERE userID = ? 
    AND day_of_the_week = ?
    AND (
      (startTime <= ? AND endTime > ?) OR
      (startTime < ? AND endTime >= ?) OR
      (startTime >= ? AND endTime <= ?)
    )
  `;
  
  db.query(overlapSql, [
    clinicianID, 
    day_of_the_week, 
    endTime, startTime,
    endTime, endTime,
    startTime, endTime
  ], (overlapErr, overlapResults) => {
    if (overlapErr) {
      console.error("❌ MySQL error:", overlapErr);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (overlapResults.length > 0) {
      return res.status(400).json({ message: "This time slot overlaps with existing availability" });
    }
    
    // Insert using userID column
    const insertSql = "INSERT INTO clinicianavailability (userID, day_of_the_week, startTime, endTime) VALUES (?, ?, ?, ?)";
    
    db.query(insertSql, [clinicianID, day_of_the_week, startTime, endTime], (err, result) => {
      if (err) {
        console.error("❌ MySQL error:", err);
        return res.status(500).json({ message: "Database error" });
      }
      
      res.status(201).json({ 
        message: "Availability added successfully",
        availabilityID: result.insertId
      });
    });
  });
});

// Delete availability slot
router.delete("/availability/:availabilityId", (req, res) => {
  const { availabilityId } = req.params;
  
  const sql = "DELETE FROM clinicianavailability WHERE availabilityID = ?";
  
  db.query(sql, [availabilityId], (err, result) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Availability slot not found" });
    }
    
    res.json({ message: "Availability deleted successfully" });
  });
});

// Update availability slot
router.put("/availability/:availabilityId", (req, res) => {
  const { availabilityId } = req.params;
  const { day_of_the_week, startTime, endTime } = req.body;
  
  const sql = "UPDATE clinicianavailability SET day_of_the_week = ?, startTime = ?, endTime = ? WHERE availabilityID = ?";
  
  db.query(sql, [day_of_the_week, startTime, endTime, availabilityId], (err, result) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Availability slot not found" });
    }
    
    res.json({ message: "Availability updated successfully" });
  });
});

export default router;