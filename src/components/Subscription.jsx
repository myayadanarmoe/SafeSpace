import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Subscription.css"

export default function Subscription() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showYouthForm, setShowYouthForm] = useState(false);
  const [showPremiumForm, setShowPremiumForm] = useState(false);
  const [youthFormData, setYouthFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    idType: "student",
    idNumber: "",
    school: "",
    grade: "",
    parentName: "",
    parentPhone: "",
    parentEmail: ""
  });
  const [premiumFormData, setPremiumFormData] = useState({
    fullName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    billingAddress: ""
  });
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "0",
      period: "forever",
      color: "#6c757d",
      features: [
        "Access to free webinars",
        "Pay-per-booking appointments",
        "Basic community support",
        "Mental health resources",
        "Newsletter subscription"
      ],
      buttonText: user ? "Current Plan" : "Sign Up Free",
      action: () => handleFreePlan()
    },
    {
      id: "premium",
      name: "Premium",
      price: "29.99",
      period: "month",
      color: "#667eea",
      features: [
        "Unlimited appointments",
        "Priority booking",
        "All webinars included",
        "24/7 chat support",
        "Personalized care plan",
        "Session recordings",
        "Progress tracking"
      ],
      buttonText: user ? "Upgrade to Premium" : "Sign Up & Subscribe",
      action: () => handlePremiumPlan()
    },
    {
      id: "youth",
      name: "Youth",
      price: "0",
      period: "month (with verification)",
      color: "#4a0072",
      badge: "FREE for Students",
      features: [
        "2 free appointments per month",
        "Free webinar access",
        "Educational resources",
        "Peer support groups",
        "Parent/guardian portal",
        "School collaboration",
        "Discounted additional sessions ($30/session)"
      ],
      buttonText: user ? "Verify for Free" : "Sign Up & Verify",
      action: () => handleYouthPlan()
    }
  ];

  const handleFreePlan = () => {
    if (!user) {
      navigate("/sign-up");
    } else {
      setMessage({ text: "You are already on the Free plan", type: "info" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  const handlePremiumPlan = () => {
    if (!user) {
      navigate("/sign-up");
    } else {
      setShowPremiumForm(true);
    }
  };

  const handleYouthPlan = () => {
    if (!user) {
      navigate("/sign-up");
    } else {
      setShowYouthForm(true);
    }
  };

  const handleYouthSubmit = (e) => {
    e.preventDefault();
    // Here you would send the youth verification data to your backend
    setMessage({ 
      text: "🎉 Youth verification submitted! If approved, you'll get 2 free appointments per month. We'll notify you within 24-48 hours.", 
      type: "success" 
    });
    setTimeout(() => setMessage({ text: "", type: "" }), 6000);
    setShowYouthForm(false);
  };

  const handlePremiumSubmit = (e) => {
    e.preventDefault();
    // Here you would process the payment and upgrade the user
    setMessage({ text: "✨ Premium subscription activated! Thank you for upgrading.", type: "success" });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    setShowPremiumForm(false);
  };

  const handleCloseModal = () => {
    setShowYouthForm(false);
    setShowPremiumForm(false);
  };

  return (
    <div className="subscription-container">
      <div className="subscription-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        <h1>Choose Your Plan</h1>
        <p>Flexible options for every need</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`plan-card ${plan.id}`}>
            {plan.badge && <span className="plan-badge">{plan.badge}</span>}
            <div className="plan-header" style={{ background: `linear-gradient(135deg, ${plan.color} 0%, ${adjustColor(plan.color, -20)} 100%)` }}>
              <h2>{plan.name}</h2>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">{plan.price}</span>
                <span className="period">/{plan.period}</span>
              </div>
            </div>
            
            <div className="plan-features">
              <ul>
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="plan-footer">
              <button 
                className={`plan-button ${plan.id}`}
                onClick={plan.action}
                disabled={plan.id === "free" && user?.type === "Free User"}
              >
                {plan.buttonText}
              </button>
            </div>

            {plan.id === "free" && (
              <div className="plan-note">
                <p>✓ Free webinars included</p>
                <p>✓ Pay per session ($50-80/session)</p>
              </div>
            )}

            {plan.id === "youth" && (
              <div className="plan-note highlight">
                <p>🎓 FREE for verified students!</p>
                <p>📚 Must be under 25 with valid student ID</p>
                <p>✨ 2 free appointments per month after verification</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Youth Verification Modal */}
      {showYouthForm && (
        <div className="modal" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCloseModal}>×</button>
            <h2>🎓 Student Verification</h2>
            <p className="modal-subtitle">Verify your student status to get 2 FREE appointments per month!</p>
            
            <form onSubmit={handleYouthSubmit}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={youthFormData.fullName}
                  onChange={(e) => setYouthFormData({...youthFormData, fullName: e.target.value})}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    value={youthFormData.dateOfBirth}
                    onChange={(e) => setYouthFormData({...youthFormData, dateOfBirth: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>ID Type *</label>
                  <select
                    value={youthFormData.idType}
                    onChange={(e) => setYouthFormData({...youthFormData, idType: e.target.value})}
                    required
                  >
                    <option value="student">Student ID</option>
                    <option value="nrc">NRC (National Registration Card)</option>
                    <option value="passport">Passport</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>ID Number *</label>
                <input
                  type="text"
                  value={youthFormData.idNumber}
                  onChange={(e) => setYouthFormData({...youthFormData, idNumber: e.target.value})}
                  required
                  placeholder="Enter your student/ID number"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>School/University *</label>
                  <input
                    type="text"
                    value={youthFormData.school}
                    onChange={(e) => setYouthFormData({...youthFormData, school: e.target.value})}
                    required
                    placeholder="Name of your school"
                  />
                </div>

                <div className="form-group">
                  <label>Grade/Year *</label>
                  <input
                    type="text"
                    value={youthFormData.grade}
                    onChange={(e) => setYouthFormData({...youthFormData, grade: e.target.value})}
                    required
                    placeholder="e.g., 10th grade, 2nd year"
                  />
                </div>
              </div>

              <h3 className="form-section-title">Parent/Guardian Information (if under 18)</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Parent/Guardian Name</label>
                  <input
                    type="text"
                    value={youthFormData.parentName}
                    onChange={(e) => setYouthFormData({...youthFormData, parentName: e.target.value})}
                    placeholder="Full name of parent/guardian"
                  />
                </div>

                <div className="form-group">
                  <label>Parent Phone</label>
                  <input
                    type="tel"
                    value={youthFormData.parentPhone}
                    onChange={(e) => setYouthFormData({...youthFormData, parentPhone: e.target.value})}
                    placeholder="Contact number"
                  />
                </div>
              </div>

              <div className="verification-note">
                <p>📸 Please have your student ID ready for upload. You will receive a verification email within 24-48 hours.</p>
                <p className="highlight-text">✅ Upon approval: 2 FREE appointments per month + discounted additional sessions ($30/session)</p>
              </div>

              <div className="modal-actions">
                <button type="submit" className="submit-btn youth">Submit for FREE Verification</button>
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Subscription Modal */}
      {showPremiumForm && (
        <div className="modal" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCloseModal}>×</button>
            <h2>✨ Premium Subscription</h2>
            <p className="modal-subtitle">$29.99/month - Unlimited appointments & priority support</p>
            
            <form onSubmit={handlePremiumSubmit}>
              <div className="form-group">
                <label>Full Name on Card *</label>
                <input
                  type="text"
                  value={premiumFormData.fullName}
                  onChange={(e) => setPremiumFormData({...premiumFormData, fullName: e.target.value})}
                  required
                  placeholder="As it appears on card"
                />
              </div>

              <div className="form-group">
                <label>Card Number *</label>
                <input
                  type="text"
                  value={premiumFormData.cardNumber}
                  onChange={(e) => setPremiumFormData({...premiumFormData, cardNumber: e.target.value})}
                  required
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date *</label>
                  <input
                    type="text"
                    value={premiumFormData.expiryDate}
                    onChange={(e) => setPremiumFormData({...premiumFormData, expiryDate: e.target.value})}
                    required
                    placeholder="MM/YY"
                    maxLength="5"
                  />
                </div>

                <div className="form-group">
                  <label>CVV *</label>
                  <input
                    type="password"
                    value={premiumFormData.cvv}
                    onChange={(e) => setPremiumFormData({...premiumFormData, cvv: e.target.value})}
                    required
                    placeholder="123"
                    maxLength="3"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Billing Address *</label>
                <input
                  type="text"
                  value={premiumFormData.billingAddress}
                  onChange={(e) => setPremiumFormData({...premiumFormData, billingAddress: e.target.value})}
                  required
                  placeholder="Street address, city, postal code"
                />
              </div>

              <div className="payment-note">
                <p>🔒 Secure payment processing</p>
                <p>💳 We accept Visa, Mastercard, JCB</p>
                <p>✨ Cancel anytime</p>
              </div>

              <div className="modal-actions">
                <button type="submit" className="submit-btn premium">Subscribe Now - $29.99/month</button>
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to adjust color brightness
function adjustColor(hex, percent) {
  // Simple color adjustment for gradient
  return hex;
}