import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminVerifications.css";

export default function AdminVerifications() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [showDuplicateDetails, setShowDuplicateDetails] = useState(null);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    
    const userData = JSON.parse(storedUser);
    if (userData.type !== 'Admin') {
      navigate("/");
      return;
    }
    
    setUser(userData);
    fetchVerifications();
  }, [navigate]);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/verifications/youth/pending");
      const data = await res.json();
      setVerifications(data);
    } catch (err) {
      console.error("Error fetching verifications:", err);
      setMessage({ text: "Error loading verifications", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchDuplicateDetails = async (verificationId) => {
    setLoadingDuplicates(true);
    try {
      console.log("Fetching duplicates for ID:", verificationId);
      const res = await fetch(`http://localhost:5000/api/verifications/youth/duplicates/${verificationId}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Duplicate data received:", data);
      setDuplicateInfo(data);
      setShowDuplicateDetails(verificationId);
    } catch (err) {
      console.error("Error fetching duplicate details:", err);
      setMessage({ text: "Error loading duplicate information: " + err.message, type: "error" });
      setDuplicateInfo({ possible_duplicates: [] });
      setShowDuplicateDetails(verificationId);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } finally {
      setLoadingDuplicates(false);
    }
  };

  const handleApprove = async (verificationId) => {
    if (!window.confirm("Are you sure you want to approve this verification? This will upgrade the user to Youth User.")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/verifications/youth/approve/${verificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user.id })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Verification approved! User upgraded to Youth User.", type: "success" });
        fetchVerifications();
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      } else {
        setMessage({ text: data.message || "Error approving", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error", type: "error" });
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setMessage({ text: "Please provide a reason for rejection", type: "error" });
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/verifications/youth/reject/${selectedVerification.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user.id, rejectReason: rejectReason })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Verification rejected", type: "success" });
        setShowRejectModal(false);
        setRejectReason("");
        fetchVerifications();
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      } else {
        setMessage({ text: data.message || "Error rejecting", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error", type: "error" });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuplicateWarningLevel = (potentialDuplicates) => {
    if (potentialDuplicates >= 3) return "high";
    if (potentialDuplicates >= 1) return "medium";
    return "none";
  };

  if (loading) {
    return (
      <div className="admin-verifications-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-verifications-container">
      <div className="admin-verifications-header">
        <button className="back-button" onClick={() => navigate('/admin')}>
          ← Back to Admin Panel
        </button>
        <h1>Youth Verifications</h1>
        {user && <p className="admin-info">{user.name} - {user.type}</p>}
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="verifications-stats">
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number">{verifications.filter(v => v.status === 'pending').length}</p>
        </div>
        <div className="stat-card approved">
          <h3>Total Processed</h3>
          <p className="stat-number">{verifications.length}</p>
        </div>
      </div>

      {verifications.length === 0 ? (
        <div className="no-verifications">
          <p>No pending youth verification requests.</p>
        </div>
      ) : (
        <div className="verifications-list">
          {verifications.map(v => {
            const warningLevel = getDuplicateWarningLevel(v.potential_duplicates);
            return (
              <div key={v.id} className={`verification-card ${warningLevel === 'high' ? 'high-warning' : warningLevel === 'medium' ? 'medium-warning' : ''}`}>
                <div className="verification-header">
                  <div className="user-avatar">
                    {v.fullName?.charAt(0).toUpperCase() || v.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <h3>{v.fullName || v.name}</h3>
                    <p>{v.email}</p>
                    <span className="verification-status pending">Pending</span>
                  </div>
                  <div className="submitted-date">
                    Submitted: {formatDate(v.submitted_at)}
                  </div>
                </div>

                {/* Duplicate Warning */}
                {v.potential_duplicates > 0 && (
                  <div className={`duplicate-warning ${warningLevel}`}>
                    <div className="warning-header">
                      <span className="warning-icon">⚠️</span>
                      <strong>Potential Duplicate Detected!</strong>
                      <button 
                        className="view-duplicates-btn"
                        onClick={() => fetchDuplicateDetails(v.id)}
                        disabled={loadingDuplicates}
                      >
                        {loadingDuplicates && showDuplicateDetails === v.id ? "Loading..." : "View Details"}
                      </button>
                    </div>
                    <p>This verification has {v.potential_duplicates} potential duplicate(s) in the system. Please review carefully.</p>
                  </div>
                )}

                {/* System Warning from submission */}
                {v.admin_notes && v.admin_notes.includes('Warning') && (
                  <div className="warning-note">
                    <strong>⚠️ System Warning:</strong> {v.admin_notes}
                  </div>
                )}

                <div className="verification-details">
                  <div className="detail-row">
                    <span className="detail-label">Date of Birth:</span>
                    <span className="detail-value">{formatDate(v.dateOfBirth)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">ID Type:</span>
                    <span className="detail-value">{v.idType?.toUpperCase()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">ID Number:</span>
                    <span className="detail-value">{v.idNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">School:</span>
                    <span className="detail-value">{v.school || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Grade/Year:</span>
                    <span className="detail-value">{v.grade || 'N/A'}</span>
                  </div>
                  {v.parentName && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Parent/Guardian:</span>
                        <span className="detail-value">{v.parentName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Parent Contact:</span>
                        <span className="detail-value">{v.parentPhone} {v.parentEmail && `(${v.parentEmail})`}</span>
                      </div>
                    </>
                  )}
                  {v.studentIdImage && (
                    <div className="detail-row">
                      <span className="detail-label">Student ID:</span>
                      <button 
                        className="view-image-btn"
                        onClick={() => {
                          setCurrentImage(`http://localhost:5000${v.studentIdImage}`);
                          setShowImageViewer(true);
                        }}
                      >
                        📄 View Document
                      </button>
                    </div>
                  )}
                </div>

                <div className="verification-actions">
                  <button 
                    className="approve-btn"
                    onClick={() => handleApprove(v.id)}
                  >
                    ✓ Approve & Upgrade to Youth
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => {
                      setSelectedVerification(v);
                      setShowRejectModal(true);
                    }}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Duplicate Details Modal */}
      {showDuplicateDetails && duplicateInfo && (
        <div className="modal" onClick={() => setShowDuplicateDetails(null)}>
          <div className="modal-content duplicate-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowDuplicateDetails(null)}>×</button>
            <h2>Duplicate Details</h2>
            
            <div className="current-verification">
              <h4>Current Verification</h4>
              <div className="duplicate-field">
                <strong>Name:</strong> {duplicateInfo.fullName || duplicateInfo.name}
              </div>
              <div className="duplicate-field">
                <strong>Email:</strong> {duplicateInfo.email}
              </div>
              <div className="duplicate-field">
                <strong>ID Number:</strong> {duplicateInfo.idNumber}
              </div>
              <div className="duplicate-field">
                <strong>Date of Birth:</strong> {formatDate(duplicateInfo.dateOfBirth)}
              </div>
            </div>

            <div className="potential-duplicates">
              <h4>Potential Duplicates Found</h4>
              {duplicateInfo.possible_duplicates && duplicateInfo.possible_duplicates.length > 0 ? (
                <div className="duplicate-list">
                  {duplicateInfo.possible_duplicates.map((dup, idx) => (
                    <div key={idx} className="duplicate-item">
                      <div className="duplicate-field">
                        <strong>Name:</strong> {dup.fullName || dup.name}
                      </div>
                      <div className="duplicate-field">
                        <strong>Email:</strong> {dup.email}
                      </div>
                      <div className="duplicate-field">
                        <strong>ID Number:</strong> {dup.idNumber}
                      </div>
                      <div className="duplicate-field">
                        <strong>Date of Birth:</strong> {formatDate(dup.dateOfBirth)}
                      </div>
                      <div className="duplicate-field">
                        <strong>Verified on:</strong> {formatDate(dup.submitted_at)}
                      </div>
                      {dup.studentIdImage && (
                        <div className="duplicate-field">
                          <strong>Document:</strong>
                          <button 
                            className="view-image-btn"
                            onClick={() => {
                              setCurrentImage(`http://localhost:5000${dup.studentIdImage}`);
                              setShowImageViewer(true);
                            }}
                          >
                            📄 View Document
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No detailed duplicate information available. Please review manually.</p>
              )}
            </div>

            <div className="modal-actions">
              <button className="close-duplicate-btn" onClick={() => setShowDuplicateDetails(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowRejectModal(false)}>×</button>
            <h2>Reject Verification</h2>
            <p>Please provide a reason for rejecting this verification request.</p>
            
            <div className="form-group">
              <label>Rejection Reason *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows="3"
                placeholder="e.g., Invalid ID, Age exceeds limit, Unable to verify student status, etc."
                required
              />
            </div>

            <div className="modal-actions">
              <button className="reject-confirm-btn" onClick={handleReject}>
                Confirm Rejection
              </button>
              <button className="cancel-btn" onClick={() => {
                setShowRejectModal(false);
                setRejectReason("");
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {showImageViewer && (
        <div className="modal" onClick={() => setShowImageViewer(false)}>
          <div className="modal-content image-viewer" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowImageViewer(false)}>×</button>
            <img src={currentImage} alt="Student ID" className="full-image" />
          </div>
        </div>
      )}
    </div>
  );
}