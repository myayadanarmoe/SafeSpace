import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MyPatients.css";

export default function MyPatients() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showPatientHistoryModal, setShowPatientHistoryModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState({ appointmentId: null, currentStatus: "" });
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [expandedPatients, setExpandedPatients] = useState({});
  
  // Reference data for medical records
  const [diagnoses, setDiagnoses] = useState([]);
  const [medications, setMedications] = useState([]);
  const [moods, setMoods] = useState([]);
  const [therapies, setTherapies] = useState([]);
  
  // Medication search state
  const [medicationSearch, setMedicationSearch] = useState("");
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);
  const medicationDropdownRef = useRef(null);
  
  // New record form
  const [newRecord, setNewRecord] = useState({
    symptoms: "",
    riskAssessment: "Low",
    treatmentPlan: "",
    diagnoses: [],
    medications: [],
    moods: [],
    therapies: []
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (medicationDropdownRef.current && !medicationDropdownRef.current.contains(event.target)) {
        setShowMedicationDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Check if user is logged in and is a clinician
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    
    const userData = JSON.parse(storedUser);
    const clinicianTypes = ['Psychiatrist', 'Psychologist', 'Therapist'];
    if (!clinicianTypes.includes(userData.type)) {
      navigate("/");
      return;
    }
    
    setUser(userData);
    fetchAppointments(userData.id);
    fetchReferenceData();
  }, [navigate]);

  // Apply filters whenever search term, status filter, or appointments change
  useEffect(() => {
    filterAppointments();
  }, [searchTerm, statusFilter, dateFilter, appointments]);

  const fetchAppointments = async (clinicianId) => {
  setLoading(true);
  try {
    const res = await fetch(`http://localhost:5000/api/appointments/clinician/${clinicianId}`);
    const data = await res.json();
    
    // Filter out cancelled appointments
    const activeAppointments = data.filter(appt => appt.status !== 'cancelled');
    
    // Group appointments by patient using user_id
    const grouped = activeAppointments.reduce((acc, appt) => {
      const patientId = appt.user_id; // ✅ Use user_id from API
      
      if (!acc[patientId]) {
        acc[patientId] = {
          patientId: patientId, // ✅ This is now 10, not undefined
          patientName: appt.patient_name,
          patientEmail: appt.patient_email,
          appointments: []
        };
      }
      acc[patientId].appointments.push(appt);
      return acc;
    }, {});
    
    setAppointments(Object.values(grouped));
  } catch (err) {
    console.error("Error fetching appointments:", err);
    setMessage({ text: "Error loading appointments", type: "error" });
  } finally {
    setLoading(false);
  }
};

  const fetchPatientRecords = async (patientId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/medicalrecords/patient/${patientId}`);
      const data = await res.json();
      setPatientRecords(data);
    } catch (err) {
      console.error("Error fetching patient records:", err);
      setMessage({ text: "Error loading patient history", type: "error" });
    }
  };

  const handleViewHistory = (patient) => {
    setSelectedPatient(patient);
    fetchPatientRecords(patient.patientId);
    setShowPatientHistoryModal(true);
  };

  const handleUpdateStatus = (appointmentId, currentStatus) => {
    setStatusToUpdate({ appointmentId, currentStatus });
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async (newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${statusToUpdate.appointmentId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: `Appointment marked as ${newStatus}`, type: "success" });
        setShowStatusModal(false);
        // Refresh appointments
        fetchAppointments(user.id);
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      } else {
        setMessage({ text: data.message || "Error updating status", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error", type: "error" });
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Filter by search term (patient name or email)
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patientEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter appointments within each patient
    filtered = filtered.map(patient => ({
      ...patient,
      appointments: patient.appointments.filter(appt => {
        // Status filter
        if (statusFilter !== 'all' && appt.status !== statusFilter) {
          return false;
        }

        // Date filter
        if (dateFilter !== 'all') {
          const appointmentDate = new Date(appt.scheduled_date);
          const today = new Date();
          const weekFromNow = new Date();
          weekFromNow.setDate(today.getDate() + 7);
          const monthFromNow = new Date();
          monthFromNow.setMonth(today.getMonth() + 1);

          switch(dateFilter) {
            case 'past':
              return appointmentDate < today;
            case 'today':
              return appointmentDate.toDateString() === today.toDateString();
            case 'week':
              return appointmentDate >= today && appointmentDate <= weekFromNow;
            case 'month':
              return appointmentDate >= today && appointmentDate <= monthFromNow;
            case 'future':
              return appointmentDate > today;
            default:
              return true;
          }
        }

        return true;
      })
    }));

    // Remove patients with no appointments after filtering
    filtered = filtered.filter(patient => patient.appointments.length > 0);

    setFilteredAppointments(filtered);
  };

  const fetchReferenceData = async () => {
    try {
      const [diagRes, medRes, moodRes, therapyRes] = await Promise.all([
        fetch("http://localhost:5000/api/admin/diagnoses"),
        fetch("http://localhost:5000/api/medications"),
        fetch("http://localhost:5000/api/moods"),
        fetch("http://localhost:5000/api/therapies")
      ]);
      
      setDiagnoses(await diagRes.json());
      setMedications(await medRes.json());
      setMoods(await moodRes.json());
      setTherapies(await therapyRes.json());
    } catch (err) {
      console.error("Error fetching reference data:", err);
    }
  };

  const handleAddRecord = (appointment) => {
    setSelectedAppointment(appointment);
    setNewRecord({
      symptoms: "",
      riskAssessment: "Low",
      treatmentPlan: "",
      diagnoses: [],
      medications: [],
      moods: [],
      therapies: []
    });
    setMedicationSearch("");
    setShowMedicationDropdown(false);
    setShowRecordModal(true);
  };

  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch("http://localhost:5000/api/medicalrecords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedAppointment.user_id, 
          clinicianId: user.id,
          appointmentId: selectedAppointment.appointmentID,
          ...newRecord
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Medical record created successfully", type: "success" });
        setShowRecordModal(false);
        // Update the appointment status to completed
        await fetch(`http://localhost:5000/api/appointments/${selectedAppointment.appointmentID}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" })
        });
        // Refresh appointments
        fetchAppointments(user.id);
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      } else {
        setMessage({ text: data.message || "Error creating record", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error", type: "error" });
    }
  };

  const handleCheckboxChange = (type, id) => {
    setNewRecord(prev => ({
      ...prev,
      [type]: prev[type].includes(id)
        ? prev[type].filter(item => item !== id)
        : [...prev[type], id]
    }));
  };

  const togglePatientExpand = (patientId) => {
    setExpandedPatients(prev => ({
      ...prev,
      [patientId]: !prev[patientId]
    }));
  };

  const filteredMedications = medications.filter(med =>
    med.medicationName.toLowerCase().includes(medicationSearch.toLowerCase()) ||
    (med.dosageForm && med.dosageForm.toLowerCase().includes(medicationSearch.toLowerCase()))
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'scheduled': 'status-scheduled',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled',
      'no-show': 'status-no-show'
    };
    return badges[status] || 'status-scheduled';
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("all");
  };

  if (loading) {
    return (
      <div className="mypatients-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mypatients-container">
      <div className="mypatients-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        <h1>My Patients</h1>
        {user && <p className="clinician-info">{user.username} - {user.type}</p>}
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search patients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="no-show">No Show</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Dates</option>
            <option value="past">Past Appointments</option>
            <option value="today">Today</option>
            <option value="week">Next 7 Days</option>
            <option value="month">Next 30 Days</option>
            <option value="future">Future Appointments</option>
          </select>

          {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="results-count">
        Found {filteredAppointments.length} patient{filteredAppointments.length !== 1 ? 's' : ''}
        {filteredAppointments.length > 0 && (
          <span className="total-appointments">
            {filteredAppointments.reduce((acc, p) => acc + p.appointments.length, 0)} appointments
          </span>
        )}
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="no-patients">
          <p>No patients found matching your filters.</p>
          {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
            <button onClick={clearFilters} className="clear-filters-btn large">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="patients-list">
          {filteredAppointments.map(patient => (
            <div key={patient.patientId} className="patient-card">
              <div 
                className="patient-header clickable"
                onClick={() => togglePatientExpand(patient.patientId)}
              >
                <div className="patient-avatar">
                  {patient.patientName?.charAt(0).toUpperCase() || patient.patientEmail.charAt(0).toUpperCase()}
                </div>
                <div className="patient-info">
                  <h3>{patient.patientName || 'No name'}</h3>
                  <p className="patient-email">{patient.patientEmail}</p>
                  <span className="appointment-count">{patient.appointments.length} appointments</span>
                </div>
                <button className="expand-btn">
                  {expandedPatients[patient.patientId] ? '▼' : '▶'}
                </button>
              </div>

              {expandedPatients[patient.patientId] && (
                <div className="appointments-list">
                  {patient.appointments.map(appt => (
                    <div key={appt.appointmentID} className="appointment-item">
                      <div className="appointment-datetime">
                        <span className="appointment-date">{formatDate(appt.scheduled_date)}</span>
                        <span className="appointment-time">{formatTime(appt.scheduled_time)}</span>
                      </div>
                      
                      <div className="appointment-actions">
                        <span className={`appointment-status ${getStatusBadge(appt.status)}`}>
                          {appt.status}
                        </span>
                        
                        <select
                          className="status-update-select"
                          value={appt.status}
                          onChange={(e) => handleUpdateStatus(appt.appointmentID, e.target.value)}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="no-show">No Show</option>
                          <option value="cancelled">Cancel</option>
                        </select>

                        <button 
                          className="add-record-btn"
                          onClick={() => handleAddRecord(appt)}
                          disabled={appt.status === 'completed' || appt.status === 'cancelled' || appt.status === 'no-show'}
                        >
                          Add Record
                        </button>

                        <button 
                          className="history-btn"
                          onClick={() => handleViewHistory(patient)}
                        >
                          View History
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Medical Record Modal */}
      {showRecordModal && selectedAppointment && (
        <div className="modal" onClick={() => setShowRecordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowRecordModal(false)}>×</button>
            
            <h2>Add Medical Record</h2>
            <div className="appointment-info">
              <p><strong>Patient:</strong> {selectedAppointment.patient_name || selectedAppointment.patient_email}</p>
              <p><strong>Date:</strong> {formatDate(selectedAppointment.scheduled_date)} at {formatTime(selectedAppointment.scheduled_time)}</p>
            </div>

            <form onSubmit={handleSubmitRecord}>
              <div className="form-group">
                <label>Symptoms *</label>
                <textarea
                  value={newRecord.symptoms}
                  onChange={(e) => setNewRecord({...newRecord, symptoms: e.target.value})}
                  required
                  rows="3"
                  placeholder="Describe the patient's symptoms..."
                />
              </div>

              <div className="form-group">
                <label>Risk Assessment</label>
                <select
                  value={newRecord.riskAssessment}
                  onChange={(e) => setNewRecord({...newRecord, riskAssessment: e.target.value})}
                >
                  <option value="Low">Low Risk</option>
                  <option value="Moderate">Moderate Risk</option>
                  <option value="High">High Risk</option>
                </select>
              </div>

              <div className="form-group">
                <label>Treatment Plan</label>
                <textarea
                  value={newRecord.treatmentPlan}
                  onChange={(e) => setNewRecord({...newRecord, treatmentPlan: e.target.value})}
                  rows="3"
                  placeholder="Outline the treatment plan..."
                />
              </div>

              <div className="form-section">
                <label>Diagnoses</label>
                <div className="checkbox-grid">
                  {diagnoses.map(diag => (
                    <label key={diag.diagnosisID} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={newRecord.diagnoses.includes(diag.diagnosisID)}
                        onChange={() => handleCheckboxChange('diagnoses', diag.diagnosisID)}
                      />
                      {diag.diagnosisName}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <label>Medications</label>
                <div className="medication-selector" ref={medicationDropdownRef}>
                  <div 
                    className="medication-search-box"
                    onClick={() => setShowMedicationDropdown(!showMedicationDropdown)}
                  >
                    <input
                      type="text"
                      placeholder="Search medications..."
                      value={medicationSearch}
                      onChange={(e) => {
                        setMedicationSearch(e.target.value);
                        setShowMedicationDropdown(true);
                      }}
                      onFocus={() => setShowMedicationDropdown(true)}
                    />
                    <span className="dropdown-arrow">{showMedicationDropdown ? '▲' : '▼'}</span>
                  </div>
                  
                  {showMedicationDropdown && (
                    <div className="medication-dropdown">
                      <div className="selected-count">
                        {newRecord.medications.length} selected
                      </div>
                      <div className="medication-list">
                        {filteredMedications.length > 0 ? (
                          filteredMedications.map(med => (
                            <label key={med.medicationID} className="medication-item">
                              <input
                                type="checkbox"
                                checked={newRecord.medications.includes(med.medicationID)}
                                onChange={() => handleCheckboxChange('medications', med.medicationID)}
                              />
                              <div className="medication-info">
                                <span className="medication-name">{med.medicationName}</span>
                                {med.dosageForm && (
                                  <span className="medication-dosage">{med.dosageForm}</span>
                                )}
                                {med.standardDose && (
                                  <span className="medication-dose">{med.standardDose}</span>
                                )}
                              </div>
                            </label>
                          ))
                        ) : (
                          <div className="no-results">No medications found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Show selected medications as tags */}
                {newRecord.medications.length > 0 && (
                  <div className="selected-medications">
                    {newRecord.medications.map(id => {
                      const med = medications.find(m => m.medicationID === id);
                      return med ? (
                        <span key={id} className="medication-tag">
                          {med.medicationName}
                          {med.dosageForm && ` (${med.dosageForm})`}
                          <button 
                            type="button"
                            className="remove-tag"
                            onClick={() => handleCheckboxChange('medications', id)}
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <div className="form-section">
                <label>Moods</label>
                <div className="checkbox-grid">
                  {moods.map(mood => (
                    <label key={mood.moodID} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={newRecord.moods.includes(mood.moodID)}
                        onChange={() => handleCheckboxChange('moods', mood.moodID)}
                      />
                      {mood.moodName}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <label>Therapies</label>
                <div className="checkbox-grid">
                  {therapies.map(therapy => (
                    <label key={therapy.therapyID} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={newRecord.therapies.includes(therapy.therapyID)}
                        onChange={() => handleCheckboxChange('therapies', therapy.therapyID)}
                      />
                      {therapy.therapyName}
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="submit-btn">Save Medical Record</button>
                <button type="button" className="cancel-btn" onClick={() => setShowRecordModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient History Modal */}
      {showPatientHistoryModal && selectedPatient && (
        <div className="modal" onClick={() => setShowPatientHistoryModal(false)}>
          <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowPatientHistoryModal(false)}>×</button>
            
            <h2>Patient History</h2>
            <div className="patient-info-header">
              <div className="patient-avatar large">
                {selectedPatient.patientName?.charAt(0).toUpperCase() || selectedPatient.patientEmail.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3>{selectedPatient.patientName || 'No name'}</h3>
                <p>{selectedPatient.patientEmail}</p>
              </div>
            </div>

            {patientRecords.length === 0 ? (
              <div className="no-records">
                <p>No medical records found for this patient.</p>
              </div>
            ) : (
              <div className="records-timeline">
                {patientRecords.map(record => (
                  <div key={record.recordID} className="record-card">
                    <div className="record-date-badge">
                      {formatDate(record.date)}
                    </div>
                    <div className="record-content">
                      <div className="record-header">
                        <span className={`risk-badge risk-${record.riskAssessment?.toLowerCase()}`}>
                          {record.riskAssessment} Risk
                        </span>
                        <span className="record-clinician">Dr. {record.clinician_name}</span>
                      </div>
                      
                      <div className="record-section">
                        <strong>Symptoms:</strong>
                        <p>{record.symptoms}</p>
                      </div>

                      {record.treatmentPlan && (
                        <div className="record-section">
                          <strong>Treatment Plan:</strong>
                          <p>{record.treatmentPlan}</p>
                        </div>
                      )}

                      {record.diagnoses && record.diagnoses.length > 0 && (
                        <div className="record-section">
                          <strong>Diagnoses:</strong>
                          <div className="tag-group">
                            {record.diagnoses.map((diag, idx) => (
                              <span key={idx} className="tag diagnosis-tag">{diag}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {record.medications && record.medications.length > 0 && (
                        <div className="record-section">
                          <strong>Medications:</strong>
                          <div className="tag-group">
                            {record.medications.map((med, idx) => (
                              <span key={idx} className="tag medication-tag">{med}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {record.moods && record.moods.length > 0 && (
                        <div className="record-section">
                          <strong>Moods:</strong>
                          <div className="tag-group">
                            {record.moods.map((mood, idx) => (
                              <span key={idx} className="tag mood-tag">{mood}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {record.therapies && record.therapies.length > 0 && (
                        <div className="record-section">
                          <strong>Therapies:</strong>
                          <div className="tag-group">
                            {record.therapies.map((therapy, idx) => (
                              <span key={idx} className="tag therapy-tag">{therapy}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Update Confirmation Modal */}
      {showStatusModal && (
        <div className="modal" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <h3>Update Appointment Status</h3>
            <p>Are you sure you want to mark this appointment as <strong>{statusToUpdate.currentStatus}</strong>?</p>
            <div className="modal-actions">
              <button 
                className="confirm-btn"
                onClick={() => confirmStatusUpdate(statusToUpdate.currentStatus)}
              >
                Confirm
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

