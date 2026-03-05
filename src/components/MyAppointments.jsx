import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MyAppointments.css"

export default function MyAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    
    const userData = JSON.parse(storedUser);
    setUser(userData);
    fetchAppointments(userData.id);
  }, [navigate]);

  const fetchAppointments = async (patientId) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/patient/${patientId}`);
      const data = await res.json();
      setAppointments(data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setMessage({ text: "Error loading appointments", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Appointment cancelled successfully", type: "success" });
        // Refresh appointments
        fetchAppointments(user.id);
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      } else {
        setMessage({ text: data.message || "Error cancelling appointment", type: "error" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      }
    } catch (err) {
      setMessage({ text: "Network error", type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'scheduled':
        return 'status-scheduled';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      case 'no-show':
        return 'status-no-show';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  if (loading) {
    return (
      <div className="appointments-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h1>My Appointments</h1>
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="no-appointments">
          <p>You don't have any appointments yet.</p>
          <button 
            className="browse-doctors-btn"
            onClick={() => navigate('/online-therapy')}
          >
            Browse Therapists
          </button>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map((appointment) => (
            <div key={appointment.appointmentID} className="appointment-card">
              <div className="appointment-header">
                <h3>{appointment.clinician_name}</h3>
                <span className={`status-badge ${getStatusBadgeClass(appointment.status)}`}>
                  {appointment.status}
                </span>
              </div>
              
              <div className="appointment-details">
                <div className="detail-item">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{formatDate(appointment.scheduled_date)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Time:</span>
                  <span className="detail-value">{formatTime(appointment.scheduled_time)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{appointment.appointment_type}</span>
                </div>
                
                {appointment.meeting_link && (
                  <div className="detail-item">
                    <span className="detail-label">Meeting Link:</span>
                    <a 
                      href={appointment.meeting_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="meeting-link"
                    >
                      Join Meeting
                    </a>
                  </div>
                )}
                
                {appointment.room_number && (
                  <div className="detail-item">
                    <span className="detail-label">Room:</span>
                    <span className="detail-value">{appointment.room_number}</span>
                  </div>
                )}
              </div>

              {appointment.status === 'scheduled' && (
                <div className="appointment-actions">
                  <button 
                    className="cancel-btn"
                    onClick={() => handleCancelAppointment(appointment.appointmentID)}
                  >
                    Cancel Appointment
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}