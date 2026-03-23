import express from "express";
import db from "../config/db.js";

const router = express.Router();

// Get all clinicians with their details
router.get("/clinicians", (req, res) => {
  const { search = '' } = req.query;
  
  let sql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.type,
      u.profile_pic,
      MAX(c.licenseNumber) as licenseNumber,
      MAX(c.about) as about,
      MAX(c.phone) as phone,
      MAX(c.address) as address,
      MAX(c.primary_branch_id) as primary_branch_id,
      GROUP_CONCAT(DISTINCT d.diagnosisName) as diagnoses
    FROM users u
    INNER JOIN clinicians c ON u.id = c.userID
    LEFT JOIN user_diagnosis ud ON u.id = ud.userID
    LEFT JOIN diagnosis d ON ud.diagnosisID = d.diagnosisID
    WHERE u.type IN ('Psychiatrist', 'Psychologist', 'Therapist')
  `;
  
  const queryParams = [];
  
  if (search) {
    sql += ` AND (u.name LIKE ? OR c.about LIKE ? OR d.diagnosisName LIKE ?)`;
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern);
  }
  
  sql += ` GROUP BY u.id ORDER BY u.name`;
  
  console.log("Executing SQL:", sql);
  console.log("With params:", queryParams);
  
  db.query(sql, queryParams, (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error", error: err.message });
    }
    
    console.log("Query results:", results);
    
    // Parse diagnoses string to array
    const clinicians = results.map(doc => ({
      id: doc.id,
      name: doc.name,
      email: doc.email,
      type: doc.type,
      profile_pic: doc.profile_pic ? `http://localhost:5000${doc.profile_pic}` : null,
      licenseNumber: doc.licenseNumber,
      about: doc.about || "Experienced mental health professional dedicated to providing compassionate care.",
      phone: doc.phone,
      address: doc.address,
      branch_id: doc.primary_branch_id,
      diagnoses: doc.diagnoses ? doc.diagnoses.split(',') : []
    }));
    
    res.json(clinicians);
  });
});

// Get single clinician by ID
router.get("/clinicians/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.type,
      u.profile_pic,
      MAX(c.licenseNumber) as licenseNumber,
      MAX(c.about) as about,
      MAX(c.phone) as phone,
      MAX(c.address) as address,
      MAX(c.primary_branch_id) as primary_branch_id,
      GROUP_CONCAT(DISTINCT d.diagnosisName) as diagnoses
    FROM users u
    INNER JOIN clinicians c ON u.id = c.userID
    LEFT JOIN user_diagnosis ud ON u.id = ud.userID
    LEFT JOIN diagnosis d ON ud.diagnosisID = d.diagnosisID
    WHERE u.id = ? AND u.type IN ('Psychiatrist', 'Psychologist', 'Therapist')
    GROUP BY u.id
  `;
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error", error: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "Clinician not found" });
    }
    
    const clinician = results[0];
    clinician.diagnoses = clinician.diagnoses ? clinician.diagnoses.split(',') : [];
    clinician.profile_pic = clinician.profile_pic ? `http://localhost:5000${clinician.profile_pic}` : null;
    clinician.about = clinician.about || "Experienced mental health professional dedicated to providing compassionate care.";
    
    res.json(clinician);
  });
});

export default router;