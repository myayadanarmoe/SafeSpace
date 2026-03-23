import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Settings.css";

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsReminders, setSmsReminders] = useState(false);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  
  // Display settings
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("Asia/Yangon");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  
  // Privacy settings
  const [shareDataWithClinicians, setShareDataWithClinicians] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  // Reminder timing
  const [reminderTime, setReminderTime] = useState("1 hour");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
    
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem("settings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setEmailNotifications(settings.emailNotifications ?? true);
      setSmsReminders(settings.smsReminders ?? false);
      setAppointmentReminders(settings.appointmentReminders ?? true);
      setMarketingEmails(settings.marketingEmails ?? false);
      setLanguage(settings.language ?? "en");
      setTimezone(settings.timezone ?? "Asia/Yangon");
      setDateFormat(settings.dateFormat ?? "MM/DD/YYYY");
      setShareDataWithClinicians(settings.shareDataWithClinicians ?? true);
      setTwoFactorEnabled(settings.twoFactorEnabled ?? false);
      setReminderTime(settings.reminderTime ?? "1 hour");
    }
  }, [navigate]);

  const handleSaveSettings = () => {
    const settings = {
      emailNotifications,
      smsReminders,
      appointmentReminders,
      marketingEmails,
      language,
      timezone,
      dateFormat,
      shareDataWithClinicians,
      twoFactorEnabled,
      reminderTime
    };
    
    localStorage.setItem("settings", JSON.stringify(settings));
    
    setMessage({ text: "Settings saved successfully", type: "success" });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleResetToDefault = () => {
    setEmailNotifications(true);
    setSmsReminders(false);
    setAppointmentReminders(true);
    setMarketingEmails(false);
    setLanguage("en");
    setTimezone("Asia/Yangon");
    setDateFormat("MM/DD/YYYY");
    setShareDataWithClinicians(true);
    setTwoFactorEnabled(false);
    setReminderTime("1 hour");
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      // Delete account logic would go here
      localStorage.removeItem("user");
      localStorage.removeItem("settings");
      navigate("/");
    }
  };

  return (
    <div className="settings-container">
      <h1 className="page-header">Settings</h1>
      <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button> <br />

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-content">
        {/* Notification Settings */}
        <div className="settings-section">
          <h2>Notification Preferences</h2>
          <div className="settings-grid">
            <label className="checkbox-item">
              <span className="checkbox-text">Email Notifications</span>
              <span className="checkbox-description">Receive updates via email</span>
              <input 
                type="checkbox" 
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
              <span className="toggle-switch"></span>
            </label>

            <label className="checkbox-item">
              <span className="checkbox-text">SMS Reminders</span>
              <span className="checkbox-description">Get text reminders for appointments</span>
              <input 
                type="checkbox" 
                checked={smsReminders}
                onChange={(e) => setSmsReminders(e.target.checked)}
              />
              <span className="toggle-switch"></span>
            </label>

            <label className="checkbox-item">
              <span className="checkbox-text">Appointment Reminders</span>
              <span className="checkbox-description">Receive reminders before sessions</span>
              <input 
                type="checkbox" 
                checked={appointmentReminders}
                onChange={(e) => setAppointmentReminders(e.target.checked)}
              />
              <span className="toggle-switch"></span>
            </label>

            <label className="checkbox-item">
              <span className="checkbox-text">Marketing Emails</span>
              <span className="checkbox-description">Newsletters and promotions</span>
              <input 
                type="checkbox" 
                checked={marketingEmails}
                onChange={(e) => setMarketingEmails(e.target.checked)}
              />
              <span className="toggle-switch"></span>
            </label>

            <div className="form-group">
              <label>Reminder Timing</label>
              <select value={reminderTime} onChange={(e) => setReminderTime(e.target.value)}>
                <option value="15 min">15 minutes before</option>
                <option value="30 min">30 minutes before</option>
                <option value="1 hour">1 hour before</option>
                <option value="1 day">1 day before</option>
              </select>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="settings-section">
          <h2>Display Preferences</h2>
          <div className="settings-grid">
            <div className="form-group">
              <label>Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="my">Myanmar (Burmese)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Time Zone</label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="Asia/Yangon">Yangon (UTC+6:30)</option>
                <option value="Asia/Bangkok">Bangkok (UTC+7:00)</option>
                <option value="Asia/Singapore">Singapore (UTC+8:00)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date Format</label>
              <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="settings-section">
          <h2>Privacy & Security</h2>
          <div className="settings-grid">
            <label className="checkbox-item">
              <span className="checkbox-text">Share data with clinicians</span>
              <span className="checkbox-description">Allow clinicians to view your history</span>
              <input 
                type="checkbox" 
                checked={shareDataWithClinicians}
                onChange={(e) => setShareDataWithClinicians(e.target.checked)}
              />
              <span className="toggle-switch"></span>
            </label>

            <div className="button-group-row">
              <span className="button-label">Two-Factor Authentication</span>
              <button 
                className={`toggle-btn ${twoFactorEnabled ? 'enabled' : ''}`}
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              >
                {twoFactorEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>

            <div className="button-group-row">
              <span className="button-label">Download My Data</span>
              <button className="action-btn">Download</button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-section danger">
          <h2>Danger Zone</h2>
          <div className="settings-grid">
            <div className="button-group-row">
              <span className="button-label">Delete Account</span>
              <button className="delete-btn" onClick={handleDeleteAccount}>
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="settings-actions">
          <button className="btn-save" onClick={handleSaveSettings}>
            Save Settings
          </button>
          <button className="btn-cancel" onClick={handleResetToDefault}>
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}