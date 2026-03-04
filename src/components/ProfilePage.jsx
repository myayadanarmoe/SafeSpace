import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../ProfilePage.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState("");

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setUsername(userData.username || "");
      setEmail(userData.email || "");
      setProfilePicPreview(userData.profile_pic || "");
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showMessage("File size must be less than 2MB", "error");
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        showMessage("Please select an image file", "error");
        return;
      }

      setProfilePic(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    // Validate passwords if changing
    if (newPassword) {
      if (newPassword.length < 6) {
        showMessage("Password must be at least 6 characters", "error");
        return;
      }
      if (newPassword !== confirmPassword) {
        showMessage("New passwords do not match", "error");
        return;
      }
    }

    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('username', username);
    formData.append('email', email);
    
    if (currentPassword) {
      formData.append('currentPassword', currentPassword);
    }
    
    if (newPassword) {
      formData.append('newPassword', newPassword);
    }
    
    if (profilePic) {
      formData.append('profilePic', profilePic);
    }

    try {
      const res = await fetch("http://localhost:5000/api/user/update", {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        // Update user in localStorage
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        // Clear password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setProfilePic(null);
        
        showMessage("Profile updated successfully", "success");
      } else {
        showMessage(data.message, "error");
      }
    } catch (err) {
      console.error("Update error:", err);
      showMessage("Network error", "error");
    }
  };

  const getInitials = () => {
    if (!user) return "U";
    if (user.username) return user.username.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-pic-section">
            <div className="profile-pic-container">
              {profilePicPreview ? (
                <img 
                  src={profilePicPreview.startsWith('data:') ? profilePicPreview : `http://localhost:5000${profilePicPreview}`} 
                  alt="Profile" 
                  className="profile-pic"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentNode.querySelector('.fallback-avatar').style.display = 'flex';
                  }}
                />
              ) : (
                <div className="profile-pic-placeholder">
                  {getInitials()}
                </div>
              )}
              <div className="fallback-avatar" style={{ display: 'none' }}>
                {getInitials()}
              </div>
            </div>
            
            <label htmlFor="profile-pic-input" className="change-pic-btn">
              Change Photo
            </label>
            <input
              type="file"
              id="profile-pic-input"
              accept="image/*"
              onChange={handleProfilePicChange}
              style={{ display: 'none' }}
            />
            <p className="pic-hint">Max size: 2MB</p>
          </div>

          <div className="user-info-card">
            <h3>Account Info</h3>
            <p><strong>Member since:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
            <p><strong>User type:</strong> <span className={`role-badge ${user?.type?.toLowerCase().replace(' ', '-')}`}>{user?.type || 'Free User'}</span></p>
          </div>
        </div>

        <div className="profile-form-section">
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <h2>Edit Profile</h2>

            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-divider">
              <h3>Change Password</h3>
              <p className="form-hint">Leave blank if you don't want to change your password</p>
            </div>

            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save">
                Save Changes
              </button>
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => {
                  setUsername(user.username || "");
                  setEmail(user.email || "");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setProfilePic(null);
                  setProfilePicPreview(user.profile_pic || "");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}