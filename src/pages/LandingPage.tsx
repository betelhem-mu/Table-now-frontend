import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import "./LandingPage.css";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Dark / Light theme state linked with system attribute data-theme
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("provider_theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("provider_theme", theme);
    localStorage.setItem("customer_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Check logged in user status
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  const handleBookAppointment = () => {
    if (user?.role === "customer") {
      navigate("/customer");
    } else {
      navigate("/login");
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
          {/* Theme Toggle Button */}
          <button
            type="button"
            className="landing-theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>

          {user ? (
            <button
              className="btn-primary-action"
              onClick={() => navigate(user.role === "provider" ? "/provider" : "/customer")}
            >
              Dashboard &rarr;
            </button>
          ) : (
            <>
              <button className="btn-secondary-action" onClick={() => navigate("/login")}>
                Login
              </button>
              <button className="btn-primary-action" onClick={() => navigate("/register")}>
                Get Started
              </button>
            </>
          )}
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

        <div className="hero-btn-group">
          <button className="btn-hero-primary" onClick={handleBookAppointment}>
            Book an Appointment
          </button>
        </div>
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

        <div className="services-cards-grid">
          {/* Service Card 1 */}
          <div className="service-card">
            <div className="service-image-header">
              <img
                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80"
                alt="Barber Services"
                className="service-card-img"
              />
              <span className="service-emoji-badge">💈</span>
            </div>
            <div className="service-card-body">
              <div className="service-title-row">
                <h3>Barber Services</h3>
              </div>
              <p className="service-desc">
                Professional haircuts, beard trimming, line-ups, and modern styling tailored for you.
              </p>
              <div className="service-meta-row">
                <button className="service-book-btn" onClick={handleBookAppointment}>
                  Book Now
                </button>
              </div>
            </div>
          </div>

          {/* Service Card 2 */}
          <div className="service-card">
            <div className="service-image-header">
              <img
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80"
                alt="Tutoring"
                className="service-card-img"
              />
              <span className="service-emoji-badge">🎓</span>
            </div>
            <div className="service-card-body">
              <div className="service-title-row">
                <h3>Tutoring</h3>
              </div>
              <p className="service-desc">
                One-on-one academic instruction, coding guidance, and test prep for all student levels.
              </p>
              <div className="service-meta-row">
                <button className="service-book-btn" onClick={handleBookAppointment}>
                  Book Now
                </button>
              </div>
            </div>
          </div>

          {/* Service Card 3 */}
          <div className="service-card">
            <div className="service-image-header">
              <img
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80"
                alt="Salon Appointments"
                className="service-card-img"
              />
              <span className="service-emoji-badge">💇</span>
            </div>
            <div className="service-card-body">
              <div className="service-title-row">
                <h3>Salon Appointments</h3>
              </div>
              <p className="service-desc">
                Luxury hair coloring, skin treatments, hair care, and relaxing spa sessions.
              </p>
              <div className="service-meta-row">
                <button className="service-book-btn" onClick={handleBookAppointment}>
                  Book Now
                </button>
              </div>
            </div>
          </div>

          {/* Service Card 4 */}
          <div className="service-card">
            <div className="service-image-header">
              <img
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80"
                alt="Consulting"
                className="service-card-img"
              />
              <span className="service-emoji-badge">💼</span>
            </div>
            <div className="service-card-body">
              <div className="service-title-row">
                <h3>Consulting</h3>
              </div>
              <p className="service-desc">
                Expert business strategy, career development advice, and financial planning sessions.
              </p>
              <div className="service-meta-row">
                <button className="service-book-btn" onClick={handleBookAppointment}>
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
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
              <li>📧 <span>support@bookeasy.com</span></li>
              <li>📞 <span>+1 (800) 555-BOOK</span></li>
              <li>📍 <span>100 Innovation Way, Suite 400</span></li>
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
