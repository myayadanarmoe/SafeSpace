import express from "express";
import db from "../config/db.js";

const router = express.Router();

// Generate unique transaction ID
function generateTransactionId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${timestamp}-${random}`;
}

// Create payment record
router.post("/payments/create", (req, res) => {
  const { userID, appointmentID, amount, plan_type, payment_method, card_last4 } = req.body;

  if (!userID || !amount || !plan_type) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const transaction_id = generateTransactionId();

  const sql = `
    INSERT INTO payments (userID, appointmentID, amount, plan_type, payment_method, transaction_id, card_last4, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')
  `;

  db.query(sql, [userID, appointmentID, amount, plan_type, payment_method, transaction_id, card_last4], (err, result) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    res.status(201).json({
      message: "Payment recorded successfully",
      paymentID: result.insertId,
      transaction_id: transaction_id
    });
  });
});

// Get user's payment history
router.get("/payments/user/:userId", (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT p.*, a.scheduled_date, a.appointment_type
    FROM payments p
    LEFT JOIN appointments a ON p.appointmentID = a.appointmentID
    WHERE p.userID = ?
    ORDER BY p.payment_date DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

// Check if user has active subscription
router.get("/payments/subscription/active/:userId", (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT * FROM payments 
    WHERE userID = ? 
    AND plan_type = 'premium'
    AND status = 'completed'
    AND (expiry_date IS NULL OR expiry_date > CURDATE())
    ORDER BY payment_date DESC
    LIMIT 1
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    const hasActiveSubscription = results.length > 0;
    res.json({ active: hasActiveSubscription, subscription: results[0] || null });
  });
});

// Upgrade user to premium after payment
router.post("/payments/upgrade-premium", async (req, res) => {
  const { userId, amount, payment_method, card_last4 } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID required" });
  }

  const transaction_id = generateTransactionId();

  // Start transaction
  db.beginTransaction(async (err) => {
    if (err) {
      return res.status(500).json({ message: "Transaction error" });
    }

    try {
      // Record payment
      const paymentSql = `
        INSERT INTO payments (userID, amount, plan_type, payment_method, transaction_id, card_last4, status)
        VALUES (?, ?, 'premium', ?, ?, ?, 'completed')
      `;
      
      db.query(paymentSql, [userId, amount, payment_method, transaction_id, card_last4], (paymentErr, paymentResult) => {
        if (paymentErr) {
          return db.rollback(() => {
            console.error("❌ Payment error:", paymentErr);
            res.status(500).json({ message: "Payment record error" });
          });
        }

        // Update user type to Premium
        const updateUserSql = "UPDATE users SET type = 'Premium User' WHERE id = ?";
        
        db.query(updateUserSql, [userId], (userErr, userResult) => {
          if (userErr) {
            return db.rollback(() => {
              console.error("❌ User update error:", userErr);
              res.status(500).json({ message: "User update error" });
            });
          }

          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => {
                res.status(500).json({ message: "Commit error" });
              });
            }

            res.json({
              message: "Successfully upgraded to Premium!",
              transaction_id: transaction_id
            });
          });
        });
      });
    } catch (error) {
      db.rollback(() => {
        console.error("❌ Error:", error);
        res.status(500).json({ message: "Server error" });
      });
    }
  });
});

// Record pay-per-session payment
router.post("/payments/pay-per-session", (req, res) => {
  const { userId, appointmentId, amount, payment_method } = req.body;

  if (!userId || !appointmentId || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const transaction_id = generateTransactionId();

  const sql = `
    INSERT INTO payments (userID, appointmentID, amount, plan_type, payment_method, transaction_id, status)
    VALUES (?, ?, ?, 'pay_per_session', ?, ?, 'completed')
  `;

  db.query(sql, [userId, appointmentId, amount, payment_method, transaction_id], (err, result) => {
    if (err) {
      console.error("❌ MySQL error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    res.status(201).json({
      message: "Payment recorded successfully",
      paymentID: result.insertId,
      transaction_id: transaction_id
    });
  });
});

export default router;