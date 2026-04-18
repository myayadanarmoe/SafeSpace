import db from "../config/db.js";

// Middleware to check if user can book appointment based on subscription
export async function checkAppointmentEligibility(req, res, next) {
  const { patientId } = req.body;
  
  if (!patientId) {
    return next();
  }

  try {
    // Get user type and appointment count
    const userSql = `
      SELECT u.id, u.type, 
        (SELECT COUNT(*) FROM appointments 
         WHERE user_id = u.id 
         AND status = 'scheduled'
         AND scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as monthly_count
      FROM users u
      WHERE u.id = ?
    `;

    db.query(userSql, [patientId], (err, results) => {
      if (err) {
        console.error("❌ Subscription check error:", err);
        return next();
      }

      if (results.length === 0) {
        return next();
      }

      const user = results[0];

      // Check limits based on user type
      if (user.type === 'Youth User') {
        if (user.monthly_count >= 2) {
          return res.status(403).json({ 
            message: "You've used your 2 free appointments this month. Please upgrade to Premium for unlimited appointments or purchase additional sessions.",
            code: "LIMIT_REACHED"
          });
        }
      }

      // Premium and Standard users have no limits
      next();
    });
  } catch (error) {
    console.error("❌ Subscription check error:", error);
    next();
  }
}

// Middleware to check if user has active Premium subscription
export function requirePremium(req, res, next) {
  const { userId } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const sql = `
    SELECT type FROM users WHERE id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("❌ Premium check error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = results[0];

    if (user.type !== 'Premium User') {
      return res.status(403).json({ 
        message: "This feature requires a Premium subscription. Please upgrade to continue.",
        code: "PREMIUM_REQUIRED"
      });
    }

    next();
  });
}

// Helper function to update monthly appointment count
export async function incrementMonthlyAppointmentCount(userId) {
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  const sql = `
    INSERT INTO monthly_appointment_limits (userID, month_year, appointments_used)
    VALUES (?, ?, 1)
    ON DUPLICATE KEY UPDATE appointments_used = appointments_used + 1
  `;

  return new Promise((resolve, reject) => {
    db.query(sql, [userId, firstDayOfMonth], (err) => {
      if (err) {
        console.error("❌ Error updating monthly count:", err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Get remaining free appointments for youth user
export async function getRemainingFreeAppointments(userId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT COUNT(*) as count FROM appointments 
      WHERE user_id = ? 
      AND status = 'scheduled'
      AND scheduled_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `;

    db.query(sql, [userId], (err, results) => {
      if (err) {
        reject(err);
      } else {
        const used = results[0].count;
        const remaining = Math.max(0, 2 - used);
        resolve({ used, remaining, max: 2 });
      }
    });
  });
}