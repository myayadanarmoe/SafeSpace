import express from "express";
import db from "../config/db.js";

const router = express.Router();

// Search patients by username/email
router.get("/users/search", (req, res) => {
  const { term } = req.query;
  
  if (!term) {
    return res.status(400).json({ message: "Search term required" });
  }
  
  const sql = `
    SELECT id, username, email, type 
    FROM users 
    WHERE username LIKE ? OR email LIKE ?
    LIMIT 20
  `;
  
  const searchPattern = `%${term}%`;
  
  db.query(sql, [searchPattern, searchPattern], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// Get medical records for a patient
router.get("/medicalrecords/patient/:patientId", (req, res) => {
  const { patientId } = req.params;
  
  const sql = `
    SELECT 
      mr.*,
      u.username as clinician_name,
      a.scheduled_date as appointment_date,
      a.scheduled_time as appointment_time,
      GROUP_CONCAT(DISTINCT d.diagnosisName) as diagnoses,
      GROUP_CONCAT(DISTINCT m.medicationName) as medications,
      GROUP_CONCAT(DISTINCT mo.moodName) as moods,
      GROUP_CONCAT(DISTINCT t.therapyName) as therapies
    FROM medicalrecord mr
    LEFT JOIN users u ON mr.clinicianID = u.id
    LEFT JOIN appointments a ON mr.appointmentID = a.appointmentID
    LEFT JOIN medicalrecorddiagnosis mrd ON mr.recordID = mrd.medicalRecordID
    LEFT JOIN diagnosis d ON mrd.diagnosisID = d.diagnosisID
    LEFT JOIN medicalrecordmedication mrm ON mr.recordID = mrm.medicalRecordID
    LEFT JOIN medication m ON mrm.medicationID = m.medicationID
    LEFT JOIN medicalrecordmood mrmo ON mr.recordID = mrmo.medicalRecordID
    LEFT JOIN mood mo ON mrmo.moodID = mo.moodID
    LEFT JOIN medicalrecordtherapy mrt ON mr.recordID = mrt.medicalRecordID
    LEFT JOIN therapy t ON mrt.therapyID = t.therapyID
    WHERE mr.patientID = ?
    GROUP BY mr.recordID
    ORDER BY mr.date DESC
  `;
  
  db.query(sql, [patientId], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    // Parse comma-separated strings to arrays
    const records = results.map(record => ({
      ...record,
      diagnoses: record.diagnoses ? record.diagnoses.split(',') : [],
      medications: record.medications ? record.medications.split(',') : [],
      moods: record.moods ? record.moods.split(',') : [],
      therapies: record.therapies ? record.therapies.split(',') : []
    }));
    
    res.json(records);
  });
});

// Get a single medical record by ID
router.get("/medicalrecords/:recordId", (req, res) => {
  const { recordId } = req.params;
  
  const sql = `
    SELECT 
      mr.*,
      u.username as clinician_name,
      p.username as patient_name,
      p.email as patient_email,
      a.scheduled_date as appointment_date,
      a.scheduled_time as appointment_time,
      GROUP_CONCAT(DISTINCT d.diagnosisName) as diagnoses,
      GROUP_CONCAT(DISTINCT m.medicationName) as medications,
      GROUP_CONCAT(DISTINCT mo.moodName) as moods,
      GROUP_CONCAT(DISTINCT t.therapyName) as therapies
    FROM medicalrecord mr
    LEFT JOIN users u ON mr.clinicianID = u.id
    LEFT JOIN users p ON mr.patientID = p.id
    LEFT JOIN appointments a ON mr.appointmentID = a.appointmentID
    LEFT JOIN medicalrecorddiagnosis mrd ON mr.recordID = mrd.medicalRecordID
    LEFT JOIN diagnosis d ON mrd.diagnosisID = d.diagnosisID
    LEFT JOIN medicalrecordmedication mrm ON mr.recordID = mrm.medicalRecordID
    LEFT JOIN medication m ON mrm.medicationID = m.medicationID
    LEFT JOIN medicalrecordmood mrmo ON mr.recordID = mrmo.medicalRecordID
    LEFT JOIN mood mo ON mrmo.moodID = mo.moodID
    LEFT JOIN medicalrecordtherapy mrt ON mr.recordID = mrt.medicalRecordID
    LEFT JOIN therapy t ON mrt.therapyID = t.therapyID
    WHERE mr.recordID = ?
    GROUP BY mr.recordID
  `;
  
  db.query(sql, [recordId], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Medical record not found" });
    }
    
    const record = results[0];
    record.diagnoses = record.diagnoses ? record.diagnoses.split(',') : [];
    record.medications = record.medications ? record.medications.split(',') : [];
    record.moods = record.moods ? record.moods.split(',') : [];
    record.therapies = record.therapies ? record.therapies.split(',') : [];
    
    res.json(record);
  });
});

