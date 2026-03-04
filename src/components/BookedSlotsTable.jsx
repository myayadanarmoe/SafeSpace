// src/components/BookedSlotsTable.jsx
import React from "react";

const doctors = [
  { id: 1, name: "Dr. Alice Smith" },
  { id: 2, name: "Dr. Bob Jones" },
  { id: 3, name: "Dr. Carol Tan" },
];

function BookedSlotsTable({ bookings, doctorId }) {
  const hasBookings = Object.keys(bookings).length > 0;
  const doctor = doctors.find(d => d.id === doctorId);

  return (
    <div style={{ marginTop: "30px" }}>
      <h2>{doctor ? `Booked Slots with ${doctor.name}` : 'Booked Slots'}</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Date</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Time</th>
            <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {hasBookings ? (
            Object.entries(bookings)
              .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
              .map(([date, slots]) =>
                slots
                  .sort((a, b) => {
                    const timeA = new Date(`2000-01-01 ${a}`);
                    const timeB = new Date(`2000-01-01 ${b}`);
                    return timeA - timeB;
                  })
                  .map((slot) => (
                    <tr key={`${date}-${slot}`}>
                      <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                        {new Date(date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td style={{ border: "1px solid #ccc", padding: "8px" }}>{slot}</td>
                      <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                        <span style={{ 
                          backgroundColor: "#28a745", 
                          color: "white", 
                          padding: "3px 8px", 
                          borderRadius: "3px",
                          fontSize: "0.85rem"
                        }}>
                          Confirmed
                        </span>
                      </td>
                    </tr>
                  ))
              )
          ) : (
            <tr>
              <td colSpan="3" style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                No bookings yet. Select a time slot above to book an appointment.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default BookedSlotsTable;