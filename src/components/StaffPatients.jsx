import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StaffPatients.css";

export default function StaffPatients() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [patientHistory, setPatientHistory] = useState([]);
  
  // Edit form
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    name: "",
    phNo: "",
    date_of_birth: "",
    gender: "",
    address: "",
    emergencyContact: ""
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    
    const userData = JSON.parse(storedUser);
    if (userData.type !== 'Staff' && userData.type !== 'Admin') {
      navigate("/");
      return;
    }
    
    setUser(userData);
    fetchPatients();
  }, [navigate]);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/users/regular");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log("Fetched patients:", data);
      setPatients(data);
      setFilteredPatients(data);
    } catch (err) {
      console.error("Error fetching patients:", err);
      setMessage({ text: `Error loading patients: ${err.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const filtered = patients.filter(patient =>
      patient.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPatients(filtered);
  };

  const fetchPatientHistory = async (patientId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/patient/${patientId}`);
      const data = await res.json();
      setPatientHistory(data);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const handleViewHistory = (patient) => {
    setSelectedPatient(patient);
    fetchPatientHistory(patient.id);
    setShowHistoryModal(true);
  };

  const handleEditClick = (patient) => {
    setSelectedPatient(patient);
    setEditForm({
      username: patient.username || "",
      email: patient.email,
      name: patient.name || "",
      phNo: patient.phNo || "",
      date_of_birth: patient.date_of_birth || "",
      gender: patient.gender || "",
      address: patient.address || "",
      emergencyContact: patient.emergencyContact || ""
    });
    setShowEditModal(true);
  };

  const handleUpdatePatient = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${selectedPatient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editForm.username,
          email: editForm.email,
          name: editForm.name,
          phNo: editForm.phNo,
          date_of_birth: editForm.date_of_birth,
          gender: editForm.gender,
          address: editForm.address,
          emergencyContact: editForm.emergencyContact
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Patient updated successfully", type: "success" });
        setShowEditModal(false);
        fetchPatients(); // Refresh list
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      } else {
        setMessage({ text: data.message || "Error updating patient", type: "error" });
      }
    } catch (err) {
      console.error("Update error:", err);
      setMessage({ text: "Network error", type: "error" });
    }
  };

  const handleResetPassword = async (patientId) => {
    if (!window.confirm("Are you sure you want to reset this patient's password? They will receive a temporary password.")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/users/${patientId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Password reset successful", type: "success" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      } else {
        setMessage({ text: data.message || "Error resetting password", type: "error" });
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setMessage({ text: "Network error", type: "error" });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Map user types to display names
  const getUserTypeDisplay = (type) => {
    const typeMap = {
      'Standard User': 'Standard',
      'Premium User': 'Premium',
      'Youth User': 'Youth'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="staff-patients-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-patients-container">
      <div className="staff-patients-header">
        <button className="back-button" onClick={() => navigate('/staff/book-appointment')}>
          ← Back to Booking
        </button>
        <h1>Manage Patients</h1>
        {user && <p className="staff-info">{user.username} - {user.type}</p>}
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search patients by name, email, phone, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* Results count */}
      <div className="results-count">
        Found {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
      </div>

      {/* Patients Table */}
      <div className="patients-table-container">
        <table className="patients-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Type</th>
              <th>Member Since</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">No patients found</td>
              </tr>
            ) : (
              filteredPatients.map(patient => (
                <tr key={patient.id}>
                  <td>{patient.id}</td>
                  <td>
                    <div className="patient-name-cell">
                      <div className="patient-avatar-small">
                        {(patient.name || patient.username || patient.email).charAt(0).toUpperCase()}
                      </div>
                      {patient.name || patient.username || 'N/A'}
                    </div>
                  </td>
                  <td>{patient.email}</td>
                  <td>{patient.phNo || '—'}</td>
                  <td>
                    <span className={`patient-type-badge ${patient.type?.toLowerCase().replace(' ', '-')}`}>
                      {getUserTypeDisplay(patient.type)}
                    </span>
                  </td>
                  <td>{formatDate(patient.created_at)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="icon-btn view-btn"
                        onClick={() => handleViewDetails(patient)}
                        title="View Details"
                      >
                        👤
                      </button>
                      <button 
                        className="icon-btn history-btn"
                        onClick={() => handleViewHistory(patient)}
                        title="View History"
                      >
                        📋
                      </button>
                      <button 
                        className="icon-btn edit-btn"
                        onClick={() => handleEditClick(patient)}
                        title="Edit Patient"
                      >
                        ✏️
                      </button>
                      <button 
                        className="icon-btn reset-btn"
                        onClick={() => handleResetPassword(patient.id)}
                        title="Reset Password"
                      >
                        🔑
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Details Modal */}
      {showDetailsModal && selectedPatient && (
        <div className="modal" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowDetailsModal(false)}>×</button>
            
            <h2>Patient Details</h2>
            
            <div className="details-header">
              <div className="details-avatar">
                {(selectedPatient.name || selectedPatient.username || selectedPatient.email).charAt(0).toUpperCase()}
              </div>
              <div className="details-title">
                <h3>{selectedPatient.name || selectedPatient.username || 'No name'}</h3>
                <span className={`patient-type-badge ${selectedPatient.type?.toLowerCase().replace(' ', '-')}`}>
                  {getUserTypeDisplay(selectedPatient.type)}
                </span>
              </div>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Username:</span>
                <span className="detail-value">{selectedPatient.username || 'N/A'}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{selectedPatient.email}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{selectedPatient.phNo || 'N/A'}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Date of Birth:</span>
                <span className="detail-value">{formatDate(selectedPatient.date_of_birth)}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Gender:</span>
                <span className="detail-value">{selectedPatient.gender || 'N/A'}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{selectedPatient.address || 'N/A'}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Emergency Contact:</span>
                <span className="detail-value">{selectedPatient.emergencyContact || 'N/A'}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Member Since:</span>
                <span className="detail-value">{formatDate(selectedPatient.created_at)}</span>
              </div>
            </div>

            <div className="modal-actions single">
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {showEditModal && selectedPatient && (
        <div className="modal" onClick={() => setShowEditModal(false)}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowEditModal(false)}>×</button>
            <h2>Edit Patient</h2>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  placeholder="Username"
                />
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Full name"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phNo}
                  onChange={(e) => setEditForm({...editForm, phNo: e.target.value})}
                  placeholder="Phone number"
                />
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={editForm.date_of_birth}
                  onChange={(e) => setEditForm({...editForm, date_of_birth: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  placeholder="Address"
                  rows="2"
                />
              </div>

              <div className="form-group full-width">
                <label>Emergency Contact</label>
                <input
                  type="text"
                  value={editForm.emergencyContact}
                  onChange={(e) => setEditForm({...editForm, emergencyContact: e.target.value})}
                  placeholder="Emergency contact name and phone"
                />
              </div>

              <div className="form-group full-width">
                <label>User Type</label>
                <input
                  type="text"
                  value={getUserTypeDisplay(selectedPatient.type)}
                  disabled
                  className="readonly-field"
                />
                <small className="field-note">User type can only be changed by admin</small>
              </div>
            </div>

            <div className="modal-actions">
              <button className="save-btn" onClick={handleUpdatePatient}>
                Save Changes
              </button>
              <button className="cancel-btn" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient History Modal */}
      {showHistoryModal && selectedPatient && (
        <div className="modal" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowHistoryModal(false)}>×</button>
            
            <h2>Appointment History</h2>
            <div className="patient-summary">
              <div className="patient-avatar-large">
                {(selectedPatient.name || selectedPatient.username || selectedPatient.email).charAt(0).toUpperCase()}
              </div>
              <div className="patient-summary-info">
                <h3>{selectedPatient.name || selectedPatient.username || 'No name'}</h3>
                <p>{selectedPatient.email}</p>
                <p className="patient-phone">{selectedPatient.phNo || 'No phone'}</p>
                <span className={`patient-type-badge ${selectedPatient.type?.toLowerCase().replace(' ', '-')}`}>
                  {getUserTypeDisplay(selectedPatient.type)}
                </span>
              </div>
            </div>

            {patientHistory.length === 0 ? (
              <p className="no-history">No appointment history found</p>
            ) : (
              <div className="history-list">
                {patientHistory.map(appt => (
                  <div key={appt.appointmentID} className="history-item">
                    <div className="history-date">
                      <span className="date">{formatDate(appt.scheduled_date)}</span>
                      <span className="time">{formatTime(appt.scheduled_time)}</span>
                    </div>
                    <div className="history-details">
                      <span className="clinician">Dr. {appt.clinician_name}</span>
                      <span className={`appointment-type-badge ${appt.appointment_type}`}>
                        {appt.appointment_type}
                      </span>
                    </div>
                    <div className="history-status">
                      <span className={`status-badge ${appt.status}`}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}