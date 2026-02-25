// src/components/BookedSlotsTable.jsx
import React from "react";

function BookedSlotsTable({ bookings }) {
  const hasBookings = Object.keys(bookings).length > 0;

  return (
    <div style={{ marginTop: "30px" }}>
      <h2>Booked Slots</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {hasBookings ? (
            Object.entries(bookings).map(([date, slots]) =>
              slots.map((slot) => (
                <tr key={`${date}-${slot}`}>
                  <td>{date}</td>
                  <td>{slot}</td>
                  <td>Booked</td>
                </tr>
              ))
            )
          ) : (
            <tr>
              <td colSpan="3">No bookings yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default BookedSlotsTable;