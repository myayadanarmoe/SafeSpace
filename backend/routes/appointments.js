import express from "express";
import db from "../config/db.js";
import { checkAppointmentEligibility, incrementMonthlyAppointmentCount } from "../middleware/subscriptionCheck.js";

const router = express.Router();

// Helper function to generate token number
function generateTokenNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TKN${year}${month}${day}-${random}`;
}

// Get appointments for a patient
router.get("/appointments/patient/:patientId", (req, res) => {
  const { patientId } = req.params;
  
  const sql = `
    SELECT 
      a.*,
      u.name as clinician_name,
      u.email as clinician_email,
      r.room_number,
      b.city as branch_city
    FROM appointments a
    JOIN clinicians c ON a.clinicianID = c.clinicianID
    JOIN users u ON c.userID = u.id
    LEFT JOIN rooms r ON a.room_id = r.room_id
    LEFT JOIN branches b ON r.branch_id = b.branch_id
    WHERE a.user_id = ?
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

// Get monthly appointment count for a user (for subscription limits)
router.get("/appointments/patient/:userId/monthly-count", (req, res) => {
  const { userId } = req.params;
  
  const sql = `
    SELECT COUNT(*) as count 
    FROM appointments 
    WHERE user_id = ? 
    AND status IN ('scheduled', 'completed')
    AND scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  `;
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json({ count: results[0].count, max: 2 });
  });
});

