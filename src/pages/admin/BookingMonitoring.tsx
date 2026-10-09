import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../../components/Logo";
import { apiRequest } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import type { Booking, Service, ServiceProvider, User } from "../../types";

interface BookingsResponse {
  bookings: Booking[];
}

const BookingMonitoring = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "completed" | "cancelled">("all");
  const [dateFilter, setDateFilter] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      let queryStr = "";
      const params: string[] = [];
      if (statusFilter !== "all") {
        params.push(`status=${statusFilter}`);
      }
      if (dateFilter) {
        params.push(`date=${dateFilter}`);
      }
      if (params.length > 0) {
        queryStr = `?${params.join("&")}`;
      }

      const data = await apiRequest<BookingsResponse>(`/admin/bookings${queryStr}`, { token });
      setBookings(data.bookings || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load bookings oversight.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [statusFilter, dateFilter]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    addToast("Logged out successfully.", "info");
    navigate("/login");
  };

  return (
    <div className="customer-container">
      {/* Navigation Header */}
      <header className="customer-header">
        <div className="header-left">
          <div className="brand-logo" onClick={() => navigate("/admin")} style={{ cursor: "pointer" }}>
            <Logo size={36} />
            <span className="brand-name">BookEasy Admin</span>
          </div>

          <nav className="header-nav">
            <Link to="/admin" className="nav-item">
              Dashboard
            </Link>
            <Link to="/admin/applications" className="nav-item">
              Applications
            </Link>
            <Link to="/admin/users" className="nav-item">
              Users
            </Link>
            <Link to="/admin/services" className="nav-item">
              Services
            </Link>
            <Link to="/admin/bookings" className="nav-item active">
              Bookings
            </Link>
          </nav>
        </div>

        <div className="header-right">
          <div className="user-profile">
            <span className="user-name">{currentUser.name || "Administrator"}</span>
            <span className="user-role-badge admin">Admin</span>
          </div>

          <button className="logout-btn" onClick={handleLogout} title="Log Out">
            Log Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="customer-main" style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "700", color: "#f8fafc" }}>
            Platform Booking Oversight
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem", marginTop: "0.25rem" }}>
            Monitor appointments scheduled across all customer and provider accounts.
          </p>
        </div>

        {/* Filter Bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.75rem",
            background: "rgba(30, 41, 59, 0.6)",
            padding: "1rem 1.25rem",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {/* Status Filter Tabs */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["all", "scheduled", "completed", "cancelled"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: "0.45rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  textTransform: "capitalize",
                  border: "none",
                  cursor: "pointer",
                  background: statusFilter === st ? "#6366f1" : "rgba(255, 255, 255, 0.05)",
                  color: statusFilter === st ? "#ffffff" : "#94a3b8",
                  transition: "all 0.2s ease",
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label htmlFor="admin-date-filter" style={{ color: "#94a3b8", fontSize: "0.875rem", fontWeight: "600" }}>
              Date:
            </label>
            <input
              id="admin-date-filter"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "0.45rem 0.85rem",
                color: "#f8fafc",
                fontSize: "0.875rem",
              }}
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#94a3b8",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.45rem 0.65rem",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: "1.5rem" }} role="alert">
            <span>!</span> {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#94a3b8" }}>
            <div className="button-spinner" style={{ width: "32px", height: "32px", borderTopColor: "#6366f1" }}></div>
            <p style={{ marginTop: "1rem" }}>Loading bookings oversight...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              background: "rgba(30, 41, 59, 0.4)",
              borderRadius: "16px",
              border: "1px dashed rgba(255, 255, 255, 0.1)",
              color: "#94a3b8",
            }}
          >
            <h3>No bookings found</h3>
            <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
              No appointments match your status and date filter criteria.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {bookings.map((booking) => {
              const serviceObj = typeof booking.service === "object" ? (booking.service as Service) : null;
              const customerObj = typeof booking.customer === "object" ? (booking.customer as User) : null;
              const providerObj = typeof booking.provider === "object" ? (booking.provider as ServiceProvider) : null;

              const serviceName = serviceObj?.name || "Service";
              const customerName = customerObj?.name || "Customer";
              const customerEmail = customerObj?.email || "";
              const providerName = providerObj?.name || "Provider";

              const bookingDate = booking.date ? new Date(booking.date).toLocaleDateString() : "";

              return (
                <div
                  key={booking._id}
                  style={{
                    background: "rgba(30, 41, 59, 0.6)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#f8fafc" }}>{serviceName}</h3>
                      <span
                        style={{
                          padding: "0.2rem 0.65rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          background:
                            booking.status === "completed"
                              ? "rgba(74, 222, 128, 0.15)"
                              : booking.status === "cancelled"
                              ? "rgba(244, 63, 94, 0.15)"
                              : "rgba(56, 189, 248, 0.15)",
                          color:
                            booking.status === "completed"
                              ? "#4ade80"
                              : booking.status === "cancelled"
                              ? "#f43f5e"
                              : "#38bdf8",
                        }}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div style={{ color: "#94a3b8", fontSize: "0.875rem", marginTop: "0.4rem" }}>
                      <strong>Customer:</strong> {customerName} {customerEmail ? `(${customerEmail})` : ""} &bull;{" "}
                      <strong>Provider:</strong> {providerName}
                    </div>

                    <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                      📅 <strong>Date:</strong> {bookingDate} {booking.time ? `at ${booking.time}` : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingMonitoring;
