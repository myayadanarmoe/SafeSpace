import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/OfflineTherapy.css";

export default function OfflineTherapy() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [clinicians, setClinicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:5000/api/branches"),
      fetch("http://localhost:5000/api/clinicians")
    ])
      .then(async ([branchesRes, cliniciansRes]) => {
        const branchesData = await branchesRes.json();
        const cliniciansData = await cliniciansRes.json();

        console.log("Branches:", branchesData);
        console.log("Clinicians:", cliniciansData);

        setBranches(branchesData);
        setClinicians(cliniciansData);
      })
      .catch(err => console.error("Error fetching data:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleBranchClick = (branch) => {
    setSelectedBranch(branch);
    setShowMap(false);
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  const handleCloseModal = () => {
    setSelectedBranch(null);
    // Restore body scrolling
    document.body.style.overflow = 'unset';
  };

  const handleGetDirections = (lat, lng) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const handleCall = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleEmail = (email) => {
    window.location.href = `mailto:${email}`;
  };

  const getBranchImage = (city) => {
    const images = {
      'Yangon': 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      'Mandalay': 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
    };
    return images[city] || images['Yangon'];
  };

  // Get clinicians for a specific branch
  const getCliniciansForBranch = (branchId) => {
    return clinicians.filter(c => c.branch_id === branchId);
  };

  // Close modal when clicking on backdrop
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('branch-modal')) {
      handleCloseModal();
    }
  };

  if (loading) {
    return (
      <div className="offline-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading therapy centers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="offline-container">
      <div className="offline-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        <h1>Offline Therapy Centers</h1>
        <p className="text-center">Visit our branches for in-person counseling and therapy sessions</p>
      </div>

      <div className="branches-overview">
        <div className="city-filter">
          <h3>Our Locations</h3>
          <div className="city-badges">
            {branches.map(b => (
              <span key={b.branch_id} className="city-badge">
                {b.city} - {b.location}
              </span>
            ))}
          </div>
        </div>

        {branches.length === 0 ? (
          <div className="no-branches">
            <p>No branches found. Please check back later.</p>
          </div>
        ) : (
          <div className="branches-grid">
            {branches.map((branch) => {
              const branchClinicians = getCliniciansForBranch(branch.branch_id);
              return (
                <div
                  key={branch.branch_id}
                  className="branch-card"
                  onClick={() => handleBranchClick(branch)}
                >
                  <div className="branch-image">
                    <img src={getBranchImage(branch.city)} alt={branch.city} />
                    <span className="branch-city">{branch.city}</span>
                  </div>
                  <div className="branch-info">
                    <h3>SafeSpace {branch.city} - {branch.location}</h3>
                    <p className="branch-address">
                      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                      {branch.address}
                    </p>
                    <p className="branch-phone">
                      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.69 2.81a2 2 0 0 1-.45 2.11L8 9.28a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.33 1.85.563 2.81.69A2 2 0 0 1 22 16.92z" />
                      </svg>
                      {branch.phone}
                    </p>
                    <div className="branch-services-preview">
                      <span className="service-tag">{branchClinicians.length} therapists</span>
                      <span className="service-tag">{branch.location}</span>
                    </div>
                    <button className="view-details-btn">View Details</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Branch Details Modal */}
      {selectedBranch && (
        <div className="branch-modal modal" onClick={handleBackdropClick}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCloseModal}>×</button>

            <div className="modal-header">
              <img src={getBranchImage(selectedBranch.city)} alt={selectedBranch.city} className="modal-image" />
              <div className="modal-title">
                <h2 className="white-heading">SafeSpace {selectedBranch.city} - {selectedBranch.location}</h2>
                <span className="branch-city-badge">{selectedBranch.city}</span>
              </div>
            </div>

            <div className="modal-body">
              {/* Therapists at this branch */}
              <div className="therapists-section">
                <br />
                <h3>Therapists at this location</h3>
                <div className="therapists-list">
                  {getCliniciansForBranch(selectedBranch.branch_id).map(clinician => (
                    <div key={clinician.id} className="therapist-card">
                      <div className="therapist-avatar">
                        {clinician.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="therapist-details">
                        <div className="therapist-name">{clinician.name}</div>
                        <div className="therapist-type">{clinician.type}</div>
                      </div>
                    </div>
                  ))}
                  {getCliniciansForBranch(selectedBranch.branch_id).length === 0 && (
                    <p className="no-therapists">No therapists currently assigned to this branch</p>
                  )}
                </div>
              </div>

              <div className="contact-section">
                <br />
                <h3>Contact Information</h3>
                <div className="contact-details">
                  <p className="address">
                    <strong>Address:</strong> {selectedBranch.address}
                  </p>
                  <p className="phone" onClick={() => handleCall(selectedBranch.phone)}>
                    <strong>Phone:</strong> {selectedBranch.phone} <span className="clickable">(Click to call)</span>
                  </p>
                  <p className="mobile" onClick={() => handleCall(selectedBranch.mobile)}>
                    <strong>Mobile:</strong> {selectedBranch.mobile} <span className="clickable">(Click to call)</span>
                  </p>
                  <p className="email" onClick={() => handleEmail(selectedBranch.email)}>
                    <strong>Email:</strong> {selectedBranch.email} <span className="clickable">(Click to email)</span>
                  </p>
                </div>
              </div>

              <div className="hours-section">
                <h3>Hours of Operation</h3>
                <p>{selectedBranch.hours}</p>
              </div>

              <div className="transport-section">
                <h3>Getting Here</h3>
                <p><strong>Parking:</strong> {selectedBranch.parking}</p>
                <p><strong>Public Transport:</strong> {selectedBranch.public_transport}</p>
              </div>

              <div className="map-section">
                <h3>Location</h3>
                {showMap ? (
                  <div className="map-placeholder">
                    <iframe
                      title="branch-location"
                      width="100%"
                      height="250"
                      frameBorder="0"
                      style={{ border: 0, borderRadius: '8px' }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedBranch.longitude - 0.01}%2C${selectedBranch.latitude - 0.01}%2C${selectedBranch.longitude + 0.01}%2C${selectedBranch.latitude + 0.01}&layer=mapnik&marker=${selectedBranch.latitude}%2C${selectedBranch.longitude}`}
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <button className="show-map-btn" onClick={() => setShowMap(true)}>
                    Show Map
                  </button>
                )}
                <button className="directions-btn" onClick={() => handleGetDirections(selectedBranch.latitude, selectedBranch.longitude)}>
                  Get Directions
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button className="book-appointment-btn" onClick={() => navigate('/online-therapy')}>
                Browse All Therapists
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}