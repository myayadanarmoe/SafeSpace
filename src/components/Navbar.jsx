import { useState } from "react";
import { Link } from "react-router-dom"; // <-- import Link

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">SafeSpace</Link>

        <button
          className={`navbar-toggle ${open ? "active" : ""}`}
          onClick={() => setOpen(!open)}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <ul className={`navbar-menu ${open ? "active" : ""}`}>
          <li>
            <Link to="/" className="active">Home</Link>
          </li>
          <li>
            <Link to="/sign-up">Sign Up</Link>
          </li>
          <li>
            <Link to="/online-therapy">Online Therapy</Link> {/* <-- fixed */}
          </li>
          <li>
            <Link to="/offline-therapy">Offline Therapy</Link>
          </li>
          <li>
            <Link to="/subscription">Subscription</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

// import { useState } from "react";

// export default function Navbar() {
//   const [open, setOpen] = useState(false);

//   return (
//     <nav className="navbar">
//       <div className="navbar-container">
//         <a href="/" className="navbar-logo">SafeSpace</a>

//         <button
//           className={`navbar-toggle ${open ? "active" : ""}`}
//           onClick={() => setOpen(!open)}
//         >
//           <span className="bar"></span>
//           <span className="bar"></span>
//           <span className="bar"></span>
//         </button>

//         <ul className={`navbar-menu ${open ? "active" : ""}`}>
//           <li><a href="/" className="active">Home</a></li>
//           <li><a href="/sign-up">Sign Up</a></li>
//           <li><a href="/online-therapy">Online Therapy</a></li>
//           <li><a href="/offline-therapy">Offline Therapy</a></li>
//           <li><a href="/subscription">Subscription</a></li>
//         </ul>
//       </div>
//     </nav>
//   );
// }


