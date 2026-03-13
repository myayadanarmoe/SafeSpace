import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StaffSchedule.css";

export default function StaffSchedule() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [clinicians, setClinicians] = useState([]);
  const [selectedClinician, setSelectedClinician] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [showMeetingLinkModal, setShowMeetingLinkModal] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");

  // Room options
  const roomOptions = ["Room 101", "Room 102", "Room 103", "Room 104", "Room 105", 
                       "Room 201", "Room 202", "Room 203", "Conference Room A", "Conference Room B"];

  // Today's date
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const defaultDate = `${yyyy}-${mm}-${dd}`;

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
    setSelectedDate(defaultDate);
    fetchClinicians();
  }, [navigate]);

  useEffect(() => {
    if (selectedDate) {
      fetchAppointments();
    }
  }, [selectedDate, selectedClinician, filterType]);

  const fetchClinicians = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/clinicians");
      const data = await res.json();
      setClinicians(data);
    } catch (err) {
      console.error("Error fetching clinicians:", err);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let url;
      
      // Use different endpoints based on filters
      if (selectedClinician !== "all") {
        url = `http://localhost:5000/api/appointments/clinician/${selectedClinician}/date/${selectedDate}`;
      } else {
        url = `http://localhost:5000/api/appointments/date/${selectedDate}`;
      }
      
      console.log("Fetching from:", url);
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      let data = await res.json();
      console.log("Fetched appointments:", data);
      
      // Filter by appointment type if needed
      if (filterType !== "all") {
        data = data.filter(appt => appt.appointment_type === filterType);
      }
      
      setAppointments(data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setMessage({ text: `Error loading schedule: ${err.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Check if appointment was created by staff (based on type and meeting link)
  const isStaffCreated = (appointment) => {
    // Offline appointments are typically created by staff
    // Online appointments with no meeting link might be staff-created and pending
    return appointment.appointment_type === 'offline' || 
           (appointment.appointment_type === 'online' && !appointment.meeting_link);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${selectedAppointment.appointmentID}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Appointment cancelled successfully", type: "success" });
        fetchAppointments();
        setShowCancelModal(false);
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      } else {
        setMessage({ text: data.message || "Error cancelling appointment", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error", type: "error" });
    }
  };

  const handleUpdateRoom = async () => {
    if (!selectedAppointment || !newRoomNumber) return;

    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${selectedAppointment.appointmentID}/room`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomNumber: newRoomNumber })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Room updated successfully", type: "success" });
        fetchAppointments();
        setShowRoomModal(false);
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      } else {
        setMessage({ text: data.message || "Error updating room", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error", type: "error" });
    }
  };

  const handleUpdateMeetingLink = async () => {
    if (!selectedAppointment || !meetingLink) return;

    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${selectedAppointment.appointmentID}/meeting-link`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingLink })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Meeting link updated successfully", type: "success" });
        fetchAppointments();
        setShowMeetingLinkModal(false);
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      } else {
        setMessage({ text: data.message || "Error updating meeting link", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error", type: "error" });
    }
  };

  const handleCheckIn = async (appointmentId) => {
  try {
    const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/checkin`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();

    if (res.ok) {
      setMessage({ text: "Patient checked in successfully", type: "success" });
      fetchAppointments(); // Refresh the list
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } else {
      setMessage({ text: data.message || "Error checking in patient", type: "error" });
    }
  } catch (err) {
    console.error("Check-in error:", err);
    setMessage({ text: "Network error", type: "error" });
  }
};

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'scheduled': 'badge-scheduled',
      'completed': 'badge-completed',
      'cancelled': 'badge-cancelled',
      'no-show': 'badge-noshow'
    };
    return badges[status] || 'badge-scheduled';
  };

  const canManage = (appointment) => {
    // Staff can manage:
    // 1. All offline appointments
    // 2. Online appointments that were created by staff (no meeting link)
    // 3. No-show appointments
    return appointment.appointment_type === 'offline' || 
           (appointment.appointment_type === 'online' && !appointment.meeting_link) ||
           appointment.status === 'no-show';
  };

  return (
    <div className="staff-schedule-container">
      <div className="staff-schedule-header">
        <button className="back-button" onClick={() => navigate('/staff/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>Daily Schedule</h1>
        {user && <p className="staff-info">{user.username} - {user.type}</p>}
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="schedule-filters">
        <div className="filter-group">
          <label>Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />
        </div>

        <div className="filter-group">
          <label>Clinician:</label>
          <select
            value={selectedClinician}
            onChange={(e) => setSelectedClinician(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Clinicians</option>
            {clinicians.map(clinician => (
              <option key={clinician.id} value={clinician.id}>
                {clinician.username} - {clinician.type}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="schedule-legend">
        <span className="legend-item">
          <span className="legend-dot staff-created"></span> Staff-Created
        </span>
        <span className="legend-item">
          <span className="legend-dot patient-created"></span> Patient-Created
        </span>
      </div>

      {/* Schedule Table */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading schedule...</p>
        </div>
      ) : (
        <div className="schedule-table-container">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Patient</th>
                <th>Clinician</th>
                <th>Type</th>
                <th>Status</th>
                <th>Room/Link</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">No appointments scheduled for this date</td>
                </tr>
              ) : (
                appointments.map(appt => {
                  const staffCreated = isStaffCreated(appt);
                  const manageable = canManage(appt);
                  
                  return (
                    <tr key={appt.appointmentID} className={staffCreated ? 'staff-created-row' : 'patient-created-row'}>
                      <td>{formatTime(appt.scheduled_time)}</td>
                      <td>
                        <div className="patient-cell">
                          <strong>{appt.patient_name || 'Unknown'}</strong>
                          <small>{appt.patient_email}</small>
                        </div>
                      </td>
                      <td>{appt.clinician_name}</td>
                      <td>
                        <span className={`appointment-type ${appt.appointment_type}`}>
                          {appt.appointment_type === 'online' ? '📹 Online' : '🏢 Offline'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadge(appt.status)}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td>
                        {appt.appointment_type === 'online' ? (
                          <div className="link-info">
                            {appt.meeting_link ? (
                              <a href={appt.meeting_link} target="_blank" rel="noopener noreferrer" className="meeting-link">
                                Join
                              </a>
                            ) : (
                              <span className="no-link">Not set</span>
                            )}
                            {manageable && appt.status === 'scheduled' && (
                              <button 
                                className="icon-btn"
                                onClick={() => {
                                  setSelectedAppointment(appt);
                                  setMeetingLink(appt.meeting_link || '');
                                  setShowMeetingLinkModal(true);
                                }}
                                title="Set Meeting Link"
                              >
                                🔗
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="room-info">
                            <span>{appt.room_number || 'Not assigned'}</span>
                            {manageable && appt.status === 'scheduled' && (
                              <button 
                                className="icon-btn"
                                onClick={() => {
                                  setSelectedAppointment(appt);
                                  setNewRoomNumber(appt.room_number || '');
                                  setShowRoomModal(true);
                                }}
                                title="Change Room"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`created-badge ${staffCreated ? 'staff' : 'patient'}`}>
                          {staffCreated ? '👤 Staff' : '👥 Patient'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                        {appt.status === 'scheduled' && manageable ? (
                          <>
                          <button 
                            className="cancel-btn"
                            onClick={() => {
                            setSelectedAppointment(appt);
                            setShowCancelModal(true);
                            }}
                          >
                          Cancel
                          </button>
                          <button 
                            className="checkin-btn"
                            onClick={() => handleCheckIn(appt.appointmentID)}
                            >
                          Check In
                          </button>
                          </>
                          ) : appt.status === 'scheduled' && !manageable ? (
                          <span className="cannot-manage" title="Patient-created online appointments cannot be modified by staff">
                          🔒 Read Only
                          </span>
                          ) : (
                          <span className="status-text">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="modal" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Appointment</h3>
            <p>Are you sure you want to cancel this appointment?</p>
            <div className="appointment-details">
              <p><strong>Patient:</strong> {selectedAppointment.patient_name}</p>
              <p><strong>Time:</strong> {formatTime(selectedAppointment.scheduled_time)}</p>
              <p><strong>Type:</strong> {selectedAppointment.appointment_type}</p>
              <p><strong>Created by:</strong> {isStaffCreated(selectedAppointment) ? 'Staff' : 'Patient'}</p>
            </div>
            <div className="warning-message">
              ⚠️ This action cannot be undone
            </div>
            <div className="modal-actions">
              <button className="confirm-cancel-btn" onClick={handleCancelAppointment}>
                Yes, Cancel
              </button>
              <button className="cancel-btn" onClick={() => setShowCancelModal(false)}>
                No, Keep
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Room Modal */}
      {showRoomModal && selectedAppointment && (
        <div className="modal" onClick={() => setShowRoomModal(false)}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <h3>Change Room</h3>
            <p>Select a new room for this appointment</p>
            <select
              value={newRoomNumber}
              onChange={(e) => setNewRoomNumber(e.target.value)}
              className="room-select"
            >
              <option value="">Choose a room...</option>
              {roomOptions.map(room => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
            <div className="modal-actions">
              <button className="save-btn" onClick={handleUpdateRoom}>
                Update Room
              </button>
              <button className="cancel-btn" onClick={() => setShowRoomModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Meeting Link Modal */}
      {showMeetingLinkModal && selectedAppointment && (
        <div className="modal" onClick={() => setShowMeetingLinkModal(false)}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <h3>Set Meeting Link</h3>
            <p>Enter the meeting link for this online appointment</p>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://zoom.us/j/123456789"
              className="meeting-link-input"
            />
            <div className="modal-actions">
              <button className="save-btn" onClick={handleUpdateMeetingLink}>
                Save Link
              </button>
              <button className="cancel-btn" onClick={() => setShowMeetingLinkModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}