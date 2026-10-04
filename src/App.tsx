import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Customer from "./pages/Customer";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/customer"
        element={<Customer />}
      />

      <Route
        path="/customer/bookings"
        element={<MyBookings />}
      />

      <Route
        path="/services/:id/book"
        element={<Booking />}
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default App;