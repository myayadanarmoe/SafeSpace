import express from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js";

const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
  console.log("🔥 SIGNUP HIT");
  console.log("BODY:", req.body);

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Basic length check (frontend already validates pattern)
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (name, email, password, type) VALUES (?, ?, ?, 'Standard User')";

    db.query(sql, [name, email, hashedPassword], (err, result) => {
      if (err) {
        console.error("❌ MySQL error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          if (err.sqlMessage.includes("email")) {
            return res.status(400).json({ message: "Email already exists" });
          }
        }

        return res.status(500).json({ message: "Database error" });
      }

      const userId = result.insertId;
      db.query("SELECT id, name, email, type, profile_pic, created_at FROM users WHERE id = ?", [userId], (err, userData) => {
        if (err) {
          return res.status(201).json({ message: "User created successfully" });
        }
        res.status(201).json({ 
          message: "User created successfully",
          user: userData[0]
        });
      });
    });
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  console.log("🔐 LOGIN HIT");
  console.log("BODY:", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const sql = "SELECT id, name, email, type, profile_pic, created_at, password FROM users WHERE email = ?";
    
    db.query(sql, [email], async (err, results) => {
      if (err) {
        console.error("❌ MySQL error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ 
        message: "Login successful",
        user: userWithoutPassword
      });
    });
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout Route
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

export default router;