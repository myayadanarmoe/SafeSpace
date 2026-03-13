import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Page from "./components/Page";
import DoctorSelectionPage from "./components/DoctorSelectionPage";
import BookingPage from "./components/BookingPage";
import Signup from "./components/Signup";
import Login from "./components/Login";
import AdminPage from "./components/AdminPage";
import ProfilePage from "./components/ProfilePage"; // Add this import
import Availability from "./components/Availabilty";
import MyAppointments from "./components/MyAppointments";
import OfflineTherapy from "./components/OfflineTherapy";
import Subscription from "./components/Subscription";
import MyPatients from "./components/MyPatients";
import StaffBooking from "./components/StaffBooking";
import StaffSchedule from "./components/StaffSchedule";
import StaffPatients from "./components/StaffPatients";
import Settings from "./components/Settings";

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
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/availability" element={<Availability />} /> 
        <Route path="/my-appointments" element={<MyAppointments />} />
        <Route path="/offline-therapy" element={<OfflineTherapy />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/my-patients" element={<MyPatients />} />
        <Route path="/staff/book-appointment" element={<StaffBooking />} />
        <Route path="/staff/schedule" element={<StaffSchedule />} />
        <Route path="/staff/patients" element={<StaffPatients />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
 