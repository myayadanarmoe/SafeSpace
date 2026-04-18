import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SignUp.css";

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Let browser validation happen first - don't prevent it
    // The form won't submit if HTML5 validation fails
    
    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Account created successfully! Redirecting to login...");
        
        setFormData({
          name: "",
          email: "",
          password: ""
        });
        
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setMessage(data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setMessage("Network error - please check if server is running");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <form onSubmit={handleSubmit}>
        <h3>Sign Up</h3>

        {message && (
          <p style={{ 
            color: message.includes("successfully") ? "#90EE90" : 
                   message.includes("Network") ? "#FFA500" : "#FFB6C1" 
          }}>
            {message}
          </p>
        )}

        <label>Full Name</label>
        <input
          type="text"
          name="name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={isLoading}
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          placeholder="Email address"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isLoading}
        />

        <label>Password</label>
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength="8"
          pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}"
          title="Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character (@$!%*?&)"
          disabled={isLoading}
        />

        <button 
          className="signUp" 
          type="submit"
          disabled={isLoading}
          style={{ opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? "Creating account..." : "Sign Up"}
        </button>

        <div style={{ 
          textAlign: "center", 
          marginTop: "15px",
          color: "#fff",
          fontSize: "14px"
        }}>
          Already have an account?{" "}
          <a 
            href="/login" 
            style={{ 
              color: "#ffd700", 
              textDecoration: "none",
              fontWeight: "bold"
            }}
            onClick={(e) => {
              e.preventDefault();
              navigate("/login");
            }}
          >
            Login here
          </a>
        </div>

        <div className="social">
          <div>
            <i className="fab fa-google"></i>
            <img
              className="icon"
              src="https://images.icon-icons.com/2699/PNG/256/google_logo_icon_169090.png"
              alt="Google"
            />
            Google
          </div>
          <div>
            <i className="fab fa-facebook"></i>
            <img
              className="icon"
              src="https://images.icon-icons.com/1488/PNG/256/5293-facebook_102565.png"
              alt="Facebook"
            />
            Facebook
          </div>
        </div>
      </form>
    </div>
  );
}