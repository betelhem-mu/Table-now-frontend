import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../../components/Logo";
import { apiRequest } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import type { AdminDashboardStats, ProviderApplication, Booking } from "../../types";

interface DashboardDataResponse {
  stats: AdminDashboardStats;
  recentApplications: ProviderApplication[];
  recentBookings: Booking[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [stats, setStats] = useState<AdminDashboardStats>({
    totalCustomers: 0,
    totalApprovedProviders: 0,
    pendingProviderApplications: 0,
    totalServices: 0,
    totalBookings: 0,
  });
  const [recentApplications, setRecentApplications] = useState<ProviderApplication[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const data = await apiRequest<DashboardDataResponse>("/admin/dashboard", { token });
      setStats(data.stats);
      setRecentApplications(data.recentApplications || []);
      setRecentBookings(data.recentBookings || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load admin dashboard statistics.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    addToast("Logged out successfully.", "info");
    navigate("/login");
  };

  const handleApproveQuick = async (appId: string) => {
    try {
      setActionLoadingId(appId);
      const token = localStorage.getItem("token") || "";
      await apiRequest(`/admin/provider-applications/${appId}/approve`, {
        method: "PATCH",
        token,
      });
      addToast("Provider application approved successfully!", "success");
      loadDashboardData();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to approve provider.", "error");
    } finally {
      setActionLoadingId(null);
    }
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
            <Link to="/admin" className="nav-item active">
              Dashboard
            </Link>
            <Link to="/admin/applications" className="nav-item">
              Applications {stats.pendingProviderApplications > 0 && (
                <span className="badge-count">{stats.pendingProviderApplications}</span>
              )}
            </Link>
            <Link to="/admin/users" className="nav-item">
              Users
            </Link>
            <Link to="/admin/services" className="nav-item">
              Services
            </Link>
            <Link to="/admin/bookings" className="nav-item">
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

      {/* Main Content Area */}
      <main className="customer-main" style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "700", color: "#f8fafc" }}>
            Admin Dashboard Overview
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem", marginTop: "0.25rem" }}>
            Monitor key metrics, review pending provider applications, and manage platform activity.
          </p>
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: "1.5rem" }} role="alert">
            <span>!</span> {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#94a3b8" }}>
            <div className="button-spinner" style={{ width: "32px", height: "32px", borderTopColor: "#6366f1" }}></div>
            <p style={{ marginTop: "1rem" }}>Loading dashboard analytics...</p>
          </div>
        ) : (
          <>
            {/* Statistics Cards Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1.25rem",
                marginBottom: "2.5rem",
              }}
            >
              {/* Total Customers Card */}
              <div
                style={{
                  background: "rgba(30, 41, 59, 0.7)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                }}
              >
                <span style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>
                  Customers
                </span>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: "#38bdf8", marginTop: "0.5rem" }}>
                  {stats.totalCustomers}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
                  Registered Customer Users
                </div>
              </div>

              {/* Approved Providers Card */}
              <div
                style={{
                  background: "rgba(30, 41, 59, 0.7)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                }}
              >
                <span style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>
                  Approved Providers
                </span>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: "#4ade80", marginTop: "0.5rem" }}>
                  {stats.totalApprovedProviders}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
                  Active Service Providers
                </div>
              </div>

              {/* Pending Applications Card */}
              <div
                style={{
                  background: stats.pendingProviderApplications > 0 ? "rgba(234, 179, 8, 0.1)" : "rgba(30, 41, 59, 0.7)",
                  backdropFilter: "blur(12px)",
                  border: stats.pendingProviderApplications > 0 ? "1px solid rgba(234, 179, 8, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                }}
              >
                <span style={{ color: stats.pendingProviderApplications > 0 ? "#facc15" : "#94a3b8", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>
                  Pending Applications
                </span>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: stats.pendingProviderApplications > 0 ? "#facc15" : "#f8fafc", marginTop: "0.5rem" }}>
                  {stats.pendingProviderApplications}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
                  Awaiting Approval
                </div>
              </div>

              {/* Total Services Card */}
              <div
                style={{
                  background: "rgba(30, 41, 59, 0.7)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                }}
              >
                <span style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>
                  Total Services
                </span>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: "#a855f7", marginTop: "0.5rem" }}>
                  {stats.totalServices}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
                  Catalog Services
                </div>
              </div>

              {/* Total Bookings Card */}
              <div
                style={{
                  background: "rgba(30, 41, 59, 0.7)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                }}
              >
                <span style={{ color: "#94a3b8", fontSize: "0.85rem", fontWeight: "600", textTransform: "uppercase" }}>
                  Total Bookings
                </span>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: "#f43f5e", marginTop: "0.5rem" }}>
                  {stats.totalBookings}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
                  Appointments Scheduled
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Activity Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
              {/* Recent Applications Panel */}
              <div
                style={{
                  background: "rgba(30, 41, 59, 0.6)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#f8fafc" }}>
                    Recent Provider Applications
                  </h2>
                  <Link to="/admin/applications" style={{ color: "#6366f1", fontSize: "0.85rem", textDecoration: "none", fontWeight: "600" }}>
                    View All &rarr;
                  </Link>
                </div>

                {recentApplications.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem 0", color: "#64748b" }}>
                    No provider applications submitted yet.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {recentApplications.map((app) => (
                      <div
                        key={app.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "rgba(15, 23, 42, 0.5)",
                          padding: "1rem",
                          borderRadius: "12px",
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "600", color: "#f8fafc", fontSize: "0.95rem" }}>{app.name}</div>
                          <div style={{ color: "#94a3b8", fontSize: "0.825rem" }}>{app.email}</div>
                          <div style={{ marginTop: "0.25rem" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "9999px",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                textTransform: "capitalize",
                                background:
                                  app.providerStatus === "approved"
                                    ? "rgba(74, 222, 128, 0.15)"
                                    : app.providerStatus === "rejected"
                                    ? "rgba(244, 63, 94, 0.15)"
                                    : "rgba(234, 179, 8, 0.15)",
                                color:
                                  app.providerStatus === "approved"
                                    ? "#4ade80"
                                    : app.providerStatus === "rejected"
                                    ? "#f43f5e"
                                    : "#facc15",
                              }}
                            >
                              {app.providerStatus || "pending"}
                            </span>
                          </div>
                        </div>

                        {(app.providerStatus === "pending" || !app.providerStatus) && (
                          <button
                            onClick={() => handleApproveQuick(app.id)}
                            disabled={actionLoadingId === app.id}
                            style={{
                              background: "linear-gradient(135deg, #10b981, #059669)",
                              color: "#fff",
                              border: "none",
                              padding: "0.4rem 0.85rem",
                              borderRadius: "8px",
                              fontSize: "0.8rem",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            {actionLoadingId === app.id ? "..." : "Approve"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Bookings Panel */}
              <div
                style={{
                  background: "rgba(30, 41, 59, 0.6)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#f8fafc" }}>
                    Recent Bookings
                  </h2>
                  <Link to="/admin/bookings" style={{ color: "#6366f1", fontSize: "0.85rem", textDecoration: "none", fontWeight: "600" }}>
                    View All &rarr;
                  </Link>
                </div>

                {recentBookings.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem 0", color: "#64748b" }}>
                    No bookings created yet.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {recentBookings.map((b) => {
                      const serviceName = typeof b.service === "object" ? b.service?.name : "Service";
                      const customerName = typeof b.customer === "object" ? b.customer?.name : "Customer";
                      const dateStr = b.date ? new Date(b.date).toLocaleDateString() : "";
                      return (
                        <div
                          key={b._id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "rgba(15, 23, 42, 0.5)",
                            padding: "1rem",
                            borderRadius: "12px",
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: "600", color: "#f8fafc", fontSize: "0.95rem" }}>{serviceName}</div>
                            <div style={{ color: "#94a3b8", fontSize: "0.825rem" }}>
                              Customer: {customerName} &bull; {dateStr} {b.time ? `at ${b.time}` : ""}
                            </div>
                          </div>

                          <span
                            style={{
                              padding: "0.2rem 0.6rem",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              textTransform: "capitalize",
                              background:
                                b.status === "completed"
                                  ? "rgba(74, 222, 128, 0.15)"
                                  : b.status === "cancelled"
                                  ? "rgba(244, 63, 94, 0.15)"
                                  : "rgba(56, 189, 248, 0.15)",
                              color:
                                b.status === "completed"
                                  ? "#4ade80"
                                  : b.status === "cancelled"
                                  ? "#f43f5e"
                                  : "#38bdf8",
                            }}
                          >
                            {b.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
