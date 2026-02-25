import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TimeSlot from "./TimeSlot";
import BookedSlotsTable from "./BookedSlotsTable";
import ConfirmationModal from "./ConfirmationModal";
import CancelModal from "./CancelModal";

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
];

const doctors = [
  { id: 1, name: "Dr. Alice Smith" },
  { id: 2, name: "Dr. Bob Jones" },
  { id: 3, name: "Dr. Carol Tan" },
];

export default function BookingPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const doctor = doctors.find((d) => d.id === parseInt(doctorId));

  const [bookings, setBookings] = useState(() =>
    JSON.parse(localStorage.getItem("bookings")) || {}
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  // Today's date
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const minDate = `${yyyy}-${mm}-${dd}`;

  useEffect(() => {
    localStorage.setItem("bookings", JSON.stringify(bookings));
  }, [bookings]);


  const handleSelectSlot = (slot) => {
    if (!selectedDate) return alert("Please select a date first.");

    if (selectedDate === minDate) {
      const now = new Date();
      const [slotH, slotM] = convertSlotTo24Hour(slot).split(":").map(Number);
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

  const convertSlotTo24Hour = (slot) => {
    let [time, modifier] = slot.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return `${hours}:${minutes < 10 ? "0" + minutes : minutes}`;
  };

  const isSlotPast = (slot) => {
    const now = new Date();
    const [hours, minutes] = convertSlotTo24Hour(slot).split(":").map(Number);
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

      {selectedDate && (
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

// useEffect(() => {
//   setBookings({}); // clear all bookings when page loads
// }, []);