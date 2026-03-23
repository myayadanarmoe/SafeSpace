import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProfilePage.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // User form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  // Clinician specific fields (for Psychiatrist, Psychologist, Therapist)
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [about, setAbout] = useState("");
  const [primaryBranchId, setPrimaryBranchId] = useState("");
  
  // Patient specific fields (for Standard, Premium, Youth users)
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [phNo, setPhNo] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  
  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Profile picture
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState("");
  
  // Branches for clinicians
  const [branches, setBranches] = useState([]);

  const isClinician = () => {
    return ['Psychiatrist', 'Psychologist', 'Therapist'].includes(user?.type);
  };

  const isPatient = () => {
    return ['Standard User', 'Premium User', 'Youth User'].includes(user?.type);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate('/login');
      return;
    }
    
    const userData = JSON.parse(storedUser);
    setUser(userData);
    setName(userData.name || "");
    setEmail(userData.email || "");
    setProfilePicPreview(userData.profile_pic || "");
    
    fetchUserDetails(userData.id);
    fetchBranches();
  }, [navigate]);

  const fetchUserDetails = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/details`);
      const data = await res.json();
      
      // Set clinician fields
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setAbout(data.about || "");
      setPrimaryBranchId(data.primary_branch_id || "");
      
      // Set patient fields
      setDateOfBirth(data.date_of_birth ? data.date_of_birth.split('T')[0] : "");
      setGender(data.gender || "");
      setPatientAddress(data.patient_address || "");
      setPhNo(data.phNo || "");
      setEmergencyContact(data.emergencyContact || "");
      
    } catch (err) {
      console.error("Error fetching user details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/branches");
      const data = await res.json();
      setBranches(data);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showMessage("File size must be less than 2MB", "error");
        return;
      }
      if (!file.type.startsWith('image/')) {
        showMessage("Please select an image file", "error");
        return;
      }
      setProfilePic(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

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
    formData.append('name', name);
    formData.append('email', email);
    
    // Add clinician fields
    if (isClinician()) {
      formData.append('phone', phone);
      formData.append('address', address);
      formData.append('about', about);
      formData.append('primaryBranchId', primaryBranchId);
    }
    
    // Add patient fields
    if (isPatient()) {
      formData.append('dateOfBirth', dateOfBirth);
      formData.append('gender', gender);
      formData.append('patientAddress', patientAddress);
      formData.append('phNo', phNo);
      formData.append('emergencyContact', emergencyContact);
    }
    
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
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
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
    if (user.name) return user.name.charAt(0).toUpperCase();
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
            <p><strong>User type:</strong> <span className={`role-badge ${user?.type?.toLowerCase().replace(' ', '-')}`}>{user?.type || 'Standard User'}</span></p>
          </div>
        </div>

        <div className="profile-form-section">
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <h2>Edit Profile</h2>

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Clinician Fields */}
            {isClinician() && (
              <>
                <div className="form-divider">
                  <h3>Professional Information</h3>
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter contact number"
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your clinic address"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Primary Branch</label>
                  <select
                    value={primaryBranchId}
                    onChange={(e) => setPrimaryBranchId(e.target.value)}
                  >
                    <option value="">Select Branch</option>
                    {branches.map(branch => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.city} - {branch.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>About / Bio</label>
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Tell patients about yourself, your approach, and areas of expertise..."
                    rows="4"
                  />
                </div>
              </>
            )}

            {/* Patient Fields */}
            {isPatient() && (
              <>
                <div className="form-divider">
                  <h3>Personal Information</h3>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={patientAddress}
                    onChange={(e) => setPatientAddress(e.target.value)}
                    placeholder="Enter your address"
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={phNo}
                      onChange={(e) => setPhNo(e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="form-group">
                    <label>Emergency Contact</label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="Name and phone of emergency contact"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password Change Section */}
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

            <div className="form-row">
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
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save">
                Save Changes
              </button>
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => {
                  setName(user.name || "");
                  setEmail(user.email || "");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setProfilePic(null);
                  setProfilePicPreview(user.profile_pic || "");
                  
                  // Reset clinician fields
                  setPhone("");
                  setAddress("");
                  setAbout("");
                  setPrimaryBranchId("");
                  
                  // Reset patient fields
                  setDateOfBirth("");
                  setGender("");
                  setPatientAddress("");
                  setPhNo("");
                  setEmergencyContact("");
                  
                  fetchUserDetails(user.id);
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