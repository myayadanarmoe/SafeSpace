import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/OfflineTherapy.css"

// Branch data
const branches = [
  {
    id: 1,
    city: "Yangon",
    name: "SafeSpace Yangon - Downtown",
    address: "No. 123, Sule Pagoda Road, Kyauktada Township",
    phone: "01-234-5678",
    mobile: "09-123-456-789",
    email: "yangon.downtown@safespace.com",
    hours: "Mon-Fri: 9:00 AM - 8:00 PM, Sat-Sun: 10:00 AM - 6:00 PM",
    services: ["Individual Therapy", "Couples Counseling", "Child Psychology", "Psychiatric Consultation"],
    therapists: 12,
    parking: "Paid parking available",
    publicTransport: "Near Sule Pagoda Bus Stop, 5 min walk from Yangon Central Railway Station",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    coordinates: { lat: 16.7745, lng: 96.1587 }
  },
  {
    id: 2,
    city: "Yangon",
    name: "SafeSpace Yangon - Hlaing",
    address: "No. 45, Inya Road, Hlaing Township",
    phone: "01-876-5432",
    mobile: "09-987-654-321",
    email: "yangon.hlaing@safespace.com",
    hours: "Mon-Fri: 8:00 AM - 9:00 PM, Sat: 9:00 AM - 5:00 PM, Sun: Closed",
    services: ["Trauma Therapy", "Addiction Counseling", "Family Therapy", "Art Therapy"],
    therapists: 8,
    parking: "Free parking available",
    publicTransport: "Near Hlaing Bus Stop, accessible by multiple bus lines",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    coordinates: { lat: 16.8231, lng: 96.1342 }
  },
  {
    id: 3,
    city: "Mandalay",
    name: "SafeSpace Mandalay",
    address: "No. 78, 35th Street, Chanayethazan Township",
    phone: "02-345-6789",
    mobile: "09-555-123-456",
    email: "mandalay@safespace.com",
    hours: "Mon-Fri: 9:00 AM - 7:00 PM, Sat: 9:00 AM - 3:00 PM, Sun: Closed",
    services: ["Cognitive Behavioral Therapy", "Stress Management", "Grief Counseling", "Mindfulness Training"],
    therapists: 6,
    parking: "Street parking available",
    publicTransport: "Near Mandalay Bus Terminal, 10 min walk from Mandalay Railway Station",
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    coordinates: { lat: 21.9756, lng: 96.0839 }
  }
];

export default function OfflineTherapy() {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const handleBranchClick = (branch) => {
    setSelectedBranch(branch);
    setShowMap(false);
  };

  const handleCloseModal = () => {
    setSelectedBranch(null);
  };

  const handleGetDirections = () => {
    // Open Google Maps with the coordinates
    if (selectedBranch) {
      window.open(`https://www.google.com/maps?q=${selectedBranch.coordinates.lat},${selectedBranch.coordinates.lng}`, '_blank');
    }
  };

  const handleCall = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleEmail = (email) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className="offline-container">
      <div className="offline-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        <h1>Offline Therapy Centers</h1>
        <p>Visit our branches for in-person counseling and therapy sessions</p>
      </div>

      {/* Branch Overview */}
      <div className="branches-overview">
        <div className="city-filter">
          <h3>Our Locations</h3>
          <div className="city-badges">
            <span className="city-badge">Yangon (2 branches)</span>
            <span className="city-badge">Mandalay (1 branch)</span>
          </div>
        </div>

        <div className="branches-grid">
          {branches.map((branch) => (
            <div 
              key={branch.id} 
              className="branch-card"
              onClick={() => handleBranchClick(branch)}
            >
              <div className="branch-image">
                <img src={branch.image} alt={branch.name} />
                <span className="branch-city">{branch.city}</span>
              </div>
              <div className="branch-info">
                <h3>{branch.name}</h3>
                <p className="branch-address">
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                  {branch.address}
                </p>
                <p className="branch-phone">
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.69 2.81a2 2 0 0 1-.45 2.11L8 9.28a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.33 1.85.563 2.81.69A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  {branch.phone} | {branch.mobile}
                </p>
                <div className="branch-services-preview">
                  {branch.services.slice(0, 2).map((service, index) => (
                    <span key={index} className="service-tag">{service}</span>
                  ))}
                  <span className="service-tag more">+{branch.services.length - 2} more</span>
                </div>
                <button className="view-details-btn">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Branch Details Modal */}
      {selectedBranch && (
        <div className="branch-modal" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCloseModal}>×</button>
            
            <div className="modal-header">
              <img src={selectedBranch.image} alt={selectedBranch.name} className="modal-image" />
              <div className="modal-title">
                <h2>{selectedBranch.name}</h2>
                <span className="branch-city-badge">{selectedBranch.city}</span>
              </div>
            </div>

            <div className="modal-body">
              <div className="contact-section">
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

              <div className="services-section">
                <h3>Services Offered</h3>
                <div className="services-list">
                  {selectedBranch.services.map((service, index) => (
                    <span key={index} className="service-item">{service}</span>
                  ))}
                </div>
              </div>

              <div className="therapists-section">
                <h3>Therapists</h3>
                <p>{selectedBranch.therapists} licensed therapists available</p>
              </div>

              <div className="transport-section">
                <h3>Getting Here</h3>
                <p><strong>Parking:</strong> {selectedBranch.parking}</p>
                <p><strong>Public Transport:</strong> {selectedBranch.publicTransport}</p>
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
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedBranch.coordinates.lng-0.01}%2C${selectedBranch.coordinates.lat-0.01}%2C${selectedBranch.coordinates.lng+0.01}%2C${selectedBranch.coordinates.lat+0.01}&layer=mapnik&marker=${selectedBranch.coordinates.lat}%2C${selectedBranch.coordinates.lng}`}
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <button className="show-map-btn" onClick={() => setShowMap(true)}>
                    Show Map
                  </button>
                )}
                <button className="directions-btn" onClick={handleGetDirections}>
                  Get Directions
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button className="book-appointment-btn" onClick={() => navigate('/online-therapy')}>
                Find a Therapist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}