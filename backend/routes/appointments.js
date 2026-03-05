import express from "express";
import db from "../config/db.js";

const router = express.Router();

// Get appointments for a patient
router.get("/appointments/patient/:patientId", (req, res) => {
  const { patientId } = req.params;
  
  const sql = `
    SELECT 
      a.*,
      u.username as clinician_name,
      u.email as clinician_email
    FROM appointments a
    JOIN users u ON a.clinicianID = u.id
    WHERE a.patientID = ?
    ORDER BY a.scheduled_date DESC, a.scheduled_time DESC
  `;
  
  db.query(sql, [patientId], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// Get appointments for a clinician
router.get("/appointments/clinician/:clinicianId", (req, res) => {
  const { clinicianId } = req.params;
  
  const sql = `
    SELECT 
      a.*,
      u.username as patient_name,
      u.email as patient_email
    FROM appointments a
    JOIN users u ON a.patientID = u.id
    WHERE a.clinicianID = ?
    ORDER BY a.scheduled_date DESC, a.scheduled_time DESC
  `;
  
  db.query(sql, [clinicianId], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// Get appointments for a specific clinician on a specific date
router.get("/appointments/check", (req, res) => {
  const { clinicianId, date } = req.query;
  
  const sql = `
    SELECT scheduled_time 
    FROM appointments 
    WHERE clinicianID = ? 
    AND scheduled_date = ?
    AND status IN ('scheduled', 'rescheduled')
  `;
  
  db.query(sql, [clinicianId, date], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results.map(a => a.scheduled_time));
  });
});

// Create new appointment
router.post("/appointments", (req, res) => {
  const { patientId, clinicianId, date, time, type = 'online' } = req.body;
  
  if (!patientId || !clinicianId || !date || !time) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  
  // Check if slot is already booked
  const checkSql = `
    SELECT * FROM appointments 
    WHERE clinicianID = ? 
    AND scheduled_date = ? 
    AND scheduled_time = ?
    AND status IN ('scheduled', 'rescheduled')
  `;
  
  db.query(checkSql, [clinicianId, date, time], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("❌ MySQL error:", checkErr);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (checkResults.length > 0) {
      return res.status(400).json({ message: "This time slot is already booked" });
    }
    
    // Create appointment
    const insertSql = `
      INSERT INTO appointments 
      (patientID, clinicianID, scheduled_date, scheduled_time, appointment_type, status) 
      VALUES (?, ?, ?, ?, ?, 'scheduled')
    `;
    
    db.query(insertSql, [patientId, clinicianId, date, time, type], (insertErr, result) => {
      if (insertErr) {
        console.error("❌ MySQL error:", insertErr);
        return res.status(500).json({ message: "Database error" });
      }
      
      res.status(201).json({ 
        message: "Appointment booked successfully",
        appointmentId: result.insertId
      });
    });
  });
});

// Cancel appointment
router.put("/appointments/:id/cancel", (req, res) => {
  const { id } = req.params;
  
  const sql = "UPDATE appointments SET status = 'cancelled' WHERE appointmentID = ?";
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    res.json({ message: "Appointment cancelled successfully" });
  });
});

// Reschedule appointment
router.put("/appointments/:id/reschedule", (req, res) => {
  const { id } = req.params;
  const { newDate, newTime } = req.body;
  
  // First get the original appointment
  const getSql = "SELECT * FROM appointments WHERE appointmentID = ?";
  
  db.query(getSql, [id], (getErr, getResults) => {
    if (getErr || getResults.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    const original = getResults[0];
    
    // Check if new slot is available
    const checkSql = `
      SELECT * FROM appointments 
      WHERE clinicianID = ? 
      AND scheduled_date = ? 
      AND scheduled_time = ?
      AND status IN ('scheduled', 'rescheduled')
      AND appointmentID != ?
    `;
    
    db.query(checkSql, [original.clinicianID, newDate, newTime, id], (checkErr, checkResults) => {
      if (checkErr) {
        return res.status(500).json({ message: "Database error" });
      }
      
      if (checkResults.length > 0) {
        return res.status(400).json({ message: "New time slot is not available" });
      }
      
      // Update the appointment
      const updateSql = `
        UPDATE appointments 
        SET scheduled_date = ?, scheduled_time = ?, status = 'rescheduled', rescheduled_from = ?
        WHERE appointmentID = ?
      `;
      
      db.query(updateSql, [newDate, newTime, original.appointmentID, id], (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ message: "Database error" });
        }
        
        res.json({ message: "Appointment rescheduled successfully" });
      });
    });
  });
});

export default router;