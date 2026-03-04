import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TimeSlot from "./TimeSlot";
import BookedSlotsTable from "./BookedSlotsTable";
import ConfirmationModal from "./ConfirmationModal";
import CancelModal from "./CancelModal";

// Helper function to convert 24h time to 12h format
const convertTo12Hour = (time24) => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Helper function to convert 12h time to 24h format
const convertTo24Hour = (time12) => {
  const [time, modifier] = time12.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Generate time slots from availability data
const generateTimeSlots = (availabilitySlots, selectedDate) => {
  if (!availabilitySlots || availabilitySlots.length === 0) return [];
  
  const slots = [];
  const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
  
  // Find availability for this day
  const dayAvailability = availabilitySlots.filter(slot => slot.day_of_the_week === dayOfWeek);
  
  dayAvailability.forEach(availability => {
    const startHour = parseInt(availability.startTime.split(':')[0]);
    const endHour = parseInt(availability.endTime.split(':')[0]);
    const startMinute = parseInt(availability.startTime.split(':')[1]);
    const endMinute = parseInt(availability.endTime.split(':')[1]);
    
    // Generate 30-minute slots
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute of [0, 30]) {
        if (hour === endHour && minute >= endMinute) continue;
        if (hour === startHour && minute < startMinute) continue;
        
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(convertTo12Hour(time24));
      }
    }
  });
  
  return slots;
};

const doctors = [
  { id: 1, name: "Dr. Alice Smith", clinicianId: 1 },
  { id: 2, name: "Dr. Bob Jones", clinicianId: 2 },
  { id: 3, name: "Dr. Carol Tan", clinicianId: 3 },
];

export default function BookingPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const doctor = doctors.find((d) => d.id === parseInt(doctorId));

  const [bookings, setBookings] = useState(() =>
    JSON.parse(localStorage.getItem("bookings")) || {}
  );
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);

  // Today's date
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const minDate = `${yyyy}-${mm}-${dd}`;

  // Fetch availability when doctor loads
  useEffect(() => {
    if (doctor) {
      fetchAvailability();
    }
  }, [doctor]);

  // Generate time slots when date or availability changes
  useEffect(() => {
    if (selectedDate && availability.length > 0) {
      const slots = generateTimeSlots(availability, selectedDate);
      setTimeSlots(slots);
    } else {
      setTimeSlots([]);
    }
  }, [selectedDate, availability]);

  useEffect(() => {
    localStorage.setItem("bookings", JSON.stringify(bookings));
  }, [bookings]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/availability/${doctor.clinicianId}`);
      const data = await res.json();
      setAvailability(data.availability || []);
    } catch (err) {
      console.error("Error fetching availability:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slot) => {
    if (!selectedDate) return alert("Please select a date first.");

    if (selectedDate === minDate) {
      const now = new Date();
      const [slotH, slotM] = convertTo24Hour(slot).split(":").map(Number);
      if (slotH < now.getHours() || (slotH === now.getHours() && slotM <= now.getMinutes())) {
        return alert("You cannot select a past time slot for today!");
      }
    }

    setSelectedSlot(slot);
    setShowConfirm(true);
  };

  const handleConfirmBooking = () => {
    const updatedBookings = { ...bookings };
    if (!updatedBookings[doctor.id]) updatedBookings[doctor.id] = {};
    if (!updatedBookings[doctor.id][selectedDate]) updatedBookings[doctor.id][selectedDate] = [];
    updatedBookings[doctor.id][selectedDate].push(selectedSlot);
    setBookings(updatedBookings);
    setShowConfirm(false);
    setSelectedSlot(null);
  };

  const handleCancelBooking = (slot) => {
    setSelectedSlot(slot);
    setShowCancel(true);
  };

  const confirmCancel = () => {
    const updatedBookings = { ...bookings };
    updatedBookings[doctor.id][selectedDate] = updatedBookings[doctor.id][selectedDate].filter(
      (s) => s !== selectedSlot
    );
    setBookings(updatedBookings);
    setShowCancel(false);
    setSelectedSlot(null);
  };

  const isSlotPast = (slot) => {
    const now = new Date();
    const [hours, minutes] = convertTo24Hour(slot).split(":").map(Number);
    return hours < now.getHours() || (hours === now.getHours() && minutes <= now.getMinutes());
  };

  if (!doctor) return <p>Doctor not found!</p>;

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto" }}>
      <h1>Booking for {doctor.name}</h1>
      <button
        onClick={() => navigate("/online-therapy")}
        style={{ marginBottom: "20px" }}
      >
        ← Back to Doctor Selection
      </button>

      <div style={{ marginBottom: "20px" }}>
        <label>Select a Date:</label>
        <input
          type="date"
          value={selectedDate}
          min={minDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {loading && <p>Loading availability...</p>}

      {selectedDate && !loading && (
        <>
          {timeSlots.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", marginTop: "20px" }}>
              {timeSlots.map((slot) => {
                const isBooked = bookings[doctor.id]?.[selectedDate]?.includes(slot);
                return (
                  <TimeSlot
                    key={slot}
                    slot={slot}
                    isBooked={isBooked}
                    isPast={selectedDate === minDate && isSlotPast(slot)}
                    onSelect={handleSelectSlot}
                    onCancel={handleCancelBooking}
                  />
                );
              })}
            </div>
          ) : (
            <p>No availability for this day. Please select another date.</p>
          )}
        </>
      )}

      <BookedSlotsTable bookings={bookings[doctor.id] || {}} />

      {showConfirm && (
        <ConfirmationModal
          slot={selectedSlot}
          date={selectedDate}
          onConfirm={handleConfirmBooking}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {showCancel && (
        <CancelModal
          slot={selectedSlot}
          date={selectedDate}
          onConfirm={confirmCancel}
          onCancel={() => setShowCancel(false)}
        />
      )}
    </div>
  );
}