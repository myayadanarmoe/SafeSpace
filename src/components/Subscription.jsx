import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Subscription.css";

export default function Subscription() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showYouthForm, setShowYouthForm] = useState(false);
  const [showPremiumForm, setShowPremiumForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentIdFile, setStudentIdFile] = useState(null);
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
      // Check if user already has pending or approved verification
      checkExistingVerification();
    }
  };

  const checkExistingVerification = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/verifications/youth/status/${user.id}`);
      const data = await res.json();
      
      if (data.verified) {
        setMessage({ text: "You are already verified as a Youth member!", type: "success" });
      } else if (data.status === 'pending') {
        setMessage({ text: "You have a pending verification request. Please wait for admin approval.", type: "info" });
      } else {
        setShowYouthForm(true);
      }
    } catch (err) {
      setShowYouthForm(true);
    }
  };

  const handleYouthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('fullName', youthFormData.fullName);
    formData.append('dateOfBirth', youthFormData.dateOfBirth);
    formData.append('idType', youthFormData.idType);
    formData.append('idNumber', youthFormData.idNumber);
    formData.append('school', youthFormData.school);
    formData.append('grade', youthFormData.grade);
    formData.append('parentName', youthFormData.parentName);
    formData.append('parentPhone', youthFormData.parentPhone);
    formData.append('parentEmail', youthFormData.parentEmail);
    
    if (studentIdFile) {
      formData.append('studentIdImage', studentIdFile);
    }

    try {
      const res = await fetch("http://localhost:5000/api/verifications/youth", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ 
          text: "🎉 Youth verification submitted! You'll receive an email within 24-48 hours after approval.", 
          type: "success" 
        });
        setShowYouthForm(false);
        // Reset form
        setYouthFormData({
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
        setStudentIdFile(null);
      } else {
        setMessage({ text: data.message || "Submission failed", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ text: "File size must be less than 5MB", type: "error" });
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setMessage({ text: "Please upload JPG, PNG, or PDF file", type: "error" });
        return;
      }
      setStudentIdFile(file);
    }
  };

  const handlePremiumSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("http://localhost:5000/api/payments/upgrade-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          amount: 29.99,
          payment_method: "card",
          card_last4: premiumFormData.cardNumber.slice(-4)
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "✨ Premium subscription activated! Thank you for upgrading.", type: "success" });
        setShowPremiumForm(false);
        // Update user in localStorage
        const updatedUser = { ...user, type: "Premium User" };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        setMessage({ text: data.message || "Payment failed", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowYouthForm(false);
    setShowPremiumForm(false);
    setStudentIdFile(null);
  };

  return (
    <div className="subscription-container">
      <div className="subscription-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        <h1>Choose Your Plan</h1>
        <p className="text-center">Flexible options for every need</p>
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
            <div className="plan-header" style={{ background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color} 100%)` }}>
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

              {/* File Upload */}
              <div className="form-group">
                <label>Student ID / Document Upload *</label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileChange}
                  required
                  className="file-input"
                />
                <small className="file-hint">Upload student ID card, NRC, or passport (Max 5MB, JPG/PNG/PDF)</small>
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
                <p>📸 Your uploaded document will be reviewed by our team.</p>
                <p className="highlight-text">✅ Upon approval: 2 FREE appointments per month + discounted additional sessions ($30/session)</p>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-create" disabled={loading}>
                  {loading ? "Submitting..." : "Submit for FREE Verification"}
                </button>
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
                <button type="submit" className="submit-btn premium" disabled={loading}>
                  {loading ? "Processing..." : "Subscribe Now - $29.99/month"}
                </button>
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}