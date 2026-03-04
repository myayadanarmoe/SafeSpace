import express from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js";

const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
  console.log("🔥 SIGNUP HIT");
  console.log("BODY:", req.body);

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";

    db.query(sql, [username, email, hashedPassword], (err, result) => {
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

      const userId = result.insertId;
      db.query("SELECT id, username, email, type, profile_pic, created_at FROM users WHERE id = ?", [userId], (err, userData) => {
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
    console.log("🔍 Searching for user with email:", email);
    
    const sql = "SELECT * FROM users WHERE email = ?";
    
    db.query(sql, [email], async (err, results) => {
      if (err) {
        console.error("❌ MySQL error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      console.log(`📊 Found ${results.length} users`);

      if (results.length === 0) {
        console.log("❌ No user found with email:", email);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = results[0];
      console.log("✅ User found:", { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        type: user.type 
      });

      console.log("🔑 Comparing passwords...");
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log("🔑 Password valid:", isPasswordValid);

      if (!isPasswordValid) {
        console.log("❌ Invalid password for email:", email);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const { password: _, ...userWithoutPassword } = user;
      
      console.log("✅ Login successful for:", email);
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