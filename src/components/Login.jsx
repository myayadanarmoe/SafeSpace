import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../SignUp.css";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Login successful! Redirecting...");
        
        // Store user data in localStorage
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        
        // Clear form
        setUsername("");
        setPassword("");
        
        // Redirect to home page after 2 seconds
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

        <label>Username or Email</label>
        <input
          type="text"
          placeholder="Username or Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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