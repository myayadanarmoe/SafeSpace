import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StaffBooking.css";

export default function StaffBooking() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [clinicians, setClinicians] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedClinician, setSelectedClinician] = useState(null);
  const [appointmentType, setAppointmentType] = useState("online");
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [roomNumber, setRoomNumber] = useState("");
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // New patient form
  const [newPatient, setNewPatient] = useState({
    username: "",
    email: "",
    password: "",
    type: "Standard User"
  });

  // Available room numbers
  const roomOptions = ["Room 101", "Room 102", "Room 103", "Room 104", "Room 105", 
                       "Room 201", "Room 202", "Room 203", "Conference Room A", "Conference Room B"];

  // Today's date for min date input
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const minDate = `${yyyy}-${mm}-${dd}`;

  useEffect(() => {
    // Check if user is logged in and is staff
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
    fetchClinicians();
  }, [navigate]);

  useEffect(() => {
    if (selectedClinician && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedClinician, selectedDate]);

  useEffect(() => {
    // Reset room number when switching to online
    if (appointmentType === 'online') {
      setRoomNumber("");
    }
  }, [appointmentType]);

  const fetchClinicians = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/clinicians");
      const data = await res.json();
      setClinicians(data);
    } catch (err) {
      console.error("Error fetching clinicians:", err);
    }
  };

  const searchPatients = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/users/search?term=${searchTerm}`);
      const data = await res.json();
      
      // Filter to only show regular users
      const regularUsers = data.filter(patient => 
        patient.type === 'Standard User' || 
        patient.type === 'Premium User' || 
        patient.type === 'Youth User'
      );
      
      setSearchResults(regularUsers);
    } catch (err) {
      console.error("Error searching patients:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      // Get clinician's availability
      const res = await fetch(
        `http://localhost:5000/api/availability/${selectedClinician.id}`
      );
      const data = await res.json();
      
      // Get booked slots for the selected date
      const bookedRes = await fetch(
        `http://localhost:5000/api/appointments/check?clinicianId=${selectedClinician.id}&date=${selectedDate}`
      );
      const bookedData = await bookedRes.json();
      
      // Generate available slots based on clinician's availability
      const slots = generateTimeSlots(data.availability || [], selectedDate, bookedData);
      setAvailableSlots(slots);
    } catch (err) {
      console.error("Error fetching slots:", err);
    }
  };

  const generateTimeSlots = (availability, date, bookedSlots) => {
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const dayAvailability = availability.filter(slot => slot.day_of_the_week === dayOfWeek);
    
    if (dayAvailability.length === 0) return [];
    
    let allSlots = [];
    dayAvailability.forEach(slot => {
      const slots = generate30MinSlots(slot.startTime, slot.endTime);
      allSlots = [...allSlots, ...slots];
    });
    
    // Remove duplicates and sort
    allSlots = [...new Set(allSlots)].sort();
    
    // Filter out booked slots
    return allSlots.filter(slot => !bookedSlots.includes(slot));
  };

  const generate30MinSlots = (startTime, endTime) => {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
      slots.push(timeStr);
      
      currentMin += 30;
      if (currentMin >= 60) {
        currentHour += 1;
        currentMin = 0;
      }
    }
    
    return slots;
  };

  const handleCreateNewPatient = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch("http://localhost:5000/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPatient),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Patient created successfully", type: "success" });
        setShowNewPatientForm(false);
        // Auto-select the new patient
        setSelectedPatient({ 
          id: data.userId, 
          username: newPatient.username, 
          email: newPatient.email,
          type: newPatient.type 
        });
        setNewPatient({
          username: "",
          email: "",
          password: "",
          type: "Standard User"
        });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      } else {
        setMessage({ text: data.message || "Error creating patient", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error", type: "error" });
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedPatient || !selectedClinician || !selectedDate || !selectedSlot) {
      setMessage({ text: "Please select patient, clinician, date and time", type: "error" });
      return;
    }

    // Validate room number for offline appointments
    if (appointmentType === 'offline' && !roomNumber) {
      setMessage({ text: "Please select a room for offline appointment", type: "error" });
      return;
    }

    try {
      const appointmentData = {
        patientId: selectedPatient.id,
        clinicianId: selectedClinician.id,
        date: selectedDate,
        time: selectedSlot,
        type: appointmentType
      };

      // Add room number for offline appointments
      if (appointmentType === 'offline') {
        appointmentData.roomNumber = roomNumber;
      }

      console.log("Sending appointment data:", appointmentData);

      const res = await fetch("http://localhost:5000/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Appointment booked successfully!", type: "success" });
        
        // Reset form
        setSelectedSlot(null);
        setSelectedDate("");
        setRoomNumber("");
        setSelectedPatient(null);
        setSelectedClinician(null);
        fetchAvailableSlots(); // Refresh available slots
        
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      } else {
        setMessage({ text: data.message || "Error booking appointment", type: "error" });
      }
    } catch (err) {
      console.error("Booking error:", err);
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

  return (
    <div className="staff-booking-container">
      <div className="staff-booking-header">
        <button className="back-button" onClick={() => navigate('/staff/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>Book Appointment</h1>
        {user && <p className="staff-info">{user.username} - {user.type}</p>}
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="booking-grid">
        {/* Left Panel - Patient Selection */}
        <div className="patient-selection-panel">
          <h2>Patient Information</h2>
          
          <div className="search-section">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search patient by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
              />
              <button onClick={searchPatients} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            <button 
              className="new-patient-btn"
              onClick={() => setShowNewPatientForm(true)}
            >
              + New Patient
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results</h3>
              {searchResults.map(patient => (
                <div
                  key={patient.id}
                  className={`patient-card ${selectedPatient?.id === patient.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedPatient(patient);
                    setSearchResults([]);
                    setSearchTerm("");
                  }}
                >
                  <div className="patient-avatar">
                    {patient.username?.charAt(0).toUpperCase() || patient.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="patient-info">
                    <h4>{patient.username || "No username"}</h4>
                    <p>{patient.email}</p>
                    <span className="patient-type">{patient.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Patient */}
          {selectedPatient && (
            <div className="selected-patient">
              <h3>Selected Patient</h3>
              <div className="selected-patient-card">
                <div className="patient-avatar large">
                  {selectedPatient.username?.charAt(0).toUpperCase() || selectedPatient.email.charAt(0).toUpperCase()}
                </div>
                <div className="patient-details">
                  <h4>{selectedPatient.username || "No username"}</h4>
                  <p>{selectedPatient.email}</p>
                  <p className="patient-type-badge">{selectedPatient.type}</p>
                  <button 
                    className="change-patient-btn"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Appointment Details */}
        <div className="appointment-panel">
          <h2>Appointment Details</h2>

          {/* Clinician Selection */}
          <div className="form-group">
            <label>Select Clinician *</label>
            <select
              value={selectedClinician?.id || ""}
              onChange={(e) => {
                const clinician = clinicians.find(c => c.id === parseInt(e.target.value));
                setSelectedClinician(clinician);
                setSelectedDate("");
                setSelectedSlot(null);
              }}
            >
              <option value="">Choose a clinician...</option>
              {clinicians.map(clinician => (
                <option key={clinician.id} value={clinician.id}>
                  {clinician.username} - {clinician.type}
                </option>
              ))}
            </select>
          </div>

          {/* Appointment Type */}
          <div className="form-group">
            <label>Appointment Type</label>
            <div className="appointment-type-group">
              <label className="type-option">
                <input
                  type="radio"
                  value="online"
                  checked={appointmentType === 'online'}
                  onChange={(e) => setAppointmentType(e.target.value)}
                />
                <span>Online Video Call</span>
              </label>
              <label className="type-option">
                <input
                  type="radio"
                  value="offline"
                  checked={appointmentType === 'offline'}
                  onChange={(e) => setAppointmentType(e.target.value)}
                />
                <span>In-Person (Offline)</span>
              </label>
            </div>
          </div>

          {/* Date Selection */}
          {selectedClinician && (
            <div className="form-group">
              <label>Select Date *</label>
              <input
                type="date"
                value={selectedDate}
                min={minDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
              />
            </div>
          )}

          {/* Time Slots */}
          {selectedDate && availableSlots.length > 0 && (
            <div className="slots-section">
              <h3>Available Time Slots</h3>
              <div className="slots-grid">
                {availableSlots.map(slot => (
                  <button
                    key={slot}
                    className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedDate && availableSlots.length === 0 && (
            <p className="no-slots">No available slots for this date</p>
          )}

          {/* Room Selection for Offline Appointments */}
          {selectedSlot && appointmentType === 'offline' && (
            <div className="form-group">
              <label>Select Room *</label>
              <select
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="room-select"
              >
                <option value="">Choose a room...</option>
                {roomOptions.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>
          )}

          {/* Meeting Link Info for Online Appointments */}
          {selectedSlot && appointmentType === 'online' && (
            <div className="info-message">
              <p>ℹ️ A meeting link will be automatically generated after booking</p>
            </div>
          )}

          {/* Book Button */}
          {selectedPatient && selectedClinician && selectedDate && selectedSlot && (
            <div className="booking-summary">
              <h3>Booking Summary</h3>
              <div className="summary-details">
                <p><strong>Patient:</strong> {selectedPatient.username || selectedPatient.email}</p>
                <p><strong>Patient Type:</strong> {selectedPatient.type}</p>
                <p><strong>Clinician:</strong> {selectedClinician.username} ({selectedClinician.type})</p>
                <p><strong>Type:</strong> {appointmentType === 'online' ? 'Online Video Call' : 'In-Person'}</p>
                <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {formatTime(selectedSlot)}</p>
                {appointmentType === 'offline' && roomNumber && (
                  <p><strong>Room:</strong> {roomNumber}</p>
                )}
              </div>
              <button 
                className="book-btn" 
                onClick={handleBookAppointment}
                disabled={appointmentType === 'offline' && !roomNumber}
              >
                Confirm Booking
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Patient Modal */}
      {showNewPatientForm && (
        <div className="modal" onClick={() => setShowNewPatientForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowNewPatientForm(false)}>×</button>
            <h2>Register New Patient</h2>
            
            <form onSubmit={handleCreateNewPatient}>
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={newPatient.username}
                  onChange={(e) => setNewPatient({...newPatient, username: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={newPatient.password}
                  onChange={(e) => setNewPatient({...newPatient, password: e.target.value})}
                  required
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>User Type</label>
                <select
                  value={newPatient.type}
                  onChange={(e) => setNewPatient({...newPatient, type: e.target.value})}
                >
                  <option value="Standard User">Standard User</option>
                  <option value="Premium User">Premium User</option>
                  <option value="Youth User">Youth User</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="submit-btn">Create Patient</button>
                <button type="button" className="cancel-btn" onClick={() => setShowNewPatientForm(false)}>
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