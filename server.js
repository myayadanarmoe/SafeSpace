import express from "express";
import mysql from "mysql2";
import bcrypt from "bcrypt";
import cors from "cors";

const app = express();
const PORT = 5000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());

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

// ===== Test Route =====
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// ===== Signup Route =====
app.post("/signup", async (req, res) => {
  console.log("🔥 SIGNUP HIT");
  console.log("BODY:", req.body);

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (email, password) VALUES (?, ?)";

    db.query(sql, [username, hashedPassword], (err) => {
      if (err) {
        console.error("❌ MySQL error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "Username already exists" });
        }

        return res.status(500).json({ message: "Database error" });
      }

      res.status(201).json({ message: "User created successfully" });
    });
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== ADMIN ROUTES =====

// Get all users with pagination and search
app.get("/api/admin/users", (req, res) => {
  const { search = '', page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  let countQuery = "SELECT COUNT(*) as total FROM users";
  let query = "SELECT id, email, type, created_at FROM users";
  let queryParams = [];
  let countParams = [];

  if (search) {
    const searchPattern = `%${search}%`;
    query += " WHERE email LIKE ? OR type LIKE ?";
    countQuery += " WHERE email LIKE ? OR type LIKE ?";
    queryParams = [searchPattern, searchPattern];
    countParams = [searchPattern, searchPattern];
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

// Get single user by ID
app.get("/api/admin/users/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = "SELECT id, email, type, created_at FROM users WHERE id = ?";
  
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

// Create new user (admin)
app.post("/api/admin/users", async (req, res) => {
  const { email, password, type = 'Free User' } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const sql = "INSERT INTO users (email, password, type) VALUES (?, ?, ?)";
    
    db.query(sql, [email, hashedPassword, type], (err, result) => {
      if (err) {
        console.error("❌ MySQL error:", err);
        
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "Email already exists" });
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