import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
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

const Booking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

        const data = await apiRequest<ServiceResponse>(
          `/services/${id}`,
          {
            method: "GET",
            token,
          }
        );

        setService(data.service);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load this service."
        );
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [id, navigate]);

  const handleBooking = async () => {
    setError("");
    setSuccess("");

    if (!date || !time) {
      setError("Please select a date and time.");
      return;
    }

    const selectedDate = new Date(`${date}T${time}`);

    if (Number.isNaN(selectedDate.getTime())) {
      setError("Please select a valid date and time.");
      return;
    }

    if (selectedDate <= new Date()) {
      setError("Please select a future date and time.");
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
        }),
        token,
      });

      setSuccess(data.message);

      setTimeout(() => {
        navigate("/customer/bookings");
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create booking."
      );
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <main className="booking-page">
        <div className="booking-state">
          <div className="loading-spinner"></div>
          <p>Loading service...</p>
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

          <button
            type="button"
            onClick={() => navigate("/customer")}
          >
            Back to services
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
      : service.provider.name;

  return (
    <main className="booking-page">
      <div className="booking-background-glow booking-glow-one"></div>
      <div className="booking-background-glow booking-glow-two"></div>

      <nav className="booking-navbar">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/customer")}
        >
          ← Back to services
        </button>

        <div className="booking-brand">
          <div className="brand-icon">B</div>

          <div>
            <strong>BookEasy</strong>
            <span>Smart booking</span>
          </div>
        </div>
      </nav>

      <section className="booking-content">
        <div className="booking-service-card">
          <div className="booking-service-image">
            <div className="booking-service-placeholder">
              ✦
            </div>
          </div>

          <div className="booking-service-details">
            <span className="booking-label">
              SERVICE
            </span>

            <h1>{service.name}</h1>

            <p className="booking-description">
              {service.description}
            </p>

            <div className="booking-service-info">
              <div>
                <span>Price</span>
                <strong>{service.price}</strong>
              </div>

              <div>
                <span>Duration</span>
                <strong>{service.duration} min</strong>
              </div>
            </div>

            <div className="booking-provider">
              <span>Provided by</span>

              <strong>{providerName}</strong>
            </div>
          </div>
        </div>

        <div className="booking-form-card">
          <div className="booking-form-heading">
            <span>BOOK APPOINTMENT</span>

            <h2>Choose your time</h2>

            <p>
              Select a date and time that works for you.
            </p>
          </div>

          <div className="booking-fields">
            <div className="booking-field">
              <label htmlFor="booking-date">
                Date
              </label>

              <input
                id="booking-date"
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(event) =>
                  setDate(event.target.value)
                }
              />
            </div>

            <div className="booking-field">
              <label htmlFor="booking-time">
                Time
              </label>

              <input
                id="booking-time"
                type="time"
                value={time}
                onChange={(event) =>
                  setTime(event.target.value)
                }
              />
            </div>
          </div>

          {error && (
            <div className="booking-message booking-error">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="booking-message booking-success">
              <span>✓</span>
              <p>{success}</p>
            </div>
          )}

          <button
            type="button"
            className="confirm-booking-button"
            onClick={handleBooking}
            disabled={booking}
          >
            {booking ? (
              <>
                <span className="button-spinner"></span>
                Confirming booking...
              </>
            ) : (
              <>
                Confirm booking
                <span>→</span>
              </>
            )}
          </button>

          <p className="booking-note">
            Your booking will be saved securely to your
            BookEasy account.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Booking;