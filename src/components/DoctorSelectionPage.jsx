import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DoctorSelectionPage.css";

// Default avatar if no profile picture
const defaultAvatar = "https://via.placeholder.com/150x150?text=Doctor";

export default function DoctorSelectionPage() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [selectedDiagnosis, setSelectedDiagnosis] = useState("All");
  const [diagnoses, setDiagnoses] = useState([]);

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
    fetchDiagnoses();
  }, []);

  // Filter doctors when search, specialty, or diagnosis changes
  useEffect(() => {
    filterDoctors();
  }, [searchTerm, selectedSpecialty, selectedDiagnosis, doctors]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/clinicians");
      const data = await res.json();
      setDoctors(data);
      setFilteredDoctors(data);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiagnoses = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/diagnoses");
      const data = await res.json();
      setDiagnoses(data);
    } catch (err) {
      console.error("Error fetching diagnoses:", err);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doctor => 
        doctor.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doctor.about && doctor.about.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doctor.diagnoses && doctor.diagnoses.some(d => d.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    // Filter by specialty
    if (selectedSpecialty !== "All") {
      filtered = filtered.filter(doctor => doctor.type === selectedSpecialty);
    }

    // Filter by diagnosis
    if (selectedDiagnosis !== "All") {
      filtered = filtered.filter(doctor => 
        doctor.diagnoses && doctor.diagnoses.includes(selectedDiagnosis)
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleBookClick = (doctorId) => {
    navigate(`/booking/${doctorId}`);
  };

  const specialties = ["All", "Psychiatrist", "Psychologist", "Therapist"];

  return (
    <div className="doctor-selection-container">
      <div className="doctor-header">
        <h1>Find Your Therapist</h1>
        <p>Browse our experienced mental health professionals</p>
      </div>

      {/* Search and Filter Section */}
      <div className="filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, specialty, or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-0.59 4.23-1.57L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z" fill="currentColor"/>
          </svg>
        </div>

        <div className="filter-dropdowns">
          <select 
            value={selectedSpecialty} 
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="filter-select"
          >
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>

          <select 
            value={selectedDiagnosis} 
            onChange={(e) => setSelectedDiagnosis(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Specializations</option>
            {diagnoses.map(diagnosis => (
              <option key={diagnosis.diagnosisID} value={diagnosis.diagnosisName}>
                {diagnosis.diagnosisName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="results-count">
        {filteredDoctors.length} {filteredDoctors.length === 1 ? 'therapist' : 'therapists'} found
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading therapists...</p>
        </div>
      ) : (
        <div className="doctors-grid">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map(doctor => (
              <div key={doctor.id} className="doctor-card">
                <div className="doctor-image-container">
                  <img 
                    src={doctor.profile_pic || defaultAvatar} 
                    alt={doctor.username}
                    className="doctor-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultAvatar;
                    }}
                  />
                  <span className="doctor-specialty">{doctor.type}</span>
                </div>
                
                <div className="doctor-info">
                  <h3 className="doctor-name">{doctor.username}</h3>
                  
                  <div className="doctor-diagnoses">
                    {doctor.diagnoses && doctor.diagnoses.length > 0 ? (
                      doctor.diagnoses.map((diag, index) => (
                        <span key={index} className="diagnosis-badge">{diag}</span>
                      ))
                    ) : (
                      <span className="no-diagnosis">General Practice</span>
                    )}
                  </div>
                  
                  <p className="doctor-about">
                    {doctor.about || "Experienced mental health professional dedicated to providing compassionate care."}
                  </p>
                  
                  <button 
                    className="book-button"
                    onClick={() => navigate(`/booking/${doctor.id}`)}
                    >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No therapists found matching your criteria.</p>
              <button 
                className="clear-filters"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedSpecialty("All");
                  setSelectedDiagnosis("All");
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}