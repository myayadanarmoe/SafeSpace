import express from "express";
import path from "path";
import { fileURLToPath } from 'url';

import corsMiddleware from "./middleware/cors.js";
import db from "./config/db.js";

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js";
import availabilityRoutes from "./routes/availability.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// ===== Middleware =====
app.use(corsMiddleware);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== Test Route =====
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// ===== Routes =====
app.use("/api", authRoutes);        // /api/signup, /api/login, /api/logout
app.use("/api", userRoutes);         // /api/user/update, /api/user/:id
app.use("/api", adminRoutes);        // /api/admin/...
app.use("/api", availabilityRoutes); // /api/availability/...

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});