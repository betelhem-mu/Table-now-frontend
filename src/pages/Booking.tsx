import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useToast } from "../context/ToastContext";
import type { Service } from "../types";

interface ServiceResponse {
  service: Service;
}

interface BookingResponse {
  message: string;
  booking: {
    _id: string;
    customer: string;
    service: string;
    provider: string;
    date: string;
    status: string;
  };
}

const PRESET_TIME_SLOTS = [
  "09:00",
  "10:30",
  "12:00",
  "14:00",
  "15:30",
  "17:00",
];

const DEFAULT_IMAGES: Record<string, string> = {
  "Beauty & Wellness": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
  "Education & Coaching": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80",
  "Tech & Business": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=900&q=80",
  "Health & Fitness": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80",
  Automotive: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=900&q=80",
  General: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80",
};

const Booking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const loadService = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        if (!id) {
          setError("Service ID is missing.");
          return;
        }

        const data = await apiRequest<ServiceResponse>(`/services/${id}`, {
          method: "GET",
          token,
        });

        setService(data.service);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unable to load this service.";
        setError(msg);
        addToast(msg, "error");
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [id, navigate, addToast]);

  const handleBooking = async () => {
    setError("");
    setSuccess("");

    if (!date || !time) {
      const msg = "Please select both a date and a time slot for your appointment.";
      setError(msg);
      addToast(msg, "warning");
      return;
    }

    const selectedDate = new Date(`${date}T${time}`);

    if (Number.isNaN(selectedDate.getTime())) {
      const msg = "Please select a valid date and time.";
      setError(msg);
      addToast(msg, "warning");
      return;
    }

    if (selectedDate <= new Date()) {
      const msg = "Appointment date and time must be in the future.";
      setError(msg);
      addToast(msg, "warning");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!id) {
      setError("Service ID is missing.");
      return;
    }

    try {
      setBooking(true);

      const data = await apiRequest<BookingResponse>("/bookings", {
        method: "POST",
        body: JSON.stringify({
          serviceId: id,
          date: selectedDate.toISOString(),
          time,
        }),
        token,
      });

      const succMsg = data.message || "Appointment booked successfully!";
      setSuccess(succMsg);
      addToast(succMsg, "success");

      setTimeout(() => {
        navigate("/customer/bookings");
      }, 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to create booking.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <main className="booking-page">
        <div className="booking-state">
          <div className="loading-spinner"></div>
          <p>Loading service details...</p>
        </div>
      </main>
    );
  }

  if (error && !service) {
    return (
      <main className="booking-page">
        <div className="booking-state">
          <div className="state-icon">!</div>
          <h2>Unable to load service</h2>
          <p>{error}</p>
          <button type="button" onClick={() => navigate("/customer")}>
            Back to services catalog
          </button>
        </div>
      </main>
    );
  }

  if (!service) {
    return null;
  }

  const providerName =
    typeof service.provider === "string"
      ? service.provider
      : service.provider?.name || "Provider";

  const getServiceImage = (): string => {
    if (service.image && service.image.trim().startsWith("http")) {
      return service.image.trim();
    }
    const cat = service.category || "General";
    return DEFAULT_IMAGES[cat] || DEFAULT_IMAGES.General;
  };

  return (
    <main className="booking-page">
      <div className="booking-background-glow booking-glow-one"></div>
      <div className="booking-background-glow booking-glow-two"></div>

      {/* Navigation Header */}
      <nav className="booking-navbar">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/customer")}
        >
          ← Back to Services
        </button>

        <div className="booking-brand" onClick={() => navigate("/customer")} style={{ cursor: "pointer" }}>
          <div className="brand-icon">B</div>
          <div>
            <strong>BookEasy</strong>
            <span>Smart booking</span>
          </div>
        </div>
      </nav>

      {/* Booking Main Content */}
      <section className="booking-content">
        {/* Left Column: Service Information Card */}
        <div className="booking-service-card">
          <div className="booking-service-image" style={{ height: "220px", position: "relative", overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
            <img
              src={getServiceImage()}
              alt={service.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div style={{ position: "absolute", top: "12px", left: "12px" }}>
              <span className="service-category-badge">{service.category || "General"}</span>
            </div>
          </div>

          <div className="booking-service-details">
            <span className="booking-label">SERVICE SUMMARY</span>
            <h1>{service.name}</h1>
            <p className="booking-description">{service.description}</p>

            <div className="booking-service-info">
              <div>
                <span>Price</span>
                <strong style={{ color: "#e2a15d" }}>${service.price}</strong>
              </div>

              <div>
                <span>Duration</span>
                <strong>{service.duration} min</strong>
              </div>
            </div>

            <div className="booking-provider">
              <span>Service Provider</span>
              <strong>{providerName}</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Date & Time Choice Form */}
        <div className="booking-form-card">
          <div className="booking-form-heading">
            <span>CHOOSE DATE & TIME</span>
            <h2>Schedule your Appointment</h2>
            <p>Select your preferred appointment date and time slot below.</p>
          </div>

          <div className="booking-fields">
            {/* Date Selection */}
            <div className="booking-field">
              <label htmlFor="booking-date">1. Select Appointment Date</label>
              <input
                id="booking-date"
                type="date"
                value={date}
                min={todayStr}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>

            {/* Time Slot Selection */}
            <div className="booking-field">
              <label htmlFor="booking-time">2. Choose Time Slot</label>

              {/* Quick Preset Time Slot Buttons */}
              <div className="time-slots-grid">
                {PRESET_TIME_SLOTS.map((slot) => {
                  const [h, m] = slot.split(":");
                  const hourNum = parseInt(h, 10);
                  const period = hourNum >= 12 ? "PM" : "AM";
                  const displayHour = hourNum % 12 || 12;
                  const displayTime = `${displayHour}:${m} ${period}`;
                  const isSelected = time === slot;

                  return (
                    <button
                      key={slot}
                      type="button"
                      className={`time-slot-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => setTime(slot)}
                    >
                      {displayTime}
                    </button>
                  );
                })}
              </div>

              <span className="input-hint" style={{ marginTop: "0.5rem", display: "block" }}>
                Or select custom time:
              </span>
              <input
                id="booking-time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
          </div>

          {/* Selected Booking Summary */}
          {date && time && (
            <div className="booking-summary-box">
              <h4>Appointment Details Summary</h4>
              <p>
                <strong>Service:</strong> {service.name} (${service.price})
              </p>
              <p>
                <strong>Date & Time:</strong> {new Date(`${date}T${time}`).toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          {/* Error & Success Messages */}
          {error && (
            <div className="booking-message booking-error">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="booking-message booking-success">
              <span>✓</span>
              <p>{success} Redirecting to your bookings...</p>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            className="confirm-booking-button"
            onClick={handleBooking}
            disabled={booking}
          >
            {booking ? (
              <>
                <span className="button-spinner"></span>
                Processing Booking...
              </>
            ) : (
              <>
                Confirm & Book Appointment <span>→</span>
              </>
            )}
          </button>

          <p className="booking-note">
            Your appointment will be saved under <strong>My Bookings</strong> instantly.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Booking;