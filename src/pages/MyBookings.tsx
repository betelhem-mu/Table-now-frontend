import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useToast } from "../context/ToastContext";
import { SettingsDropdown } from "../components/SettingsDropdown";
import type { Booking, Service, ServiceProvider, User } from "../types";

interface CustomerBookingsResponse {
  bookings: Booking[];
}

const MyBookings = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [, setSettingVersion] = useState(0);

  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const customerDisplayName = localStorage.getItem("customer_display_name") || currentUser.name || "Customer";
  const customerProfileImage = localStorage.getItem("customer_profile_image") || "";

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const data = await apiRequest<CustomerBookingsResponse>("/bookings/customer", {
        token,
      });

      setBookings(data.bookings || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to load your bookings.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [navigate]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancellingId(bookingId);

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      await apiRequest<{ message: string }>(`/bookings/${bookingId}/cancel`, {
        method: "PUT",
        token,
      });

      addToast("Appointment cancelled successfully.", "success");
      setConfirmCancelId(null);
      await loadBookings();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to cancel booking.";
      addToast(msg, "error");
    } finally {
      setCancellingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    addToast("Logged out successfully.", "info");
    navigate("/login");
  };

  const getServiceName = (service: string | Service): string => {
    if (typeof service === "string") return "Service";
    return service?.name || "Service";
  };

  const getServiceDescription = (service: string | Service): string => {
    if (typeof service === "string") return "";
    return service?.description || "";
  };

  const getServicePrice = (service: string | Service): number => {
    if (typeof service === "string") return 0;
    return service?.price || 0;
  };

  const getServiceDuration = (service: string | Service): number => {
    if (typeof service === "string") return 0;
    return service?.duration || 0;
  };

  const getProviderName = (provider: string | User | ServiceProvider): string => {
    if (!provider) return "Provider";
    if (typeof provider === "string") return provider;
    return provider.name || "Provider";
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return { formattedDate: dateString, formattedTime: "" };

    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return { formattedDate, formattedTime };
  };

  const isUpcoming = (booking: Booking): boolean => {
    if (booking.status !== "scheduled") return false;
    const bookingDate = new Date(booking.date);
    const now = new Date();
    return bookingDate >= now;
  };

  const upcomingBookings = bookings.filter((b) => isUpcoming(b));
  const historyBookings = bookings.filter((b) => !isUpcoming(b));

  const currentTabBookings = activeTab === "upcoming" ? upcomingBookings : historyBookings;

  const filteredBookings = currentTabBookings.filter((b) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const serviceName = getServiceName(b.service).toLowerCase();
    const providerName = getProviderName(b.provider).toLowerCase();
    return serviceName.includes(query) || providerName.includes(query);
  });

  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;

  return (
    <main className="customer-page">
      {/* Navigation Bar */}
      <nav className="customer-navbar">
        <div className="customer-brand" onClick={() => navigate("/customer")} style={{ cursor: "pointer" }}>
          <div className="brand-icon">B</div>
          <div>
            <strong>BookEasy</strong>
            <span>Smart booking</span>
          </div>
        </div>

        <div className="customer-nav-links">
          <button type="button" onClick={() => navigate("/customer")}>
            Dashboard & Services
          </button>
          <button type="button" className="active-nav-link" onClick={() => navigate("/customer/bookings")}>
            My Bookings
          </button>
        </div>

        <div className="customer-user-area">
          <SettingsDropdown
            role="customer"
            defaultName={currentUser.name || "Customer"}
            onUpdate={() => setSettingVersion((v) => v + 1)}
          />

          <div className="customer-user">
            <div
              className="user-avatar"
              style={customerProfileImage ? { padding: 0, overflow: "hidden" } : {}}
            >
              {customerProfileImage ? (
                <img src={customerProfileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                customerDisplayName.charAt(0).toUpperCase() || "C"
              )}
            </div>
            <div>
              <strong>{customerDisplayName}</strong>
              <span>Customer Account</span>
            </div>
          </div>
          <button type="button" className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <section className="my-bookings-container">
        {/* Header Section */}
        <div className="my-bookings-header">
          <div>
            <span className="hero-badge">✦ CUSTOMER DASHBOARD</span>
            <h1>My Appointments & Booking History</h1>
            <p>View your scheduled upcoming appointments, modify bookings, or check your past appointment history.</p>
          </div>
          <button type="button" className="primary-action-btn" onClick={() => navigate("/customer")}>
            + Book New Appointment
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div className="bookings-stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📅</span>
            <div>
              <span className="stat-label">Total Bookings</span>
              <strong className="stat-value">{bookings.length}</strong>
            </div>
          </div>
          <div className="stat-card stat-card-upcoming">
            <span className="stat-icon">⏳</span>
            <div>
              <span className="stat-label">Upcoming Scheduled</span>
              <strong className="stat-value">{upcomingBookings.length}</strong>
            </div>
          </div>
          <div className="stat-card stat-card-completed">
            <span className="stat-icon">✓</span>
            <div>
              <span className="stat-label">Completed</span>
              <strong className="stat-value">{completedCount}</strong>
            </div>
          </div>
          <div className="stat-card stat-card-cancelled">
            <span className="stat-icon">✕</span>
            <div>
              <span className="stat-label">Cancelled</span>
              <strong className="stat-value">{cancelledCount}</strong>
            </div>
          </div>
        </div>

        {/* Tab Selection & Search Control */}
        <div className="bookings-control-bar">
          <div className="bookings-tabs">
            <button
              type="button"
              className={`tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
              onClick={() => setActiveTab("upcoming")}
            >
              Upcoming Appointments ({upcomingBookings.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              Booking History ({historyBookings.length})
            </button>
          </div>

          <div className="bookings-search">
            <input
              type="text"
              placeholder="Search by service or provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="clear-search" onClick={() => setSearchQuery("")}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content Loading & State Handling */}
        {loading && (
          <div className="services-state">
            <div className="loading-spinner"></div>
            <p>Loading your appointments...</p>
          </div>
        )}

        {!loading && error && (
          <div className="services-state error-state">
            <div className="state-icon">!</div>
            <h3>Unable to load bookings</h3>
            <p>{error}</p>
            <button type="button" onClick={loadBookings}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredBookings.length === 0 && (
          <div className="services-state empty-bookings-state">
            <div className="state-icon">
              {activeTab === "upcoming" ? "📅" : "📜"}
            </div>
            <h3>
              {searchQuery
                ? "No matching appointments found"
                : activeTab === "upcoming"
                ? "No upcoming appointments scheduled"
                : "No past booking history found"}
            </h3>
            <p>
              {searchQuery
                ? "Try searching for a different keyword."
                : activeTab === "upcoming"
                ? "You haven't booked any upcoming appointments yet."
                : "Your completed and cancelled bookings will appear here."}
            </p>
            {activeTab === "upcoming" && !searchQuery && (
              <button
                type="button"
                className="primary-action-btn"
                onClick={() => navigate("/customer")}
              >
                Browse & Book Services Now
              </button>
            )}
          </div>
        )}

        {/* Bookings Grid */}
        {!loading && !error && filteredBookings.length > 0 && (
          <div className="bookings-list">
            {filteredBookings.map((booking) => {
              const { formattedDate, formattedTime } = formatDateTime(booking.date);
              const serviceName = getServiceName(booking.service);
              const serviceDesc = getServiceDescription(booking.service);
              const price = getServicePrice(booking.service);
              const duration = getServiceDuration(booking.service);
              const providerName = getProviderName(booking.provider);
              const canCancel = isUpcoming(booking);

              const displayTime = booking.time || formattedTime;

              return (
                <div key={booking._id} className={`booking-card status-${booking.status}`}>
                  <div className="booking-card-header">
                    <div className="booking-service-title-area">
                      <div className="booking-icon-badge">✦</div>
                      <div>
                        <h3>{serviceName}</h3>
                        <span className="booking-provider-name">By {providerName}</span>
                      </div>
                    </div>

                    <span className={`status-pill status-${booking.status}`}>
                      {booking.status === "scheduled" && "Scheduled"}
                      {booking.status === "completed" && "Completed"}
                      {booking.status === "cancelled" && "Cancelled"}
                    </span>
                  </div>

                  {serviceDesc && <p className="booking-service-desc">{serviceDesc}</p>}

                  <div className="booking-card-details">
                    <div className="detail-item">
                      <span className="detail-label">Date & Time</span>
                      <strong className="detail-value highlighted">
                        🗓️ {formattedDate} at ⏰ {displayTime}
                      </strong>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Duration</span>
                      <strong className="detail-value">⏳ {duration} min</strong>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Price</span>
                      <strong className="detail-value price-tag">${price}</strong>
                    </div>
                  </div>

                  <div className="booking-card-footer">
                    <span className="booking-id-tag">ID: {booking._id.substring(0, 8)}...</span>

                    {canCancel && (
                      <button
                        type="button"
                        className="cancel-booking-btn"
                        onClick={() => setConfirmCancelId(booking._id)}
                      >
                        Cancel Appointment
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Cancel Confirmation Modal */}
      {confirmCancelId && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon warning">!</div>
            <h2>Cancel Appointment?</h2>
            <p>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setConfirmCancelId(null)}
                disabled={cancellingId === confirmCancelId}
              >
                Keep Appointment
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={() => handleCancelBooking(confirmCancelId)}
                disabled={cancellingId === confirmCancelId}
              >
                {cancellingId === confirmCancelId ? "Cancelling..." : "Yes, Cancel Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default MyBookings;
