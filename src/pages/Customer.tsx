import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useToast } from "../context/ToastContext";
import { getServiceImage } from "../utils/serviceUtils";
import { SettingsDropdown } from "../components/SettingsDropdown";
import type { Booking, Service } from "../types";

interface ServicesResponse {
  services: Service[];
}

interface BookingsResponse {
  bookings: Booking[];
}

const CATEGORIES = [
  "All",
  "Beauty & Wellness",
  "Education & Coaching",
  "Tech & Business",
  "Health & Fitness",
  "Automotive",
];

const Customer = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, setSettingVersion] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const customerDisplayName = localStorage.getItem("customer_display_name") || user.name || "Customer";
  const customerProfileImage = localStorage.getItem("customer_profile_image") || "";

  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        // Fetch services
        const servicesData = await apiRequest<ServicesResponse>("/services", {
          token,
        });
        setServices(servicesData.services || []);

        // Fetch bookings count for stats
        try {
          const bookingsData = await apiRequest<BookingsResponse>("/bookings/customer", {
            token,
          });
          const scheduled = (bookingsData.bookings || []).filter(
            (b) => b.status === "scheduled" && new Date(b.date) >= new Date()
          );
          setActiveBookingsCount(scheduled.length);
        } catch {
          setActiveBookingsCount(0);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unable to load dashboard services.";
        setError(msg);
        addToast(msg, "error");
      } finally {
        setLoading(false);
      }
    };

    loadCustomerData();
  }, [navigate, addToast]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    addToast("Logged out successfully.", "info");
    navigate("/login");
  };

  const scrollToServices = () => {
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      !searchQuery.trim() ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      (service.category && service.category.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const getProviderName = (service: Service): string => {
    if (!service.provider) return "Provider";
    if (typeof service.provider === "string") return service.provider;
    return service.provider.name || "Provider";
  };

  return (
    <main className="customer-page">
      {/* Navigation Bar */}
      <nav className="customer-navbar">
        <div className="customer-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ cursor: "pointer" }}>
          <div className="brand-icon">B</div>
          <div>
            <strong>BookEasy</strong>
            <span>Smart booking</span>
          </div>
        </div>

        <div className="customer-nav-links">
          <button
            type="button"
            className="active-nav-link"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Dashboard
          </button>
          <button type="button" onClick={scrollToServices}>
            Browse Services
          </button>
          <button
            type="button"
            onClick={() => navigate("/customer/bookings")}
          >
            My Bookings {activeBookingsCount > 0 && `(${activeBookingsCount})`}
          </button>
        </div>

        <div className="customer-user-area">
          <SettingsDropdown
            role="customer"
            defaultName={user.name || "Customer"}
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

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Hero Banner Section */}
      <section className="customer-hero">
        <div className="customer-hero-content">
          <span className="hero-badge">✦ CUSTOMER DASHBOARD</span>

          <h1>
            Find the right service.
            <span> Book it with ease.</span>
          </h1>

          <p>
            Welcome back, <strong>{user.name || "Customer"}</strong>! Browse top-rated services from verified providers and manage your appointments seamlessly.
          </p>

          <div className="hero-cta-group">
            <button
              type="button"
              className="hero-action"
              onClick={scrollToServices}
            >
              Explore services <span>→</span>
            </button>
            <button
              type="button"
              className="hero-secondary-action"
              onClick={() => navigate("/customer/bookings")}
            >
              View My Appointments
            </button>
          </div>
        </div>

        <div className="hero-decoration">
          <div className="hero-circle hero-circle-one"></div>
          <div className="hero-circle hero-circle-two"></div>

          <div className="hero-booking-card">
            <div className="mini-card-top">
              <span>Customer Overview</span>
              <span className="status-dot"></span>
            </div>

            <h3>Live Dashboard</h3>

            <div className="mini-card-row">
              <span>Available services</span>
              <strong>{services.length}</strong>
            </div>

            <div className="mini-card-row">
              <span>Upcoming Bookings</span>
              <strong style={{ color: "#38bdf8" }}>{activeBookingsCount}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Services Catalog Section */}
      <section id="services" className="services-section">
        <div className="section-heading">
          <div>
            <span>DISCOVER & BOOK</span>
            <h2>Available Services</h2>
          </div>

          <p>
            Browse available services, view details, select a date & time, and confirm your appointment.
          </p>
        </div>

        {/* Live Search and Category Filters Toolbar */}
        <div className="catalog-toolbar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search services by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>

          <span className="results-count">
            Showing {filteredServices.length} of {services.length} services
          </span>
        </div>

        {/* Category Pills */}
        <div className="category-pills-row">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={`category-pill ${selectedCategory === category ? "active" : ""}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="services-state">
            <div className="loading-spinner"></div>
            <p>Finding available services...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="services-state error-state">
            <div className="state-icon">!</div>
            <h3>We couldn't load the services</h3>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredServices.length === 0 && (
          <div className="services-state">
            <div className="state-icon">✦</div>
            <h3>
              {searchQuery || selectedCategory !== "All"
                ? "No matching services found"
                : "No services available yet"}
            </h3>
            <p>
              {searchQuery || selectedCategory !== "All"
                ? "Try adjusting your search keyword or selected category filter."
                : "Providers haven't added any services yet. Check back soon!"}
            </p>
          </div>
        )}

        {/* Service Grid */}
        {!loading && !error && filteredServices.length > 0 && (
          <div className="service-grid">
            {filteredServices.map((service) => (
              <article className="service-card" key={service._id}>
                <div className="service-image">
                  <img
                    src={getServiceImage(service)}
                    alt={service.name}
                    loading="lazy"
                  />
                  <div className="service-image-overlay">
                    <span className="service-category-badge">{service.category || "General"}</span>
                    <span className="service-status">Available</span>
                  </div>
                </div>

                <div className="service-card-content">
                  <div className="service-card-top">
                    <div className="service-icon">✦</div>
                    <span className="provider-tag">By {getProviderName(service)}</span>
                  </div>

                  <h3>{service.name}</h3>

                  <p className="service-description-preview">
                    {service.description || "Professional service available for booking."}
                  </p>

                  <div className="service-info">
                    <div>
                      <span>Price</span>
                      <strong style={{ color: "#e2a15d" }}>${service.price}</strong>
                    </div>

                    <div>
                      <span>Duration</span>
                      <strong>{service.duration} min</strong>
                    </div>
                  </div>

                  <div className="service-actions-row">
                    <button
                      type="button"
                      className="view-details-button"
                      onClick={() => setSelectedService(service)}
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      className="book-service-button"
                      onClick={() => navigate(`/services/${service._id}/book`)}
                    >
                      <span>Book Now</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Service Details Modal */}
      {selectedService && (
        <div className="modal-overlay" onClick={() => setSelectedService(null)}>
          <div className="modal-card service-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="hero-badge">✦ SERVICE DETAILS</span>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setSelectedService(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ borderRadius: "14px", overflow: "hidden", height: "180px", marginBottom: "16px", position: "relative" }}>
              <img
                src={getServiceImage(selectedService)}
                alt={selectedService.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{ position: "absolute", bottom: "10px", left: "10px" }}>
                <span className="service-category-badge">{selectedService.category || "General"}</span>
              </div>
            </div>

            <h2>{selectedService.name}</h2>
            <p className="service-modal-provider">
              Provided by <strong>{getProviderName(selectedService)}</strong>
            </p>

            <div className="service-modal-body">
              <p className="service-modal-desc">{selectedService.description}</p>

              <div className="service-modal-stats">
                <div className="modal-stat">
                  <span>Price</span>
                  <strong style={{ color: "#e2a15d" }}>${selectedService.price}</strong>
                </div>
                <div className="modal-stat">
                  <span>Duration</span>
                  <strong>{selectedService.duration} Minutes</strong>
                </div>
                <div className="modal-stat">
                  <span>Status</span>
                  <strong style={{ color: "#10b981" }}>Active & Available</strong>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setSelectedService(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="primary-action-btn"
                onClick={() => {
                  setSelectedService(null);
                  navigate(`/services/${selectedService._id}/book`);
                }}
              >
                Schedule Appointment →
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Customer;