// Get appointments for a clinician
router.get("/appointments/clinician/:clinicianId", (req, res) => {
  const { clinicianId } = req.params;
  
  const sql = `
    SELECT 
      a.*,
      u.name as patient_name,
      u.email as patient_email,
      r.room_number,
      b.city as branch_city
    FROM appointments a
    JOIN users u ON a.user_id = u.id
    LEFT JOIN rooms r ON a.room_id = r.room_id
    LEFT JOIN branches b ON r.branch_id = b.branch_id
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
      p.name as patient_name,
      p.email as patient_email,
      u.name as clinician_name,
      u.email as clinician_email,
      r.room_number,
      b.city as branch_city
    FROM appointments a
    JOIN users p ON a.user_id = p.id
    JOIN clinicians c ON a.clinicianID = c.clinicianID
    JOIN users u ON c.userID = u.id
    LEFT JOIN rooms r ON a.room_id = r.room_id
    LEFT JOIN branches b ON r.branch_id = b.branch_id
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
      p.name as patient_name,
      p.email as patient_email,
      r.room_number,
      b.city as branch_city
    FROM appointments a
    JOIN users p ON a.user_id = p.id
    LEFT JOIN rooms r ON a.room_id = r.room_id
    LEFT JOIN branches b ON r.branch_id = b.branch_id
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

// Get appointments by token number (for check-in)
router.get("/appointments/token/:token", (req, res) => {
  const { token } = req.params;
  
  const sql = `
    SELECT 
      a.*,
      u.name as patient_name,
      u.email as patient_email,
      u2.name as clinician_name,
      r.room_number,
      b.city as branch_city
    FROM appointments a
    JOIN users u ON a.user_id = u.id
    JOIN clinicians c ON a.clinicianID = c.clinicianID
    JOIN users u2 ON c.userID = u2.id
    LEFT JOIN rooms r ON a.room_id = r.room_id
    LEFT JOIN branches b ON r.branch_id = b.branch_id
    WHERE a.token_number = ?
  `;
  
  db.query(sql, [token], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    res.json(results[0]);
  });
});

// Check availability
router.get("/appointments/check", (req, res) => {
  const { clinicianId, date } = req.query;
  
  const sql = `
    SELECT scheduled_time 
    FROM appointments 
    WHERE clinicianID = ? 
    AND scheduled_date = ?
    AND status IN ('scheduled', 'completed')
  `;
  
  db.query(sql, [clinicianId, date], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results.map(a => a.scheduled_time));
  });
});

// Create new appointment with token and subscription check
router.post("/appointments", checkAppointmentEligibility, (req, res) => {
  const { patientId, clinicianId, date, time, type = 'online', roomId } = req.body;
  
  console.log("📝 Booking appointment with data:", { patientId, clinicianId, date, time, type, roomId });
  
  if (!patientId || !clinicianId || !date || !time) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  
  // First, get the actual clinician ID from the clinicians table using the user ID
  const getClinicianIdSql = `SELECT clinicianID FROM clinicians WHERE userID = ?`;
  
  db.query(getClinicianIdSql, [clinicianId], (getErr, getResults) => {
    if (getErr) {
      console.error("❌ MySQL error:", getErr);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (getResults.length === 0) {
      return res.status(404).json({ message: "Clinician not found" });
    }
    
    const actualClinicianId = getResults[0].clinicianID;
    
    // Check if slot is already booked
    const checkSql = `
      SELECT * FROM appointments 
      WHERE clinicianID = ? 
      AND scheduled_date = ? 
      AND scheduled_time = ?
      AND status IN ('scheduled', 'completed')
    `;
    
    db.query(checkSql, [actualClinicianId, date, time], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("❌ MySQL error:", checkErr);
        return res.status(500).json({ message: "Database error" });
      }
      
      if (checkResults.length > 0) {
        return res.status(400).json({ message: "This time slot is already booked" });
      }
      
      // For offline appointments, check if room is available
      if (type === 'offline' && roomId) {
        const checkRoomSql = `
          SELECT * FROM appointments 
          WHERE room_id = ? 
          AND scheduled_date = ? 
          AND scheduled_time = ?
          AND status IN ('scheduled', 'completed')
        `;
        
        db.query(checkRoomSql, [roomId, date, time], (roomErr, roomResults) => {
          if (roomErr) {
            console.error("❌ MySQL error:", roomErr);
            return res.status(500).json({ message: "Database error" });
          }
          
          if (roomResults.length > 0) {
            return res.status(400).json({ message: "This room is already booked for this time" });
          }
          
          createAppointment(patientId, actualClinicianId, date, time, type, roomId, res);
        });
      } else {
        createAppointment(patientId, actualClinicianId, date, time, type, null, res);
      }
    });
  });
});

// Helper function to create appointment with token and update monthly count
function createAppointment(patientId, actualClinicianId, date, time, type, roomId, res) {
  const tokenNumber = generateTokenNumber();
  
  const insertSql = `
    INSERT INTO appointments 
    (user_id, clinicianID, scheduled_date, scheduled_time, appointment_type, status, room_id, token_number) 
    VALUES (?, ?, ?, ?, ?, 'scheduled', ?, ?)
  `;
  
  db.query(insertSql, [patientId, actualClinicianId, date, time, type, roomId, tokenNumber], (insertErr, result) => {
    if (insertErr) {
      console.error("❌ MySQL error:", insertErr);
      return res.status(500).json({ message: "Database error" });
    }
    
    console.log("✅ Appointment created with ID:", result.insertId, "Token:", tokenNumber);
    
    // Update monthly appointment count for youth users
    const userSql = "SELECT type FROM users WHERE id = ?";
    db.query(userSql, [patientId], (err, userResults) => {
      if (!err && userResults.length > 0 && userResults[0].type === 'Youth User') {
        incrementMonthlyAppointmentCount(patientId).catch(err => {
          console.error("Error updating monthly count:", err);
        });
      }
    });
    
    res.status(201).json({ 
      message: "Appointment booked successfully",
      appointmentId: result.insertId,
      tokenNumber: tokenNumber
    });
  });
}

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

// Update room
router.put("/appointments/:id/room", (req, res) => {
  const { id } = req.params;
  const { roomId } = req.body;
  
  const sql = "UPDATE appointments SET room_id = ? WHERE appointmentID = ?";
  
  db.query(sql, [roomId, id], (err, result) => {
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
  const { newDate, newTime, newRoomId } = req.body;
  
  const getSql = "SELECT * FROM appointments WHERE appointmentID = ?";
  
  db.query(getSql, [id], (getErr, getResults) => {
    if (getErr || getResults.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    const original = getResults[0];
    
    const checkSql = `
      SELECT * FROM appointments 
      WHERE clinicianID = ? 
      AND scheduled_date = ? 
      AND scheduled_time = ?
      AND status IN ('scheduled', 'completed')
      AND appointmentID != ?
    `;
    
    db.query(checkSql, [original.clinicianID, newDate, newTime, id], (checkErr, checkResults) => {
      if (checkErr) {
        return res.status(500).json({ message: "Database error" });
      }
      
      if (checkResults.length > 0) {
        return res.status(400).json({ message: "New time slot is not available" });
      }
      
      if (original.appointment_type === 'offline' && newRoomId) {
        const checkRoomSql = `
          SELECT * FROM appointments 
          WHERE room_id = ? 
          AND scheduled_date = ? 
          AND scheduled_time = ?
          AND status IN ('scheduled', 'completed')
          AND appointmentID != ?
        `;
        
        db.query(checkRoomSql, [newRoomId, newDate, newTime, id], (roomErr, roomResults) => {
          if (roomErr) {
            return res.status(500).json({ message: "Database error" });
          }
          
          if (roomResults.length > 0) {
            return res.status(400).json({ message: "Room is not available at this time" });
          }
          
          updateAppointment(id, newDate, newTime, newRoomId, original, res);
        });
      } else {
        updateAppointment(id, newDate, newTime, null, original, res);
      }
    });
  });
});

function updateAppointment(id, newDate, newTime, newRoomId, original, res) {
  const updateSql = `
    UPDATE appointments 
    SET scheduled_date = ?, scheduled_time = ?, status = 'scheduled', 
        rescheduled_from = ?, room_id = COALESCE(?, room_id)
    WHERE appointmentID = ?
  `;
  
  db.query(updateSql, [newDate, newTime, original.appointmentID, newRoomId, id], (updateErr) => {
    if (updateErr) {
      return res.status(500).json({ message: "Database error" });
    }
    
    res.json({ message: "Appointment rescheduled successfully" });
  });
}

export default router;