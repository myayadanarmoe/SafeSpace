import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Page from "./components/Page"; // Home page
import DoctorSelectionPage from "./components/DoctorSelectionPage";
import BookingPage from "./components/BookingPage";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Page />} />               {/* Home */}
        <Route path="/online-therapy" element={<DoctorSelectionPage />} />
        <Route path="/booking/:doctorId" element={<BookingPage />} />
      </Routes>
    </Router>
  );
}

export default App;