import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/StaffBooking.css";

export default function StaffBooking() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [clinicians, setClinicians] = useState([]);
  const [filteredClinicians, setFilteredClinicians] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedClinician, setSelectedClinician] = useState(null);
  const [appointmentType, setAppointmentType] = useState("online");
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  
  // New patient form
  const [newPatient, setNewPatient] = useState({
    name: "",
    email: "",
    password: "",
    type: "Standard User"
  });

  // Today's date for min date input
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const minDate = `${yyyy}-${mm}-${dd}`;

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
    fetchBranches();
    fetchClinicians();
    fetchRooms();
  }, [navigate]);

  useEffect(() => {
    // Filter clinicians by selected branch
    if (selectedBranch) {
      const filtered = clinicians.filter(c => c.branch_id === selectedBranch.branch_id);
      setFilteredClinicians(filtered);
    } else {
      setFilteredClinicians(clinicians);
    }
  }, [selectedBranch, clinicians]);

  useEffect(() => {
    // Filter rooms by selected branch
    if (selectedBranch) {
      const filtered = rooms.filter(r => r.branch_id === selectedBranch.branch_id && r.is_active === 1);
      setFilteredRooms(filtered);
    } else {
      setFilteredRooms([]);
    }
  }, [selectedBranch, rooms]);

  useEffect(() => {
    if (selectedClinician && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedClinician, selectedDate]);

  useEffect(() => {
    // Reset room when switching to online
    if (appointmentType === 'online') {
      setSelectedRoom(null);
    }
  }, [appointmentType]);

  const fetchBranches = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/branches");
      const data = await res.json();
      setBranches(data);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  const fetchClinicians = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/clinicians");
      const data = await res.json();
      setClinicians(data);
    } catch (err) {
      console.error("Error fetching clinicians:", err);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/rooms");
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  };

  const searchPatients = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/users/search?term=${searchTerm}`);
      const data = await res.json();
      
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
      const res = await fetch(`http://localhost:5000/api/availability/${selectedClinician.id}`);
      const data = await res.json();
      const slots = generateTimeSlots(data.availability || [], selectedDate);
      setAvailableSlots(slots);
    } catch (err) {
      console.error("Error fetching slots:", err);
      setAvailableSlots([]);
    }
  };

  const generateTimeSlots = (availability, date) => {
    const selectedDateObj = new Date(date);
    const selectedDay = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });
    
    const dayAvailability = availability.filter(slot => slot.day_of_the_week === selectedDay);
    
    if (dayAvailability.length === 0) return [];
    
    let allSlots = [];
    dayAvailability.forEach(slot => {
      const slots = generate30MinSlots(slot.startTime, slot.endTime);
      allSlots = [...allSlots, ...slots];
    });
    
    allSlots = [...new Set(allSlots)].sort();
    return allSlots;
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

  const generateTokenNumber = () => {
    const date = new Date();
    const tokenPrefix = `TKN${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${tokenPrefix}-${randomNum}`;
  };

  const printTokenReceipt = () => {
    if (!appointmentDetails) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Appointment Token - ${appointmentDetails.tokenNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; margin: 0; background: #f5f5f5; }
          .receipt { max-width: 350px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
          .header { text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; }
          .header h2 { margin: 0; font-size: 24px; }
          .token { text-align: center; margin: 20px; padding: 20px; background: #f8f9fa; border-radius: 12px; border: 2px dashed #667eea; }
          .token-number { font-size: 28px; font-weight: bold; color: #667eea; font-family: monospace; }
          .details { margin: 20px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .footer { text-align: center; padding: 15px; background: #f8f9fa; font-size: 11px; color: #999; }
          @media print { body { background: white; } .receipt { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header"><h2>SafeSpace</h2><p>Appointment Token</p></div>
          <div class="token"><div class="token-number">${appointmentDetails.tokenNumber}</div></div>
          <div class="details">
            <div class="detail-row"><span>Patient:</span><strong>${appointmentDetails.patientName}</strong></div>
            <div class="detail-row"><span>Clinician:</span><strong>${appointmentDetails.clinicianName}</strong></div>
            <div class="detail-row"><span>Date:</span><strong>${appointmentDetails.date}</strong></div>
            <div class="detail-row"><span>Time:</span><strong>${appointmentDetails.time}</strong></div>
            <div class="detail-row"><span>Type:</span><strong>${appointmentDetails.type === 'online' ? 'Online' : 'In-Person'}</strong></div>
            ${appointmentDetails.room ? `<div class="detail-row"><span>Room:</span><strong>${appointmentDetails.room}</strong></div>` : ''}
            ${appointmentDetails.branch ? `<div class="detail-row"><span>Branch:</span><strong>${appointmentDetails.branch}</strong></div>` : ''}
          </div>
          <div class="footer">Generated on ${new Date().toLocaleString()}<br>SafeSpace Mental Health Support</div>
        </div>
        <script>window.print();setTimeout(()=>window.close(),500);</script>
      </body>
      </html>
    `);
    printWindow.document.close();
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
        setSelectedPatient({ id: data.userId, name: newPatient.name, email: newPatient.email, type: newPatient.type });
        setNewPatient({ name: "", email: "", password: "", type: "Standard User" });
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
    if (appointmentType === 'offline' && !selectedRoom) {
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
      if (appointmentType === 'offline') {
        appointmentData.roomId = parseInt(selectedRoom.room_id);
      }

      const res = await fetch("http://localhost:5000/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      });

      const data = await res.json();
      if (res.ok) {
        const token = generateTokenNumber();
        const roomInfo = selectedRoom ? `${selectedRoom.room_number} (${selectedRoom.room_type})` : null;
        const branchInfo = selectedBranch ? `${selectedBranch.city} - ${selectedBranch.location}` : null;
        
        setAppointmentDetails({
          tokenNumber: token,
          patientName: selectedPatient.name || selectedPatient.email,
          clinicianName: selectedClinician.name,
          date: new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          time: formatTime(selectedSlot),
          type: appointmentType,
          room: roomInfo,
          branch: branchInfo
        });
        setShowTokenModal(true);
        setSelectedSlot(null);
        setSelectedDate("");
        setSelectedRoom(null);
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
        <button className="back-button" onClick={() => navigate('/staff/dashboard')}>← Back to Dashboard</button>
        <h1>Book Appointment</h1>
        {user && <p className="staff-info">{user.name} - {user.type}</p>}
      </div>

      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

      <div className="booking-grid">
        {/* Left Panel - Patient Selection */}
        <div className="patient-selection-panel">
          <h2>Patient Information</h2>
          <div className="search-section">
            <div className="search-box">
              <input type="text" placeholder="Search patient by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && searchPatients()} />
              <button onClick={searchPatients} disabled={loading}>{loading ? "Searching..." : "Search"}</button>
            </div>
            <button className="new-patient-btn" onClick={() => setShowNewPatientForm(true)}>+ New Patient</button>
          </div>

          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results</h3>
              {searchResults.map(patient => (
                <div key={patient.id} className={`patient-card ${selectedPatient?.id === patient.id ? 'selected' : ''}`} onClick={() => { setSelectedPatient(patient); setSearchResults([]); setSearchTerm(""); }}>
                  <div className="patient-avatar">{patient.name?.charAt(0).toUpperCase() || patient.email.charAt(0).toUpperCase()}</div>
                  <div className="patient-info"><h4>{patient.name || "No name"}</h4><p>{patient.email}</p><span className="patient-type">{patient.type}</span></div>
                </div>
              ))}
            </div>
          )}

          {selectedPatient && (
            <div className="selected-patient">
              <h3>Selected Patient</h3>
              <div className="selected-patient-card">
                <div className="patient-avatar large">{selectedPatient.name?.charAt(0).toUpperCase() || selectedPatient.email.charAt(0).toUpperCase()}</div>
                <div className="patient-details">
                  <h4>{selectedPatient.name || "No name"}</h4>
                  <p>{selectedPatient.email}</p>
                  <p className="patient-type-badge">{selectedPatient.type}</p>
                  <button className="change-patient-btn" onClick={() => setSelectedPatient(null)}>Change</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Appointment Details */}
        <div className="appointment-panel">
          <h2>Appointment Details</h2>

          {/* Step 1: Select Branch */}
          <div className="form-group">
            <label>1. Select Branch *</label>
            <select value={selectedBranch?.branch_id || ""} onChange={(e) => {
              const branch = branches.find(b => b.branch_id === parseInt(e.target.value));
              setSelectedBranch(branch);
              setSelectedClinician(null);
              setSelectedRoom(null);
            }}>
              <option value="">Choose a branch...</option>
              {branches.map(branch => (
                <option key={branch.branch_id} value={branch.branch_id}>{branch.city} - {branch.location}</option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Clinician (filtered by branch) */}
          {selectedBranch && (
            <div className="form-group">
              <label>2. Select Clinician *</label>
              <select value={selectedClinician?.id || ""} onChange={(e) => {
                const clinician = filteredClinicians.find(c => c.id === parseInt(e.target.value));
                setSelectedClinician(clinician);
                setSelectedDate("");
                setSelectedSlot(null);
                setAvailableSlots([]);
              }}>
                <option value="">Choose a clinician...</option>
                {filteredClinicians.map(clinician => (
                  <option key={clinician.id} value={clinician.id}>{clinician.name} - {clinician.type}</option>
                ))}
              </select>
            </div>
          )}

          {/* Appointment Type */}
          <div className="form-group">
            <label>Appointment Type</label>
            <div className="appointment-type-group">
              <label className="type-option"><input type="radio" value="online" checked={appointmentType === 'online'} onChange={(e) => setAppointmentType(e.target.value)} /><span>Online Video Call</span></label>
              <label className="type-option"><input type="radio" value="offline" checked={appointmentType === 'offline'} onChange={(e) => setAppointmentType(e.target.value)} /><span>In-Person (Offline)</span></label>
            </div>
          </div>

          {/* Date Selection */}
          {selectedClinician && (
            <div className="form-group">
              <label>Select Date *</label>
              <input type="date" value={selectedDate} min={minDate} onChange={(e) => setSelectedDate(e.target.value)} className="date-input" />
            </div>
          )}

          {/* Time Slots */}
          {selectedDate && availableSlots.length > 0 && (
            <div className="slots-section">
              <h3>Available Time Slots</h3>
              <div className="slots-grid">
                {availableSlots.map(slot => (
                  <button key={slot} className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`} onClick={() => setSelectedSlot(slot)}>{formatTime(slot)}</button>
                ))}
              </div>
            </div>
          )}
          {selectedDate && availableSlots.length === 0 && <p className="no-slots">No available slots for this date</p>}

          {/* Step 3: Select Room for Offline Appointments */}
          {selectedSlot && appointmentType === 'offline' && selectedBranch && (
            <div className="form-group">
              <label>3. Select Room *</label>
              <select value={selectedRoom?.room_id || ""} onChange={(e) => {
                const room = filteredRooms.find(r => r.room_id === parseInt(e.target.value));
                setSelectedRoom(room);
              }}>
                <option value="">Choose a room...</option>
                {filteredRooms.map(room => (
                  <option key={room.room_id} value={room.room_id}>{room.room_number} - {room.room_type} (Capacity: {room.capacity})</option>
                ))}
              </select>
            </div>
          )}

          {selectedSlot && appointmentType === 'online' && (
            <div className="info-message"><p>ℹ️ A meeting link will be automatically generated after booking</p></div>
          )}

          {/* Book Button */}
          {selectedPatient && selectedClinician && selectedDate && selectedSlot && (appointmentType === 'online' || (appointmentType === 'offline' && selectedRoom)) && (
            <div className="booking-summary">
              <h3>Booking Summary</h3>
              <div className="summary-details">
                <p><strong>Branch:</strong> {selectedBranch?.city} - {selectedBranch?.location}</p>
                <p><strong>Patient:</strong> {selectedPatient.name || selectedPatient.email}</p>
                <p><strong>Clinician:</strong> {selectedClinician.name} ({selectedClinician.type})</p>
                <p><strong>Type:</strong> {appointmentType === 'online' ? 'Online Video Call' : 'In-Person'}</p>
                <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {formatTime(selectedSlot)}</p>
                {appointmentType === 'offline' && selectedRoom && <p><strong>Room:</strong> {selectedRoom.room_number} ({selectedRoom.room_type})</p>}
              </div>
              <button className="book-btn" onClick={handleBookAppointment}>Confirm Booking</button>
            </div>
          )}
        </div>
      </div>

      {/* Token Modal */}
      {showTokenModal && appointmentDetails && (
        <div className="modal" onClick={() => setShowTokenModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowTokenModal(false)}>×</button>
            <div className="token-success"><div className="success-icon">✓</div><h2>Appointment Confirmed!</h2></div>
            <div className="token-card"><div className="token-label">TOKEN NUMBER</div><div className="token-number">{appointmentDetails.tokenNumber}</div></div>
            <div className="appointment-summary">
              <h3>Appointment Details</h3>
              <div className="summary-item"><span>Patient:</span><strong>{appointmentDetails.patientName}</strong></div>
              <div className="summary-item"><span>Clinician:</span><strong>{appointmentDetails.clinicianName}</strong></div>
              <div className="summary-item"><span>Date & Time:</span><strong>{appointmentDetails.date} at {appointmentDetails.time}</strong></div>
              <div className="summary-item"><span>Type:</span><strong>{appointmentDetails.type === 'online' ? 'Online Video Call' : 'In-Person'}</strong></div>
              {appointmentDetails.room && <div className="summary-item"><span>Room:</span><strong>{appointmentDetails.room}</strong></div>}
              {appointmentDetails.branch && <div className="summary-item"><span>Branch:</span><strong>{appointmentDetails.branch}</strong></div>}
            </div>
            <br />
            <div className="token-actions">
              <button className="btn-create" onClick={printTokenReceipt}>🖨️ Print Token</button>
              <button className="btn-cancel" onClick={() => { setShowTokenModal(false); setSelectedPatient(null); setSelectedClinician(null); setSelectedBranch(null); setSelectedDate(""); setSelectedSlot(null); setSelectedRoom(null); setAvailableSlots([]); }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* New Patient Modal */}
      {showNewPatientForm && (
        <div className="modal" onClick={() => setShowNewPatientForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowNewPatientForm(false)}>×</button>
            <h2>Register New Patient</h2>
            <form onSubmit={handleCreateNewPatient}>
              <div className="form-group"><label>Full Name *</label><input type="text" value={newPatient.name} onChange={(e) => setNewPatient({...newPatient, name: e.target.value})} required /></div>
              <div className="form-group"><label>Email *</label><input type="email" value={newPatient.email} onChange={(e) => setNewPatient({...newPatient, email: e.target.value})} required /></div>
              <div className="form-group"><label>Password *</label><input type="password" value={newPatient.password} onChange={(e) => setNewPatient({...newPatient, password: e.target.value})} required minLength="6" /></div>
              <div className="form-group"><label>User Type</label><select value={newPatient.type} onChange={(e) => setNewPatient({...newPatient, type: e.target.value})}><option value="Standard User">Standard User</option><option value="Premium User">Premium User</option><option value="Youth User">Youth User</option></select></div>
              <div className="modal-actions"><button type="submit" className="submit-btn">Create Patient</button><button type="button" className="cancel-btn" onClick={() => setShowNewPatientForm(false)}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}