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

// Get appointments for a specific date (for staff schedule)
router.get("/appointments/date/:date", (req, res) => {
  const { date } = req.params;
  
  const sql = `
    SELECT 
      a.*,
      p.username as patient_name,
      p.email as patient_email,
      p.type as patient_type,
      c.username as clinician_name,
      c.email as clinician_email
    FROM appointments a
    JOIN users p ON a.patientID = p.id
    JOIN users c ON a.clinicianID = c.id
    WHERE a.scheduled_date = ?
    ORDER BY a.scheduled_time ASC
  `;
  
  db.query(sql, [date], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// Get appointments for a specific clinician on a specific date
router.get("/appointments/clinician/:clinicianId/date/:date", (req, res) => {
  const { clinicianId, date } = req.params;
  
  const sql = `
    SELECT 
      a.*,
      p.username as patient_name,
      p.email as patient_email,
      p.type as patient_type,
      c.username as clinician_name,
      c.email as clinician_email
    FROM appointments a
    JOIN users p ON a.patientID = p.id
    JOIN users c ON a.clinicianID = c.id
    WHERE a.clinicianID = ? AND a.scheduled_date = ?
    ORDER BY a.scheduled_time ASC
  `;
  
  db.query(sql, [clinicianId, date], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// Get appointments for a specific clinician on a specific date (for checking availability)
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
  const { patientId, clinicianId, date, time, type = 'online', roomNumber } = req.body;
  
  console.log("Booking appointment with data:", { patientId, clinicianId, date, time, type, roomNumber });
  
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
      (patientID, clinicianID, scheduled_date, scheduled_time, appointment_type, status, room_number) 
      VALUES (?, ?, ?, ?, ?, 'scheduled', ?)
    `;
    
    db.query(insertSql, [patientId, clinicianId, date, time, type, roomNumber || null], (insertErr, result) => {
      if (insertErr) {
        console.error("❌ MySQL error:", insertErr);
        return res.status(500).json({ message: "Database error" });
      }
      
      console.log("Appointment created with ID:", result.insertId);
      
      res.status(201).json({ 
        message: "Appointment booked successfully",
        appointmentId: result.insertId
      });
    });
  });
});

// Update appointment status
router.put("/appointments/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['scheduled', 'completed', 'cancelled', 'no-show'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  
  const sql = "UPDATE appointments SET status = ? WHERE appointmentID = ?";
  
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    res.json({ message: `Appointment marked as ${status}` });
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

// Update room number
router.put("/appointments/:id/room", (req, res) => {
  const { id } = req.params;
  const { roomNumber } = req.body;
  
  if (!roomNumber) {
    return res.status(400).json({ message: "Room number is required" });
  }
  
  const sql = "UPDATE appointments SET room_number = ? WHERE appointmentID = ?";
  
  db.query(sql, [roomNumber, id], (err, result) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    res.json({ message: "Room updated successfully" });
  });
});

// Update meeting link
router.put("/appointments/:id/meeting-link", (req, res) => {
  const { id } = req.params;
  const { meetingLink } = req.body;
  
  if (!meetingLink) {
    return res.status(400).json({ message: "Meeting link is required" });
  }
  
  const sql = "UPDATE appointments SET meeting_link = ? WHERE appointmentID = ?";
  
  db.query(sql, [meetingLink, id], (err, result) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    res.json({ message: "Meeting link updated successfully" });
  });
});

// Check-in patient
// Check-in patient (mark as completed)
router.put("/appointments/:id/checkin", (req, res) => {
  const { id } = req.params;
  
  const sql = "UPDATE appointments SET status = 'completed' WHERE appointmentID = ? AND status = 'scheduled'";
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Appointment not found or already completed" });
    }
    
    res.json({ message: "Patient checked in successfully" });
  });
});

// Reschedule appointment
router.put("/appointments/:id/reschedule", (req, res) => {
  const { id } = req.params;
  const { newDate, newTime, newRoomNumber } = req.body;
  
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
      let updateSql = `
        UPDATE appointments 
        SET scheduled_date = ?, scheduled_time = ?, status = 'rescheduled', rescheduled_from = ?
      `;
      
      const params = [newDate, newTime, original.appointmentID];
      
      // If new room number is provided for offline appointment, update it
      if (newRoomNumber) {
        updateSql += `, room_number = ?`;
        params.push(newRoomNumber);
      }
      
      updateSql += ` WHERE appointmentID = ?`;
      params.push(id);
      
      db.query(updateSql, params, (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ message: "Database error" });
        }
        
        res.json({ message: "Appointment rescheduled successfully" });
      });
    });
  });
});

export default router;