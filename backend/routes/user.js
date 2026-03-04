import express from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Profile Update Route
router.put("/user/update", upload.single('profilePic'), async (req, res) => {
  console.log("👤 PROFILE UPDATE HIT");
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);

  const { userId, username, email, currentPassword, newPassword } = req.body;
  const profilePic = req.file ? `/uploads/${req.file.filename}` : null;

  if (!userId || !username || !email) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    db.query("SELECT * FROM users WHERE id = ?", [userId], async (err, results) => {
      if (err) {
        console.error("❌ MySQL error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = results[0];

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password is required to set new password" });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
      }

      let updateSql = "UPDATE users SET username = ?, email = ?";
      let updateParams = [username, email];

      if (newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updateSql += ", password = ?";
        updateParams.push(hashedPassword);
      }

      if (profilePic) {
        updateSql += ", profile_pic = ?";
        updateParams.push(profilePic);
      }

      updateSql += " WHERE id = ?";
      updateParams.push(userId);

      db.query(updateSql, updateParams, (err, result) => {
        if (err) {
          console.error("❌ MySQL error:", err);
          
          if (err.code === "ER_DUP_ENTRY") {
            if (err.sqlMessage.includes("username")) {
              return res.status(400).json({ message: "Username already exists" });
            } else {
              return res.status(400).json({ message: "Email already exists" });
            }
          }
          
          return res.status(500).json({ message: "Database error" });
        }

        db.query("SELECT id, username, email, type, profile_pic, created_at FROM users WHERE id = ?", [userId], (err, userData) => {
          if (err) {
            return res.json({ message: "Profile updated successfully" });
          }
          
          res.json({ 
            message: "Profile updated successfully",
            user: userData[0]
          });
        });
      });
    });
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Current User Route
router.get("/user/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = "SELECT id, username, email, type, profile_pic, created_at FROM users WHERE id = ?";
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(results[0]);
  });
});

export default router;