import express from "express";
import mysql from "mysql2";
import bcrypt from "bcrypt";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// ===== Middleware =====
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== MySQL Connection =====
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "safespace",
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection error:", err);
    return;
  }
  console.log("✅ Connected to MySQL");
});

// ===== Create uploads directory if it doesn't exist =====
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
  console.log("✅ Created uploads directory");
}

// ===== Multer Configuration for file uploads =====
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ===== Test Route =====
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// ===== Signup Route (Updated with username and email) =====
app.post("/signup", async (req, res) => {
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

      // Return user data (excluding password)
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

// ===== Login Route (Email only) =====
app.post("/login", async (req, res) => {
  console.log("🔐 LOGIN HIT");
  console.log("BODY:", req.body);

  const { email, password } = req.body; // Changed from username to email

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    console.log("🔍 Searching for user with email:", email);
    
    // Find user by email only
    const sql = "SELECT * FROM users WHERE email = ?";
    
    db.query(sql, [email], async (err, results) => {
      if (err) {
        console.error("❌ MySQL error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      console.log(`📊 Found ${results.length} users`);

      // Check if user exists
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

      // Compare password
      console.log("🔑 Comparing passwords...");
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log("🔑 Password valid:", isPasswordValid);

      if (!isPasswordValid) {
        console.log("❌ Invalid password for email:", email);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Login successful - return user info (excluding password)
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

// ===== Profile Update Route =====
app.put("/api/user/update", upload.single('profilePic'), async (req, res) => {
  console.log("👤 PROFILE UPDATE HIT");
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);

  const { userId, username, email, currentPassword, newPassword } = req.body;
  const profilePic = req.file ? `/uploads/${req.file.filename}` : null;

  if (!userId || !username || !email) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // First, get the current user data
    db.query("SELECT * FROM users WHERE id = ?", [userId], async (err, results) => {
      if (err) {
        console.error("❌ MySQL error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = results[0];

      // If changing password, verify current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password is required to set new password" });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
      }

      // Build update query
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

        // Get updated user data
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

// ===== Get Current User Route =====
app.get("/api/user/:id", (req, res) => {
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

// ===== Logout Route =====
app.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// ===== ADMIN ROUTES (Updated with username and profile_pic) =====

// Get all users with pagination and search
app.get("/api/admin/users", (req, res) => {
  const { search = '', page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  let countQuery = "SELECT COUNT(*) as total FROM users";
  let query = "SELECT id, username, email, type, profile_pic, created_at FROM users";
  let queryParams = [];
  let countParams = [];

  if (search) {
    const searchPattern = `%${search}%`;
    query += " WHERE username LIKE ? OR email LIKE ? OR type LIKE ?";
    countQuery += " WHERE username LIKE ? OR email LIKE ? OR type LIKE ?";
    queryParams = [searchPattern, searchPattern, searchPattern];
    countParams = [searchPattern, searchPattern, searchPattern];
  }

  query += " ORDER BY id DESC LIMIT ? OFFSET ?";
  queryParams.push(parseInt(limit), parseInt(offset));

  // Get total count
  db.query(countQuery, countParams, (countErr, countResult) => {
    if (countErr) {
      console.error("❌ Count query error:", countErr);
      return res.status(500).json({ message: "Database error" });
    }

    const total = countResult[0].total;

    // Get paginated users
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error("❌ MySQL error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({
        users: results,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      });
    });
  });
});

// Get single user by ID (admin)
app.get("/api/admin/users/:id", (req, res) => {
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

// Update user role
app.put("/api/admin/users/:id/role", (req, res) => {
  const { id } = req.params;
  const { type } = req.body;
  
  const validTypes = [
    'Free User',
    'Premium User',
    'Youth User',
    'Staff',
    'Admin',
    'Psychiatrist',
    'Psychologist',
    'Therapist'
  ];
  
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: "Invalid user type" });
  }
  
  const sql = "UPDATE users SET type = ? WHERE id = ?";
  
  db.query(sql, [type, id], (err, result) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User role updated successfully" });
  });
});

// Create new user (admin) - Updated with username
app.post("/api/admin/users", async (req, res) => {
  const { username, email, password, type = 'Free User' } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email and password are required" });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const sql = "INSERT INTO users (username, email, password, type) VALUES (?, ?, ?, ?)";
    
    db.query(sql, [username, email, hashedPassword, type], (err, result) => {
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
      
      res.status(201).json({ 
        message: "User created successfully",
        userId: result.insertId 
      });
    });
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user
app.delete("/api/admin/users/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = "DELETE FROM users WHERE id = ?";
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User deleted successfully" });
  });
});

// Get all available user types
app.get("/api/admin/user-types", (req, res) => {
  const types = [
    'Free User',
    'Premium User',
    'Youth User',
    'Staff',
    'Admin',
    'Psychiatrist',
    'Psychologist',
    'Therapist'
  ];
  
  res.json(types);
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});