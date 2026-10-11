import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { apiRequest } from "../services/api";
import { useToast } from "../context/ToastContext";
import { getServiceImage } from "../utils/serviceUtils";
import type { Service } from "../types";
import "./LandingPage.css";

const CATEGORY_EMOJIS: Record<string, string> = {
  "Beauty & Wellness": "💆",
  "Education & Coaching": "🎓",
  "Tech & Business": "💼",
  "Health & Fitness": "🏃",
  "Automotive": "🚗",
  General: "✦",
};

const getCategoryEmoji = (category?: string) => {
  if (!category) return "✦";
  return CATEGORY_EMOJIS[category] || "✦";
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Dark / Light theme state linked with system attribute data-theme
  const [theme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("provider_theme") as "dark" | "light") || "dark";
  });

  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("provider_theme", theme);
    localStorage.setItem("customer_theme", theme);
  }, [theme]);

  useEffect(() => {
    let isMounted = true;
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const data = await apiRequest<{ services: Service[] }>("/services");
        if (isMounted) {
          setServices(data.services || []);
        }
      } catch (err) {
        console.error("Failed to fetch services for landing page:", err);
        if (isMounted) {
          setServices([]);
        }
      } finally {
        if (isMounted) {
          setLoadingServices(false);
        }
      }
    };

    fetchServices();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleBookService = (serviceId: string) => {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");
    let currentUser: { role?: string } | null = null;

    try {
      if (token && userJson) {
        currentUser = JSON.parse(userJson);
      }
    } catch {
      currentUser = null;
    }

    if (!token || !currentUser) {
      addToast("Please log in to continue booking this service.", "info");
      navigate("/login", {
        state: {
          from: `/services/${serviceId}/book`,
          message: "Please log in to continue booking this service.",
        },
      });
      return;
    }

    if (currentUser.role === "admin") {
      navigate("/admin");
    } else if (currentUser.role === "provider") {
      navigate("/provider");
    } else {
      navigate(`/services/${serviceId}/book`);
    }
  };

  return (
    <div className="landing-page-wrapper" id="home">
      {/* Background Decorative Glows */}
      <div className="landing-glow glow-top"></div>
      <div className="landing-glow glow-bottom"></div>

      {/* 1. Navigation Bar */}
      <nav className="landing-navbar">
        <div className="navbar-left" onClick={() => navigate("/")}>
          <Logo size={36} />
          <span className="brand-name">BookEasy</span>
        </div>

        <div className="navbar-links">
          <a href="#home" className="nav-item">Home</a>
          <a href="#how-it-works" className="nav-item">How It Works</a>
          <a href="#services" className="nav-item">Services</a>
        </div>

        <div className="navbar-right">
          <button className="btn-secondary-action" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="btn-primary-action" onClick={() => navigate("/register")}>
            Get Started
          </button>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="landing-hero">
        <div className="hero-badge">
          <span className="sparkle-icon">✨</span> Smart & Effortless Appointments
        </div>

        <h1 className="hero-heading">
          Your Time Matters. <br />
          <span className="hero-gradient-text">Book It Easily.</span>
        </h1>

        <p className="hero-description">
          Discover the services you need and book your appointments online in just a few clicks. Whether you need a barber, tutor, consultant, or salon service, BookEasy helps you find suitable services and schedule appointments conveniently. Service providers can also create and manage their services, view customer bookings, and organize their schedules in one place.
        </p>

      </section>

      {/* 3. Popular Services Section */}
      <section className="landing-services" id="services">
        <div className="section-header-center">
          <span className="section-badge">Featured Offerings</span>
          <h2 className="section-main-heading">Popular Services</h2>
          <p className="section-sub-heading">
            Explore top categories available for instant online booking today.
          </p>
        </div>

        {loadingServices ? (
          <div className="services-loading-state">
            <div className="landing-spinner"></div>
            <p>Loading available services...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="services-empty-state">
            <span className="empty-icon">✦</span>
            <h3>No Services Currently Available</h3>
            <p>Providers haven't published any services yet. Please check back soon!</p>
          </div>
        ) : (
          <div className="services-cards-grid">
            {services.map((service) => (
              <div className="service-card" key={service._id}>
                <div className="service-image-header">
                  <img
                    src={getServiceImage(service)}
                    alt={service.name}
                    className="service-card-img"
                    loading="lazy"
                  />
                  <span className="service-emoji-badge">
                    {getCategoryEmoji(service.category)}
                  </span>
                </div>
                <div className="service-card-body">
                  <div className="service-title-row">
                    <h3>{service.name}</h3>
                  </div>
                  <p className="service-desc">
                    {service.description || "Professional service available for booking."}
                  </p>
                  <div className="service-meta-row">
                    <button
                      className="service-book-btn"
                      onClick={() => handleBookService(service._id)}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. How BookEasy Works Section */}
      <section className="landing-how-it-works" id="how-it-works">
        <div className="section-header-center">
          <span className="section-badge">Step-by-step</span>
          <h2 className="section-main-heading">How BookEasy Works</h2>
          <p className="section-sub-heading">
            Booking your appointments or managing your business is fast and straightforward.
          </p>
        </div>

        <div className="how-steps-grid">
          <div className="how-step-card">
            <div className="step-circle">1</div>
            <h3>Browse Available Services</h3>
            <p>
              Explore a wide selection of top-rated service providers, view service details, duration, and pricing options.
            </p>
          </div>

          <div className="how-step-card">
            <div className="step-circle">2</div>
            <h3>Choose a Date and Time</h3>
            <p>
              Select your preferred appointment slot seamlessly with our real-time availability calendar.
            </p>
          </div>

          <div className="how-step-card">
            <div className="step-circle">3</div>
            <h3>Confirm & Manage Appointment</h3>
            <p>
              Receive instant booking confirmation and easily track, manage, or complete your appointments from your dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="landing-footer">
        <div className="footer-top-grid">
          <div className="footer-col-brand">
            <div className="footer-brand-title">
              <Logo size={28} /> BookEasy
            </div>
            <p className="footer-description">
              BookEasy simplifies appointment scheduling for customers and empowers service providers to manage their business with ease.
            </p>
          </div>

          <div className="footer-col-links">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="/login" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>Login</a></li>
              <li><a href="/register" onClick={(e) => { e.preventDefault(); navigate("/register"); }}>Get Started</a></li>
            </ul>
          </div>

          <div className="footer-col-contact">
            <h4>Contact Us</h4>
            <ul className="contact-list">
              <li>📧 <span>example@bookeasy.com</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>&copy; {new Date().getFullYear()} BookEasy Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