// Create new medical record
router.post("/medicalrecords", (req, res) => {
  const { 
    patientId, 
    clinicianId, 
    appointmentId,
    symptoms, 
    riskAssessment, 
    treatmentPlan,
    diagnoses,
    medications,
    moods,
    therapies
  } = req.body;
  
  if (!patientId || !clinicianId || !symptoms) {
    return res.status(400).json({ message: "Patient ID, clinician ID, and symptoms are required" });
  }
  
  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ message: "Transaction error" });
    }
    
    // Insert medical record with appointment ID
    const insertSql = `
      INSERT INTO medicalrecord 
      (patientID, clinicianID, appointmentID, symptoms, riskAssessment, treatmentPlan, date) 
      VALUES (?, ?, ?, ?, ?, ?, CURDATE())
    `;
    
    db.query(insertSql, [patientId, clinicianId, appointmentId || null, symptoms, riskAssessment || 'Low', treatmentPlan || null], (insertErr, result) => {
      if (insertErr) {
        return db.rollback(() => {
          console.error("❌ MySQL error:", insertErr);
          res.status(500).json({ message: "Database error" });
        });
      }
      
      const recordId = result.insertId;
      let completed = 0;
      let hasError = false;
      const totalOperations = 4; // diagnoses, medications, moods, therapies
      
      // Helper to track completion
      const checkComplete = () => {
        completed++;
        if (completed === totalOperations && !hasError) {
          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => {
                res.status(500).json({ message: "Commit error" });
              });
            }
            res.status(201).json({ 
              message: "Medical record created successfully",
              recordId: recordId
            });
          });
        }
      };
      
      // Insert diagnoses
      if (diagnoses && diagnoses.length > 0) {
        let diagCompleted = 0;
        diagnoses.forEach(diagnosisId => {
          const diagSql = "INSERT INTO medicalrecorddiagnosis (medicalRecordID, diagnosisID) VALUES (?, ?)";
          db.query(diagSql, [recordId, diagnosisId], (diagErr) => {
            if (diagErr) {
              hasError = true;
              console.error("❌ MySQL error:", diagErr);
            }
            diagCompleted++;
            if (diagCompleted === diagnoses.length) {
              checkComplete();
            }
          });
        });
      } else {
        checkComplete();
      }
      
      // Insert medications
      if (medications && medications.length > 0) {
        let medCompleted = 0;
        medications.forEach(medicationId => {
          const medSql = "INSERT INTO medicalrecordmedication (medicalRecordID, medicationID) VALUES (?, ?)";
          db.query(medSql, [recordId, medicationId], (medErr) => {
            if (medErr) {
              hasError = true;
              console.error("❌ MySQL error:", medErr);
            }
            medCompleted++;
            if (medCompleted === medications.length) {
              checkComplete();
            }
          });
        });
      } else {
        checkComplete();
      }
      
      // Insert moods
      if (moods && moods.length > 0) {
        let moodCompleted = 0;
        moods.forEach(moodId => {
          const moodSql = "INSERT INTO medicalrecordmood (medicalRecordID, moodID) VALUES (?, ?)";
          db.query(moodSql, [recordId, moodId], (moodErr) => {
            if (moodErr) {
              hasError = true;
              console.error("❌ MySQL error:", moodErr);
            }
            moodCompleted++;
            if (moodCompleted === moods.length) {
              checkComplete();
            }
          });
        });
      } else {
        checkComplete();
      }
      
      // Insert therapies
      if (therapies && therapies.length > 0) {
        let therapyCompleted = 0;
        therapies.forEach(therapyId => {
          const therapySql = "INSERT INTO medicalrecordtherapy (medicalRecordID, therapyID) VALUES (?, ?)";
          db.query(therapySql, [recordId, therapyId], (therapyErr) => {
            if (therapyErr) {
              hasError = true;
              console.error("❌ MySQL error:", therapyErr);
            }
            therapyCompleted++;
            if (therapyCompleted === therapies.length) {
              checkComplete();
            }
          });
        });
      } else {
        checkComplete();
      }
    });
  });
});

