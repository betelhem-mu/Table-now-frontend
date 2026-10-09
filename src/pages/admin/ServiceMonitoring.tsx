import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../../components/Logo";
import { apiRequest } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { getServiceImage } from "../../utils/serviceUtils";
import type { Service, ServiceProvider } from "../../types";

interface ServicesResponse {
  services: Service[];
}

const CATEGORIES = [
  "All",
  "Beauty & Wellness",
  "Education & Coaching",
  "Tech & Business",
  "Health & Fitness",
  "Automotive",
  "General",
];

const ServiceMonitoring = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const loadServices = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      let queryStr = "";
      if (searchQuery.trim()) {
        queryStr = `?search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const data = await apiRequest<ServicesResponse>(`/admin/services${queryStr}`, { token });
      setServices(data.services || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load services oversight.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadServices();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    addToast("Logged out successfully.", "info");
    navigate("/login");
  };

  const filteredServices = services.filter((s) => {
    if (selectedCategory === "All") return true;
    return (s.category || "General") === selectedCategory;
  });

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
            <Link to="/admin/services" className="nav-item active">
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

      {/* Main Content */}
      <main className="customer-main" style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "700", color: "#f8fafc" }}>
            Platform Service Oversight
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem", marginTop: "0.25rem" }}>
            View all services created across the platform by approved providers.
          </p>
        </div>

        {/* Filter and Search Bar */}
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
          {/* Category Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <label htmlFor="admin-cat-filter" style={{ color: "#94a3b8", fontSize: "0.875rem", fontWeight: "600" }}>
              Category:
            </label>
            <select
              id="admin-cat-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "0.45rem 0.85rem",
                color: "#f8fafc",
                fontSize: "0.875rem",
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Search service name/description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "0.45rem 0.85rem",
                color: "#f8fafc",
                fontSize: "0.875rem",
                width: "260px",
              }}
            />
            <button
              type="submit"
              style={{
                background: "#4f46e5",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "0.45rem 0.85rem",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Search
            </button>
          </form>
        </div>

        {error && (
          <div className="auth-error" style={{ marginBottom: "1.5rem" }} role="alert">
            <span>!</span> {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#94a3b8" }}>
            <div className="button-spinner" style={{ width: "32px", height: "32px", borderTopColor: "#6366f1" }}></div>
            <p style={{ marginTop: "1rem" }}>Loading services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
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
            <h3>No services found</h3>
            <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
              No platform services match your selected filters.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {filteredServices.map((service) => {
              const providerObj = typeof service.provider === "object" ? (service.provider as ServiceProvider) : null;
              const providerName = providerObj?.name || "Provider";
              const providerEmail = providerObj?.email || "";

              return (
                <div
                  key={service._id}
                  style={{
                    background: "rgba(30, 41, 59, 0.6)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ height: "160px", overflow: "hidden", position: "relative" }}>
                    <img
                      src={getServiceImage(service)}
                      alt={service.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: "rgba(15, 23, 42, 0.85)",
                        color: "#a855f7",
                        padding: "0.25rem 0.65rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {service.category || "General"}
                    </span>
                  </div>

                  <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#f8fafc", marginBottom: "0.4rem" }}>
                      {service.name}
                    </h3>
                    <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginBottom: "1rem", flex: 1 }}>
                      {service.description}
                    </p>

                    <div
                      style={{
                        paddingTop: "0.85rem",
                        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "1.25rem", fontWeight: "800", color: service.price === 0 ? "#4ade80" : "#38bdf8" }}>
                          {service.price === 0 ? "FREE" : `$${service.price.toFixed(2)}`}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{service.duration} mins</div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#e2e8f0" }}>{providerName}</div>
                        {providerEmail && <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{providerEmail}</div>}
                      </div>
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

export default ServiceMonitoring;
