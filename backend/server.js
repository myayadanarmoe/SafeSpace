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
import cliniciansRoutes from "./routes/clinicians.js";
import appointmentsRoutes from "./routes/appointments.js";
import medicationsRoutes from "./routes/medications.js";
import moodsRoutes from "./routes/moods.js";
import therapiesRoutes from "./routes/therapies.js";
import medicalrecordsRoutes from "./routes/medicalrecords.js";
import branchesRoutes from "./routes/branches.js";
import roomsRoutes from "./routes/rooms.js";
import paymentRoutes from "./routes/payments.js";
import verificationRoutes from "./routes/verifications.js";

// Import middleware
import { requirePremium } from "./middleware/subscriptionCheck.js";

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
app.use("/api", authRoutes);              // /api/signup, /api/login, /api/logout
app.use("/api", userRoutes);               // /api/user/update, /api/user/:id, /api/users/search
app.use("/api", adminRoutes);              // /api/admin/...
app.use("/api", availabilityRoutes);       // /api/availability/...
app.use("/api", cliniciansRoutes);         // /api/clinicians/...
app.use("/api", appointmentsRoutes);       // /api/appointments/...
app.use("/api", medicationsRoutes);        // /api/medications/...
app.use("/api", moodsRoutes);              // /api/moods/...
app.use("/api", therapiesRoutes);          // /api/therapies/...
app.use("/api", medicalrecordsRoutes);     // /api/medicalrecords/...
app.use("/api", branchesRoutes);           // /api/branches/...
app.use("/api", roomsRoutes);                    // /api/rooms/...
app.use("/api", paymentRoutes);            // /api/payments/...
app.use("/api", verificationRoutes);       // /api/verifications/...

// ===== Premium-only routes (protected by subscription check) =====
// Example: Premium-only webinar access
app.get("/api/premium/webinars", requirePremium, (req, res) => {
  res.json({ 
    webinars: [
      { id: 1, title: "Advanced CBT Techniques", date: "2026-05-15" },
      { id: 2, title: "Mindfulness for Anxiety", date: "2026-05-22" }
    ] 
  });
});

// Example: Premium-only resources
app.get("/api/premium/resources", requirePremium, (req, res) => {
  res.json({ 
    resources: [
      { id: 1, title: "Complete CBT Workbook", type: "PDF" },
      { id: 2, title: "Guided Meditation Library", type: "Audio" }
    ] 
  });
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Endpoints:`);
  console.log(`   - Auth: /api/login, /api/signup, /api/logout`);
  console.log(`   - User: /api/user/:id, /api/user/update, /api/users/search`);
  console.log(`   - Admin: /api/admin/users, /api/admin/diagnoses`);
  console.log(`   - Availability: /api/availability/:clinicianId`);
  console.log(`   - Clinicians: /api/clinicians`);
  console.log(`   - Appointments: /api/appointments`);
  console.log(`   - Medications: /api/medications`);
  console.log(`   - Moods: /api/moods`);
  console.log(`   - Therapies: /api/therapies`);
  console.log(`   - Medical Records: /api/medicalrecords`);
  console.log(`   - Payments: /api/payments`);
  console.log(`   - Verifications: /api/verifications`);
  console.log(`   - Premium Routes: /api/premium/* (requires Premium subscription)`);
});