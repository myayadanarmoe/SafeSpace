import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../SignUp.css";

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
      console.log("1. Attempting login with email:", email);

      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("2. Response status:", res.status);
      console.log("3. Response headers:", [...res.headers.entries()]);

      const data = await res.json();
      console.log("4. Response data:", data);

      if (res.ok) {
        setMessage("Login successful! Redirecting...");
        
        if (data.user) {

          window.dispatchEvent(new Event('login'));
          
          localStorage.setItem("user", JSON.stringify(data.user));
          console.log("5. User data saved to localStorage:", data.user);
          
          // Verify it was saved
          const saved = localStorage.getItem("user");
          console.log("6. Verified saved data:", JSON.parse(saved));
        }
        
        setEmail("");
        setPassword("");
        
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setMessage(data.message || "Login failed");
        console.log("7. Login failed with message:", data.message);
      }
    } catch (err) {
      console.error("8. Login error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
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