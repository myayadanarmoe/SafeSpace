import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function DoctorSelectionPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState({});
  const [fetchingDoctors, setFetchingDoctors] = useState(true);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("bookings")) || {};
    setBookings(stored);
    
    // Fetch clinicians from database
    fetchClinicians();
  }, []);

  const fetchClinicians = async () => {
    setFetchingDoctors(true);
    try {
      // Get all users who are Psychiatrists, Psychologists, or Therapists
      const res = await fetch("http://localhost:5000/api/clinicians");
      const data = await res.json();
      console.log("Fetched clinicians:", data);
      setDoctors(data.clinicians || []);
      
      // Fetch availability for each clinician
      data.clinicians.forEach(doctor => {
        fetchDoctorAvailability(doctor);
      });
    } catch (err) {
      console.error("Error fetching clinicians:", err);
    } finally {
      setFetchingDoctors(false);
    }
  };

  const fetchDoctorAvailability = async (doctor) => {
    setLoading(prev => ({ ...prev, [doctor.id]: true }));
    try {
      console.log(`Fetching availability for ${doctor.name} (ID: ${doctor.id})`);
      const res = await fetch(`http://localhost:5000/api/availability/${doctor.id}`);
      const data = await res.json();
      console.log(`Response for ${doctor.name}:`, data);
      setAvailability(prev => ({ 
        ...prev, 
        [doctor.id]: data.availability || [] 
      }));
    } catch (err) {
      console.error(`Error fetching availability for ${doctor.name}:`, err);
    } finally {
      setLoading(prev => ({ ...prev, [doctor.id]: false }));
    }
  };

  const handleSelectDoctor = (doctor) => {
    navigate(`/booking/${doctor.id}`);
  };

  // Check if doctor has any availability
  const hasAvailability = (doctorId) => {
    const doctorAvailability = availability[doctorId];
    return doctorAvailability && doctorAvailability.length > 0;
  };

  // Get availability summary for a doctor
  const getAvailabilitySummary = (doctorId) => {
    const doctorAvailability = availability[doctorId];
    if (!doctorAvailability || doctorAvailability.length === 0) return null;
    
    const days = [...new Set(doctorAvailability.map(slot => slot.day_of_the_week))];
    return days.join(', ');
  };

  // Get doctor name from user object
  const getDoctorName = (doctor) => {
    // You can customize this based on how you want to display names
    return doctor.username || doctor.email.split('@')[0] || `Clinician ${doctor.id}`;
  };

  if (fetchingDoctors) {
    return (
      <div style={{ maxWidth: "800px", margin: "50px auto", textAlign: "center" }}>
        <h1>Loading clinicians...</h1>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "50px auto" }}>
      <h1>Select a Clinician</h1>

      {/* --- All Bookings Table --- */}
      <h2>All Booked Slots</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "5px" }}>Clinician</th>
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
              const doctorBookings = bookings[docId];

              return Object.keys(doctorBookings).flatMap((date) =>
                doctorBookings[date].map((slot, index) => (
                  <tr key={`${docId}-${date}-${slot}-${index}`}>
                    <td style={{ border: "1px solid #ccc", padding: "5px" }}>
                      {doctor ? getDoctorName(doctor) : "Unknown"}
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

      {/* --- Doctor Selection Buttons with Availability Info --- */}
      <h2>Available Clinicians</h2>
      {doctors.length === 0 ? (
        <p>No clinicians available at the moment.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {doctors.map((doc) => (
            <div
              key={doc.id}
              style={{
                padding: "15px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                backgroundColor: "#f0f0f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong style={{ fontSize: "1.1rem" }}>{getDoctorName(doc)}</strong>
                <p style={{ margin: "5px 0 0", color: "#666", fontSize: "0.9rem" }}>
                  {doc.type}
                </p>
                {loading[doc.id] ? (
                  <p style={{ margin: "5px 0 0", color: "#666", fontSize: "0.9rem" }}>
                    Loading availability...
                  </p>
                ) : hasAvailability(doc.id) ? (
                  <p style={{ margin: "5px 0 0", color: "#28a745", fontSize: "0.9rem" }}>
                    Available on: {getAvailabilitySummary(doc.id)}
                  </p>
                ) : (
                  <p style={{ margin: "5px 0 0", color: "#dc3545", fontSize: "0.9rem" }}>
                    No availability set yet
                  </p>
                )}
              </div>
              <button
                onClick={() => handleSelectDoctor(doc)}
                style={{
                  padding: "8px 15px",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: hasAvailability(doc.id) ? "#007bff" : "#6c757d",
                  color: "white",
                  cursor: hasAvailability(doc.id) ? "pointer" : "not-allowed",
                  opacity: hasAvailability(doc.id) ? 1 : 0.6,
                }}
                disabled={!hasAvailability(doc.id)}
              >
                {hasAvailability(doc.id) ? "Book Now" : "Unavailable"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}