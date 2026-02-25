import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const doctors = [
  { id: 1, name: "Dr. Alice Smith" },
  { id: 2, name: "Dr. Bob Jones" },
  { id: 3, name: "Dr. Carol Tan" },
];

export default function DoctorSelectionPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState({});

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("bookings")) || {};
    setBookings(stored);
  }, []);


  const handleSelectDoctor = (doctor) => {
    navigate(`/booking/${doctor.id}`);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "50px auto" }}>
      <h1>Select a Doctor</h1>

      {/* --- All Bookings Table --- */}
      <h2>All Booked Slots</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "5px" }}>Doctor</th>
            <th style={{ border: "1px solid #ccc", padding: "5px" }}>Date</th>
            <th style={{ border: "1px solid #ccc", padding: "5px" }}>Time</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(bookings).length === 0 ? (
            <tr>
              <td colSpan="3" style={{ textAlign: "center", padding: "10px" }}>
                No bookings yet
              </td>
            </tr>
          ) : (
            Object.keys(bookings).map((docId) => {
              const doctor = doctors.find((d) => d.id === parseInt(docId));
              const doctorBookings = bookings[docId]; // { date1: [...], date2: [...] }

              return Object.keys(doctorBookings).flatMap((date) =>
                doctorBookings[date].map((slot, index) => (
                  <tr key={`${docId}-${date}-${slot}-${index}`}>
                    <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                      {doctor ? doctor.name : "Unknown"}
                    </td>
                    <td style={{ border: "1px solid #ccc", padding: "5px" }}>{date}</td>
                    <td style={{ border: "1px solid #ccc", padding: "5px" }}>{slot}</td>
                  </tr>
                ))
              );
            })
          )}
        </tbody>
      </table>

      {/* --- Doctor Selection Buttons --- */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {doctors.map((doc) => (
          <button
            key={doc.id}
            onClick={() => handleSelectDoctor(doc)}
            style={{
              padding: "10px 15px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              backgroundColor: "#f0f0f0",
              cursor: "pointer",
            }}
          >
            {doc.name}
          </button>
        ))}
      </div>
    </div>
  );
}