import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Signup.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      console.log("Attempting login with email:", email);

      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (res.ok) {
        setMessage("Login successful! Redirecting...");
        
        if (data.user) {
          // FIX: Use "user" not "users"
          localStorage.setItem("user", JSON.stringify(data.user));
          
          // Dispatch login event for navbar
          window.dispatchEvent(new Event('login'));
          
          console.log("User data saved:", data.user);
        }
        
        setEmail("");
        setPassword("");
        
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setMessage(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage("Network error - please check if server is running");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <form onSubmit={handleSubmit}>
        <h3>Login</h3>

        {message && (
          <p style={{ 
            color: message.includes("successful") ? "lightgreen" : 
                   message.includes("Network") ? "orange" : "yellow" 
          }}>
            {message}
          </p>
        )}

        <label>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />

        <button 
          className="signUp" 
          type="submit"
          disabled={isLoading}
          style={{ opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>

        <div style={{ 
          textAlign: "center", 
          marginTop: "15px",
          color: "#fff",
          fontSize: "14px"
        }}>
          Don't have an account?{" "}
          <a 
            href="/sign-up" 
            style={{ 
              color: "#ffd700", 
              textDecoration: "none",
              fontWeight: "bold"
            }}
            onClick={(e) => {
              e.preventDefault();
              navigate("/sign-up");
            }}
          >
            Sign up here
          </a>
        </div>
      </form>
    </div>
  );
}