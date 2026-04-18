import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/PaymentPage.css";

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileProvider, setMobileProvider] = useState("wavepay");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(storedUser));

    // Get booking details from location state or session storage
    const booking = location.state?.bookingDetails || 
                    JSON.parse(sessionStorage.getItem("pendingBooking"));
    
    if (!booking) {
      setMessage({ text: "No booking information found. Please try again.", type: "error" });
      setTimeout(() => navigate("/online-therapy"), 2000);
      return;
    }
    
    setBookingDetails(booking);
  }, [navigate, location]);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '');
    }
    return v;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) {
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) {
      setExpiryDate(formatted);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      // Validate based on payment method
      if (paymentMethod === "card") {
        if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
          setMessage({ text: "Please enter a valid card number", type: "error" });
          setLoading(false);
          return;
        }
        if (!cardName) {
          setMessage({ text: "Please enter the name on card", type: "error" });
          setLoading(false);
          return;
        }
        if (!expiryDate || expiryDate.length < 5) {
          setMessage({ text: "Please enter a valid expiry date (MM/YY)", type: "error" });
          setLoading(false);
          return;
        }
        if (!cvv || cvv.length < 3) {
          setMessage({ text: "Please enter a valid CVV", type: "error" });
          setLoading(false);
          return;
        }
      } else if (paymentMethod === "mobile") {
        if (!mobileNumber || mobileNumber.length < 9) {
          setMessage({ text: "Please enter a valid mobile number", type: "error" });
          setLoading(false);
          return;
        }
      }

      // Create payment record
      const paymentData = {
        userID: user.id,
        appointmentID: null, // Will be updated after booking
        amount: bookingDetails.amount || 50,
        plan_type: "pay_per_session",
        payment_method: paymentMethod === "card" ? "card" : "mobile_payment",
        card_last4: paymentMethod === "card" ? cardNumber.slice(-4) : null
      };

      const paymentRes = await fetch("http://localhost:5000/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData)
      });

      const paymentDataResult = await paymentRes.json();

      if (!paymentRes.ok) {
        throw new Error(paymentDataResult.message || "Payment processing failed");
      }

      // After successful payment, create the appointment
      const appointmentRes = await fetch("http://localhost:5000/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: user.id,
          clinicianId: bookingDetails.clinicianId,
          date: bookingDetails.date,
          time: bookingDetails.time,
          type: 'online'
        }),
      });

      const appointmentData = await appointmentRes.json();

      if (appointmentRes.ok) {
        // Clear pending booking
        sessionStorage.removeItem("pendingBooking");
        
        setMessage({ 
          text: `Payment successful! Appointment booked. Token: ${appointmentData.tokenNumber}`, 
          type: "success" 
        });
        
        setTimeout(() => {
          navigate("/my-appointments");
        }, 3000);
      } else {
        setMessage({ text: appointmentData.message || "Payment recorded but booking failed. Please contact support.", type: "error" });
      }
    } catch (err) {
      console.error("Payment error:", err);
      setMessage({ text: err.message || "Payment failed. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!bookingDetails) {
    return (
      <div className="payment-container">
        <div className="payment-header">
          <button className="back-button" onClick={() => navigate('/online-therapy')}>
            ← Back
          </button>
          <h1>Payment</h1>
        </div>
        <div className="payment-content">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-header">
        <button className="back-button" onClick={() => navigate('/online-therapy')}>
          ← Back
        </button>
        <h1>Complete Payment</h1>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="payment-grid">
        {/* Order Summary */}
        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-card">
            <div className="summary-item">
              <span>Appointment with:</span>
              <strong>{bookingDetails.doctorName}</strong>
            </div>
            <div className="summary-item">
              <span>Date:</span>
              <strong>{new Date(bookingDetails.date).toLocaleDateString()}</strong>
            </div>
            <div className="summary-item">
              <span>Time:</span>
              <strong>{bookingDetails.time}</strong>
            </div>
            <div className="summary-item">
              <span>Type:</span>
              <strong>Online Video Call</strong>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-item total">
              <span>Total:</span>
              <strong>${bookingDetails.amount || 50}.00</strong>
            </div>
          </div>
          
          <div className="secure-badge">
            <span>🔒 Secure Payment</span>
            <p>Your payment information is encrypted and secure</p>
          </div>
        </div>

        {/* Payment Form */}
        <div className="payment-form-container">
          <h2>Payment Method</h2>
          
          <div className="payment-methods">
            <label className={`method-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>💳 Credit / Debit Card</span>
            </label>
            <label className={`method-option ${paymentMethod === 'mobile' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="mobile"
                checked={paymentMethod === 'mobile'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>📱 Mobile Payment</span>
            </label>
          </div>

          <form onSubmit={handleSubmitPayment}>
            {paymentMethod === 'card' ? (
              <>
                <div className="form-group">
                  <label>Card Number *</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    required
                  />
                  <div className="card-icons">
                    <span>💳 Visa</span>
                    <span>💳 Mastercard</span>
                    <span>💳 JCB</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Name on Card *</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="As it appears on card"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date *</label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      maxLength="5"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV *</label>
                    <input
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      maxLength="4"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Mobile Payment Provider *</label>
                  <select
                    value={mobileProvider}
                    onChange={(e) => setMobileProvider(e.target.value)}
                    className="provider-select"
                    required
                  >
                    <option value="wavepay">WavePay</option>
                    <option value="kbzpay">KBZPay</option>
                    <option value="ayapay">AYA Pay</option>
                    <option value="cbpay">CB Pay</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="09XXXXXXXXX"
                    required
                  />
                </div>

                <div className="info-message">
                  <p>📱 You will receive a payment request on your mobile device.</p>
                  <p>Please approve the payment to complete your booking.</p>
                </div>
              </>
            )}

            <div className="payment-actions">
              <button 
                type="submit" 
                className="pay-button"
                disabled={loading}
              >
                {loading ? "Processing..." : `Pay $${bookingDetails.amount || 50}.00`}
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => navigate('/online-therapy')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}