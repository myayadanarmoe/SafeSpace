import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/BookingPage.css";

// Helper function to convert 24h time to 12h format
const convertTo12Hour = (time24) => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Generate 30-minute time slots from availability
const generateTimeSlots = (startTime, endTime) => {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMin = startMin;
  
  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
    slots.push(timeStr); // Store in 24h format for comparison
    
    // Add 30 minutes
    currentMin += 30;
    if (currentMin >= 60) {
      currentHour += 1;
      currentMin = 0;
    }
  }
  
  return slots;
};

export default function BookingPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingMessage, setBookingMessage] = useState({ text: "", type: "" });

  // Get today's date for min date input
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const minDate = `${yyyy}-${mm}-${dd}`;

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
    
    fetchDoctorDetails();
    fetchAvailability();
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate && availability.length > 0) {
      updateAvailableSlots();
      fetchBookedSlots();
    }
  }, [selectedDate, availability]);

  const fetchDoctorDetails = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/clinicians/${doctorId}`);
      const data = await res.json();
      setDoctor(data);
    } catch (err) {
      console.error("Error fetching doctor:", err);
    }
  };

  const fetchAvailability = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/availability/${doctorId}`);
      const data = await res.json();
      setAvailability(data.availability || []);
    } catch (err) {
      console.error("Error fetching availability:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedSlots = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/appointments/check?clinicianId=${doctorId}&date=${selectedDate}`
      );
      const data = await res.json();
      setBookedSlots(data || []);
    } catch (err) {
      console.error("Error fetching booked slots:", err);
    }
  };

  const updateAvailableSlots = () => {
    const selectedDay = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
    
    // Get availability for the selected day
    const dayAvailability = availability.filter(slot => slot.day_of_the_week === selectedDay);
    
    if (dayAvailability.length === 0) {
      setAvailableSlots([]);
      return;
    }

    // Generate all possible slots
    let allSlots = [];
    dayAvailability.forEach(slot => {
      const slots = generateTimeSlots(slot.startTime, slot.endTime);
      allSlots = [...allSlots, ...slots];
    });

    // Remove duplicates
    allSlots = [...new Set(allSlots)];
    
    setAvailableSlots(allSlots);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBooking = async () => {
    if (!selectedSlot || !user) return;

    try {
      const res = await fetch("http://localhost:5000/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: user.id,
          clinicianId: parseInt(doctorId),
          date: selectedDate,
          time: selectedSlot,
          type: 'online'
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setBookingMessage({ text: "Appointment booked successfully!", type: "success" });
        setSelectedSlot(null);
        fetchBookedSlots(); // Refresh booked slots
        setTimeout(() => setBookingMessage({ text: "", type: "" }), 3000);
      } else {
        setBookingMessage({ text: data.message || "Booking failed", type: "error" });
        setTimeout(() => setBookingMessage({ text: "", type: "" }), 3000);
      }
    } catch (err) {
      setBookingMessage({ text: "Network error", type: "error" });
      setTimeout(() => setBookingMessage({ text: "", type: "" }), 3000);
    }
  };

  const isSlotBooked = (slot) => {
    return bookedSlots.includes(slot);
  };

  if (loading) {
    return (
      <div className="booking-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading availability...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="booking-container">
        <p>Doctor not found</p>
        <button onClick={() => navigate('/online-therapy')} className="back-button">
          ← Back to Doctors
        </button>
      </div>
    );
  }

  return (
    <div className="booking-container">
      <div className="booking-header">
        <button onClick={() => navigate('/online-therapy')} className="back-button">
          ← Back to Doctors
        </button>
        <h1>Book Appointment with {doctor.username}</h1>
      </div>

      <div className="booking-content">
        {/* Doctor Info Card */}
        <div className="doctor-info-card">
          <img 
            src={doctor.profile_pic || "https://via.placeholder.com/300x200?text=Doctor"} 
            alt={doctor.username}
            className="doctor-info-image"
          />
          <div className="doctor-info-details">
            <h2>{doctor.username}</h2>
            <span className="doctor-info-specialty">{doctor.type}</span>
            <p className="doctor-info-about">{doctor.about}</p>
            <div className="doctor-info-diagnoses">
              {doctor.diagnoses && doctor.diagnoses.map((diag, idx) => (
                <span key={idx} className="diagnosis-badge">{diag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Section */}
        <div className="booking-section">
          <h2>Select Date & Time</h2>

          {bookingMessage.text && (
            <div className={`booking-message ${bookingMessage.type}`}>
              {bookingMessage.text}
            </div>
          )}

          <div className="date-selector">
            <label>Select Date:</label>
            <input
              type="date"
              value={selectedDate}
              min={minDate}
              onChange={handleDateChange}
              className="date-input"
            />
          </div>

          {selectedDate && (
            <>
              {availableSlots.length > 0 ? (
                <div className="slots-container">
                  <h3>Available Time Slots</h3>
                  <div className="slots-grid">
                    {availableSlots.map((slot, index) => {
                      const slot12h = convertTo12Hour(slot);
                      const isBooked = isSlotBooked(slot);
                      return (
                        <button
                          key={index}
                          className={`slot-button ${selectedSlot === slot ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                          onClick={() => !isBooked && handleSlotSelect(slot)}
                          disabled={isBooked}
                        >
                          {slot12h}
                          {isBooked && <span className="booked-label">Booked</span>}
                        </button>
                      );
                    })}
                  </div>

                  {selectedSlot && (
                    <div className="booking-confirm">
                      <p>
                        Confirm booking for {new Date(selectedDate).toLocaleDateString()} at {convertTo12Hour(selectedSlot)}
                      </p>
                      <button onClick={handleBooking} className="confirm-button">
                        Confirm Booking
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="no-slots">No available slots for this date. Please select another date.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}