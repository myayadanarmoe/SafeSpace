import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false); // track menu state

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href="/" className="navbar-logo">SafeSpace</a>

        {/* Toggle Button */}
        <button
          className={`navbar-toggle ${open ? "active" : ""}`}
          onClick={() => setOpen(!open)} // toggle menu
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        {/* Menu */}
        <ul className={`navbar-menu ${open ? "active" : ""}`}>
          <li><a href="/" className="active">Home</a></li>
          <li><a href="/sign-up">Sign Up</a></li>
          <li><a href="/online-therapy">Online Therapy</a></li>
          <li><a href="/offline-therapy">Offline Therapy</a></li>
          <li><a href="/subscription">Subscription</a></li>
        </ul>
      </div>
    </nav>
  );
}
