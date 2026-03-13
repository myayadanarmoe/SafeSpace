import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/ProfileDropdown.css";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Function to load user from localStorage
  const loadUser = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    // Load user on mount
    loadUser();

    // Listen for storage events
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        loadUser();
      }
    };

    // Listen for custom login event
    const handleLogin = () => {
      loadUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('login', handleLogin);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('login', handleLogin);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setIsOpen(false);
    window.dispatchEvent(new Event('logout'));
    navigate("/");
  };

  // Check if user is a mental health professional
  const isMentalHealthProfessional = () => {
    if (!user) return false;
    const professionalTypes = ['Psychiatrist', 'Psychologist', 'Therapist'];
    return professionalTypes.includes(user.type);
  };

  // Check if user is staff
  const isStaff = () => {
    return user?.type === 'Staff';
  };

  // Get initials for avatar
  const getInitials = () => {
    if (!user) return "?";
    if (user.username) return user.username.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  // Generate avatar color based on username
  const getAvatarColor = () => {
    const colors = [
      "#667eea", "#764ba2", "#dc3545", "#28a745", 
      "#ffc107", "#17a2b8", "#6f42c1", "#fd7e14"
    ];
    
    if (!user || !user.username) return colors[0];
    
    const hash = user.username.split("").reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hash % colors.length];
  };

  // Get profile picture URL
  const getProfilePicUrl = () => {
    if (user?.profile_pic) {
      if (user.profile_pic.startsWith('data:') || user.profile_pic.startsWith('http')) {
        return user.profile_pic;
      }
      return `http://localhost:5000${user.profile_pic}`;
    }
    return null;
  };

  if (!user) {
    return (
      <div className="profile-dropdown">
        <Link to="/login" className="login-link">
          Login
        </Link>
        <Link to="/sign-up" className="signup-link">
          Sign Up
        </Link>
      </div>
    );
  }

  const profilePicUrl = getProfilePicUrl();
  const isProfessional = isMentalHealthProfessional();
  const isStaffUser = isStaff();

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <div 
        className="profile-trigger" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="profile-avatar-wrapper">
          {profilePicUrl ? (
            <img 
              src={profilePicUrl} 
              alt={user.username || "Profile"} 
              className="profile-avatar-img"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.querySelector('.profile-avatar-fallback').style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="profile-avatar-fallback"
            style={{ 
              backgroundColor: getAvatarColor(),
              display: profilePicUrl ? 'none' : 'flex'
            }}
          >
            {getInitials()}
          </div>
        </div>
        <span className="profile-name">{user.username || user.email}</span>
        <svg 
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none"
        >
          <path 
            d="M2 4L6 8L10 4" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <div className="dropdown-avatar-wrapper">
              {profilePicUrl ? (
                <img 
                  src={profilePicUrl} 
                  alt={user.username || "Profile"} 
                  className="dropdown-avatar-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.querySelector('.dropdown-avatar-fallback').style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="dropdown-avatar-fallback"
                style={{ 
                  backgroundColor: getAvatarColor(),
                  display: profilePicUrl ? 'none' : 'flex'
                }}
              >
                {getInitials()}
              </div>
            </div>
            <div className="dropdown-user-info">
              <div className="dropdown-username">{user.username || "User"}</div>
              <div className="dropdown-email">{user.email}</div>
              <div className="dropdown-role">{user.type || "Standard User"}</div>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          {/* My Profile - Everyone */}
          <Link to="/profile" className="dropdown-item" onClick={() => setIsOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="currentColor"/>
              <path d="M8 9C3.58172 9 0 12.5817 0 17H16C16 12.5817 12.4183 9 8 9Z" fill="currentColor"/>
            </svg>
            My Profile
          </Link>

          {/* STAFF MENU ITEMS */}
          {isStaffUser && (
            <>

              <Link to="/staff/book-appointment" className="dropdown-item" onClick={() => setIsOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 4V8L10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Book Appointment
              </Link>

              <Link to="/staff/patients" className="dropdown-item" onClick={() => setIsOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="currentColor"/>
                  <path d="M12 9C13.6569 9 15 10.3431 15 12V13H13V12C13 11.4477 12.5523 11 12 11V9Z" fill="currentColor"/>
                  <path d="M4 9C2.34315 9 1 10.3431 1 12V13H3V12C3 11.4477 3.44772 11 4 11V9Z" fill="currentColor"/>
                  <path d="M8 9C9.65685 9 11 10.3431 11 12V13H5V12C5 10.3431 6.34315 9 8 9Z" fill="currentColor"/>
                </svg>
                Manage Patients
              </Link>

              <Link to="/staff/schedule" className="dropdown-item" onClick={() => setIsOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="4" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M5 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M11 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="5" cy="9" r="1" fill="currentColor"/>
                  <circle cx="8" cy="9" r="1" fill="currentColor"/>
                  <circle cx="11" cy="9" r="1" fill="currentColor"/>
                </svg>
                View Schedule
              </Link>

              <div className="dropdown-divider"></div>
            </>
          )}

          {/* My Appointments - Show for regular users (not clinicians, not admin, not staff) */}
          {!isProfessional && !isStaffUser && user.type !== 'Admin' && (
            <Link to="/my-appointments" className="dropdown-item" onClick={() => setIsOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" fill="currentColor"/>
                <path d="M9 4H7v5h5V7H9V4z" fill="currentColor"/>
              </svg>
              My Appointments
            </Link>
          )}

          {/* Mental Health Professional Menu Items */}
          {isProfessional && (
            <>
              <Link to="/availability" className="dropdown-item" onClick={() => setIsOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="4" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M5 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M11 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="5" cy="9" r="1" fill="currentColor"/>
                  <circle cx="8" cy="9" r="1" fill="currentColor"/>
                  <circle cx="11" cy="9" r="1" fill="currentColor"/>
                </svg>
                Availability
              </Link>

              <Link to="/my-patients" className="dropdown-item" onClick={() => setIsOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="currentColor"/>
                  <path d="M12 9C13.6569 9 15 10.3431 15 12V13H13V12C13 11.4477 12.5523 11 12 11V9Z" fill="currentColor"/>
                  <path d="M4 9C2.34315 9 1 10.3431 1 12V13H3V12C3 11.4477 3.44772 11 4 11V9Z" fill="currentColor"/>
                  <path d="M8 9C9.65685 9 11 10.3431 11 12V13H5V12C5 10.3431 6.34315 9 8 9Z" fill="currentColor"/>
                </svg>
                My Patients
              </Link>

              <div className="dropdown-divider"></div>
            </>
          )}

          {/* Admin Panel - Only for Admin */}
          {user.type === 'Admin' && (
            <Link to="/admin" className="dropdown-item" onClick={() => setIsOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 0L0 3V8C0 12.5 3.5 16 8 16C12.5 16 16 12.5 16 8V3L8 0Z" fill="currentColor"/>
                <circle cx="8" cy="8" r="3" fill="white"/>
              </svg>
              Admin Panel
            </Link>
          )}

          <Link to="/settings" className="dropdown-item" onClick={() => setIsOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M13 8L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M0 8L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 13L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 0L8 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M11.5 4.5L13.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M2.5 13.5L4.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M4.5 4.5L2.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M13.5 13.5L11.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Settings
          </Link>

          <div className="dropdown-divider"></div>

          <button className="dropdown-item logout" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L14 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 8H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M2 2V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}