import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./ProfileDropdown.css";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
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
    // Clear user from localStorage
    localStorage.removeItem("user");
    setUser(null);
    setIsOpen(false);
    
    // Redirect to home page
    navigate("/");
  };

  // Get initials for avatar
  const getInitials = () => {
    if (!user) return "?";
    
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Generate avatar color based on username
  const getAvatarColor = () => {
    const colors = [
      "#667eea", "#764ba2", "#dc3545", "#28a745", 
      "#ffc107", "#17a2b8", "#6f42c1", "#fd7e14"
    ];
    
    if (!user || !user.username) return colors[0];
    
    // Simple hash function to pick a consistent color
    const hash = user.username.split("").reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hash % colors.length];
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

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <div 
        className="profile-trigger" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div 
          className="profile-avatar"
          style={{ backgroundColor: getAvatarColor() }}
        >
          {getInitials()}
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
            <div 
              className="dropdown-avatar"
              style={{ backgroundColor: getAvatarColor() }}
            >
              {getInitials()}
            </div>
            <div className="dropdown-user-info">
              <div className="dropdown-username">{user.username || "User"}</div>
              <div className="dropdown-email">{user.email}</div>
              <div className="dropdown-role">{user.type || "Free User"}</div>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <Link to="/profile" className="dropdown-item" onClick={() => setIsOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="currentColor"/>
              <path d="M8 9C3.58172 9 0 12.5817 0 17H16C16 12.5817 12.4183 9 8 9Z" fill="currentColor"/>
            </svg>
            My Profile
          </Link>

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