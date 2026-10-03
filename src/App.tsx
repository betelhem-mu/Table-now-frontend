import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/customer"
          element={
            <div className="page-placeholder">
              <h1>Customer Dashboard</h1>
              <p>Coming next...</p>
            </div>
          }
        />

        <Route
          path="/provider"
          element={
            <div className="page-placeholder">
              <h1>Provider Dashboard</h1>
              <p>Coming next...</p>
            </div>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;