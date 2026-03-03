import React, { useState } from "react";
import "../SignUp.css";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      setMessage(data.message);

      if (res.ok) {
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      setMessage("Network error");
    }
  };

  return (
    <div className="signup-container">
      <form onSubmit={handleSubmit}>
        <h3>Sign Up</h3>

        {message && <p style={{ color: "yellow" }}>{message}</p>}

        <label>Username</label>
        <input
          type="text"
          placeholder="Email or Phone"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="signUp" type="submit">
          Sign Up
        </button>

        <div className="social">
          <div>
            <i className="fab fa-google"></i>
            <img
              className="icon"
              src="https://images.icon-icons.com/2699/PNG/256/google_logo_icon_169090.png"
            />
            Google
          </div>
          <div>
            <i className="fab fa-facebook"></i>
            <img
              className="icon"
              src="https://images.icon-icons.com/1488/PNG/256/5293-facebook_102565.png"
            />
            Facebook
          </div>
        </div>
      </form>
    </div>
  );
}