// Update medical record
router.put("/medicalrecords/:recordId", (req, res) => {
  const { recordId } = req.params;
  const { 
    symptoms, 
    riskAssessment, 
    treatmentPlan,
    diagnoses,
    medications,
    moods,
    therapies
  } = req.body;
  
  if (!symptoms) {
    return res.status(400).json({ message: "Symptoms are required" });
  }
  
  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ message: "Transaction error" });
    }
    
    // Update medical record
    const updateSql = `
      UPDATE medicalrecord 
      SET symptoms = ?, riskAssessment = ?, treatmentPlan = ?
      WHERE recordID = ?
    `;
    
    db.query(updateSql, [symptoms, riskAssessment || 'Low', treatmentPlan || null, recordId], (updateErr, result) => {
      if (updateErr) {
        return db.rollback(() => {
          console.error("❌ MySQL error:", updateErr);
          res.status(500).json({ message: "Database error" });
        });
      }
      
      if (result.affectedRows === 0) {
        return db.rollback(() => {
          res.status(404).json({ message: "Medical record not found" });
        });
      }
      
      // Delete existing relationships
      const deleteDiagnoses = "DELETE FROM medicalrecorddiagnosis WHERE medicalRecordID = ?";
      const deleteMedications = "DELETE FROM medicalrecordmedication WHERE medicalRecordID = ?";
      const deleteMoods = "DELETE FROM medicalrecordmood WHERE medicalRecordID = ?";
      const deleteTherapies = "DELETE FROM medicalrecordtherapy WHERE medicalRecordID = ?";
      
      db.query(deleteDiagnoses, [recordId], (diagDelErr) => {
        if (diagDelErr) {
          return db.rollback(() => {
            console.error("❌ MySQL error:", diagDelErr);
            res.status(500).json({ message: "Database error" });
          });
        }
        
        db.query(deleteMedications, [recordId], (medDelErr) => {
          if (medDelErr) {
            return db.rollback(() => {
              console.error("❌ MySQL error:", medDelErr);
              res.status(500).json({ message: "Database error" });
            });
          }
          
          db.query(deleteMoods, [recordId], (moodDelErr) => {
            if (moodDelErr) {
              return db.rollback(() => {
                console.error("❌ MySQL error:", moodDelErr);
                res.status(500).json({ message: "Database error" });
              });
            }
            
            db.query(deleteTherapies, [recordId], (therapyDelErr) => {
              if (therapyDelErr) {
                return db.rollback(() => {
                  console.error("❌ MySQL error:", therapyDelErr);
                  res.status(500).json({ message: "Database error" });
                });
              }
              
              let completed = 0;
              let hasError = false;
              const totalOperations = 4;
              
              const checkComplete = () => {
                completed++;
                if (completed === totalOperations && !hasError) {
                  db.commit((commitErr) => {
                    if (commitErr) {
                      return db.rollback(() => {
                        res.status(500).json({ message: "Commit error" });
                      });
                    }
                    res.json({ message: "Medical record updated successfully" });
                  });
                }
              };
              
              // Insert new diagnoses
              if (diagnoses && diagnoses.length > 0) {
                let diagCompleted = 0;
                diagnoses.forEach(diagnosisId => {
                  const diagSql = "INSERT INTO medicalrecorddiagnosis (medicalRecordID, diagnosisID) VALUES (?, ?)";
                  db.query(diagSql, [recordId, diagnosisId], (diagErr) => {
                    if (diagErr) {
                      hasError = true;
                      console.error("❌ MySQL error:", diagErr);
                    }
                    diagCompleted++;
                    if (diagCompleted === diagnoses.length) {
                      checkComplete();
                    }
                  });
                });
              } else {
                checkComplete();
              }
              
              // Insert new medications
              if (medications && medications.length > 0) {
                let medCompleted = 0;
                medications.forEach(medicationId => {
                  const medSql = "INSERT INTO medicalrecordmedication (medicalRecordID, medicationID) VALUES (?, ?)";
                  db.query(medSql, [recordId, medicationId], (medErr) => {
                    if (medErr) {
                      hasError = true;
                      console.error("❌ MySQL error:", medErr);
                    }
                    medCompleted++;
                    if (medCompleted === medications.length) {
                      checkComplete();
                    }
                  });
                });
              } else {
                checkComplete();
              }
              
              // Insert new moods
              if (moods && moods.length > 0) {
                let moodCompleted = 0;
                moods.forEach(moodId => {
                  const moodSql = "INSERT INTO medicalrecordmood (medicalRecordID, moodID) VALUES (?, ?)";
                  db.query(moodSql, [recordId, moodId], (moodErr) => {
                    if (moodErr) {
                      hasError = true;
                      console.error("❌ MySQL error:", moodErr);
                    }
                    moodCompleted++;
                    if (moodCompleted === moods.length) {
                      checkComplete();
                    }
                  });
                });
              } else {
                checkComplete();
              }
              
              // Insert new therapies
              if (therapies && therapies.length > 0) {
                let therapyCompleted = 0;
                therapies.forEach(therapyId => {
                  const therapySql = "INSERT INTO medicalrecordtherapy (medicalRecordID, therapyID) VALUES (?, ?)";
                  db.query(therapySql, [recordId, therapyId], (therapyErr) => {
                    if (therapyErr) {
                      hasError = true;
                      console.error("❌ MySQL error:", therapyErr);
                    }
                    therapyCompleted++;
                    if (therapyCompleted === therapies.length) {
                      checkComplete();
                    }
                  });
                });
              } else {
                checkComplete();
              }
            });
          });
        });
      });
    });
  });
});

// Delete medical record
router.delete("/medicalrecords/:recordId", (req, res) => {
  const { recordId } = req.params;
  
  const sql = "DELETE FROM medicalrecord WHERE recordID = ?";
  
  db.query(sql, [recordId], (err, result) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Medical record not found" });
    }
    
    res.json({ message: "Medical record deleted successfully" });
  });
});

export default router;