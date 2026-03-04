import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Page from "./components/Page";
import DoctorSelectionPage from "./components/DoctorSelectionPage";
import BookingPage from "./components/BookingPage";
import Signup from "./components/Signup";
import Login from "./components/Login";
import AdminPage from "./components/AdminPage";
import ProfilePage from "./components/ProfilePage"; // Add this import

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Page />} />
        <Route path="/online-therapy" element={<DoctorSelectionPage />} />
        <Route path="/booking/:doctorId" element={<BookingPage />} />
        <Route path="/sign-up" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/profile" element={<ProfilePage />} /> {/* Add this route */}
      </Routes>
    </Router>
  );
}

export default App;