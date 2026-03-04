import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Availability.css";

export default function Availability() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" }); // For main page messages
  const [modalMessage, setModalMessage] = useState({ text: "", type: "" }); // For modal messages
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day_of_the_week: "Monday",
    startTime: "09:00:00",
    endTime: "17:00:00"
  });

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      const professionalTypes = ['Psychiatrist', 'Psychologist', 'Therapist'];
      if (!professionalTypes.includes(userData.type)) {
        navigate('/');
      } else {
        fetchAvailability(userData.id);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchAvailability = async (clinicianId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/availability/${clinicianId}`);
      const data = await res.json();
      setAvailability(data.availability || []);
    } catch (err) {
      console.error("Error fetching availability:", err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const showModalMessage = (text, type) => {
    setModalMessage({ text, type });
    // Auto clear after 3 seconds
    setTimeout(() => setModalMessage({ text: "", type: "" }), 3000);
  };

  // Function to check if time slots overlap
  const checkTimeOverlap = (day, newStart, newEnd) => {
    const newStartMinutes = timeToMinutes(newStart);
    const newEndMinutes = timeToMinutes(newEnd);

    const existingSlots = availability.filter(slot => slot.day_of_the_week === day);
    
    for (const slot of existingSlots) {
      const existingStart = timeToMinutes(slot.startTime);
      const existingEnd = timeToMinutes(slot.endTime);

      if (
        (newStartMinutes >= existingStart && newStartMinutes < existingEnd) ||
        (newEndMinutes > existingStart && newEndMinutes <= existingEnd) ||
        (newStartMinutes <= existingStart && newEndMinutes >= existingEnd)
      ) {
        return true;
      }
    }
    return false;
  };

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const validateTimeSlot = (day, startTime, endTime) => {
    // Check if start time is before end time
    if (startTime >= endTime) {
      showModalMessage("❌ End time must be after start time", "error");
      return false;
    }

    // Check for overlaps
    if (checkTimeOverlap(day, startTime, endTime)) {
      showModalMessage("❌ Your available time overlapped.", "error");
      return false;
    }

    return true;
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    
    // Clear any previous modal message
    setModalMessage({ text: "", type: "" });
    
    // Validate time slot before sending to server
    if (!validateTimeSlot(newSlot.day_of_the_week, newSlot.startTime, newSlot.endTime)) {
      return;
    }
    
    try {
      const res = await fetch("http://localhost:5000/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicianID: user.id,
          day_of_the_week: newSlot.day_of_the_week,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showModalMessage("✅ Availability slot added successfully!", "success");
        setTimeout(() => {
          setShowAddModal(false);
          setNewSlot({
            day_of_the_week: "Monday",
            startTime: "09:00:00",
            endTime: "17:00:00"
          });
          setModalMessage({ text: "", type: "" });
          fetchAvailability(user.id);
        }, 1500);
      } else {
        showModalMessage(`❌ ${data.message}`, "error");
      }
    } catch (err) {
      showModalMessage("❌ Network error", "error");
    }
  };

  const handleDeleteSlot = async (availabilityId) => {
    if (!window.confirm("Are you sure you want to delete this availability slot?")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/availability/${availabilityId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showMessage("✅ Availability slot deleted", "success");
        fetchAvailability(user.id);
      }
    } catch (err) {
      showMessage("❌ Network error", "error");
    }
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5);
  };

  const getDaySchedule = (day) => {
    return availability.filter(slot => slot.day_of_the_week === day);
  };

  const sortTimeSlots = (slots) => {
    return [...slots].sort((a, b) => {
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });
  };

  const closeModal = () => {
    setShowAddModal(false);
    setModalMessage({ text: "", type: "" });
    setNewSlot({
      day_of_the_week: "Monday",
      startTime: "09:00:00",
      endTime: "17:00:00"
    });
  };

  if (loading) {
    return (
      <div className="availability-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="availability-container">
      <div className="availability-header">
        <div>
          <h1>My Availability</h1>
          <p className="subtitle">Manage your weekly schedule</p>
        </div>
        <div className="header-actions">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <button className="btn-add" onClick={() => setShowAddModal(true)}>
            + Add Availability
          </button>
        </div>
      </div>

      {/* Main page message */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="availability-grid">
        {daysOfWeek.map(day => {
          const slots = getDaySchedule(day);
          const sortedSlots = sortTimeSlots(slots);
          
          return (
            <div key={day} className="day-card">
              <h3>{day}</h3>
              {sortedSlots.length > 0 ? (
                <div className="time-slots">
                  {sortedSlots.map(slot => (
                    <div key={slot.availabilityID} className="time-slot">
                      <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                      <button 
                        className="delete-slot"
                        onClick={() => handleDeleteSlot(slot.availabilityID)}
                        title="Delete slot"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-slots">No availability</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Availability Modal */}
      {showAddModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Availability Slot</h2>
            
            {/* Modal message - THIS WILL SHOW INSIDE THE POPUP */}
            {modalMessage.text && (
              <div className={`modal-message ${modalMessage.type}`}>
                {modalMessage.text}
              </div>
            )}
            
            <form onSubmit={handleAddSlot}>
              <div className="form-group">
                <label>Day:</label>
                <select
                  value={newSlot.day_of_the_week}
                  onChange={(e) => setNewSlot({...newSlot, day_of_the_week: e.target.value})}
                  required
                >
                  {daysOfWeek.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time:</label>
                  <input
                    type="time"
                    value={newSlot.startTime.substring(0, 5)}
                    onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value + ":00"})}
                    required
                    step="3600"
                  />
                </div>

                <div className="form-group">
                  <label>End Time:</label>
                  <input
                    type="time"
                    value={newSlot.endTime.substring(0, 5)}
                    onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value + ":00"})}
                    required
                    step="3600"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-save">
                  Add Slot
                </button>
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}