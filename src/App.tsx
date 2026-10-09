import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Customer from "./pages/Customer";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import ProviderDashboard from "./pages/provider/ProviderDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastProvider } from "./context/ToastContext";
import "./App.css";

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route
          path="/"
          element={<LandingPage />}
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
          element={
            <ProtectedRoute allowedRole="customer">
              <Customer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/bookings"
          element={
            <ProtectedRoute allowedRole="customer">
              <MyBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/provider"
          element={
            <ProtectedRoute allowedRole="provider">
              <ProviderDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/services/:id/book"
          element={
            <ProtectedRoute allowedRole="customer">
              <Booking />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </ToastProvider>
  );
}

export default App;