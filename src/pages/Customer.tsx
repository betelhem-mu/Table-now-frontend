import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import type { Service } from "../types";

interface ServicesResponse {
  services: Service[];
}

const Customer = () => {
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

          if (!token) {
            navigate("/login");
            return;
          }

        const data = await apiRequest<ServicesResponse>("/services", {
          token,
        });;

        setServices(data.services);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load services."
        );
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <main className="customer-page">
      <nav className="customer-navbar">
        <div className="customer-brand">
          <div className="brand-icon">B</div>

          <div>
            <strong>BookEasy</strong>
            <span>Smart booking</span>
          </div>
        </div>

        <div className="customer-nav-links">
          <button type="button">Home</button>

          <button
            type="button"
            onClick={() =>
              document
                .getElementById("services")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Services
          </button>

          <button
            type="button"
            onClick={() => navigate("/customer/bookings")}
          >
            My Bookings
          </button>
        </div>

        <div className="customer-user-area">
          <div className="customer-user">
            <div className="user-avatar">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div>
              <strong>{user.name || "Customer"}</strong>
              <span>Customer</span>
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

      <section className="customer-hero">
        <div className="customer-hero-content">
          <span className="hero-badge">
            ✦ Simple. Smart. BookEasy.
          </span>

          <h1>
            Find the right service.
            <span> Book it with ease.</span>
          </h1>

          <p>
            Discover services from trusted providers and book
            your appointment in just a few clicks.
          </p>

          <button
            type="button"
            className="hero-action"
            onClick={() =>
              document
                .getElementById("services")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Explore services
            <span>→</span>
          </button>
        </div>

        <div className="hero-decoration">
          <div className="hero-circle hero-circle-one"></div>
          <div className="hero-circle hero-circle-two"></div>

          <div className="hero-booking-card">
            <div className="mini-card-top">
              <span>Available now</span>
              <span className="status-dot"></span>
            </div>

            <h3>Book your time</h3>

            <div className="mini-card-row">
              <span>Available services</span>
              <strong>{services.length}</strong>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="services-section">
        <div className="section-heading">
          <div>
            <span>DISCOVER</span>
            <h2>Available services</h2>
          </div>

          <p>
            Choose a service that fits your needs and schedule
            your appointment.
          </p>
        </div>

        {loading && (
          <div className="services-state">
            <div className="loading-spinner"></div>
            <p>Finding available services...</p>
          </div>
        )}

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

        {!loading && !error && services.length === 0 && (
          <div className="services-state">
            <div className="state-icon">+</div>

            <h3>No services available yet</h3>

            <p>
              Providers haven't added any services yet.
            </p>
          </div>
        )}

        {!loading && !error && services.length > 0 && (
          <div className="service-grid">
            {services.map((service) => (
              <article className="service-card" key={service._id}>
                <div className="service-card-top">
                  <div className="service-icon">✦</div>

                  <span className="service-status">
                    Available
                  </span>
                </div>

                <h3>{service.name}</h3>

                <p>{service.description}</p>

                <div className="service-info">
                  <div>
                    <span>Price</span>
                    <strong>{service.price}</strong>
                  </div>

                  <div>
                    <span>Duration</span>
                    <strong>{service.duration} min</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="book-service-button"
                  onClick={() =>
                    navigate(`/services/${service._id}/book`)
                  }
                >
                  Book now
                  <span>→</span>
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Customer;