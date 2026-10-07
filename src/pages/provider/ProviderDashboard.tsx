import { useEffect, useState, useRef } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { getServiceImage } from "../../utils/serviceUtils";
import type { Booking, Service } from "../../types";

interface ServicesResponse {
  services: Service[];
}

interface ProviderBookingsResponse {
  bookings: Booking[];
}

const CATEGORIES = [
  "Beauty & Wellness",
  "Education & Coaching",
  "Tech & Business",
  "Health & Fitness",
  "Automotive",
  "General",
];

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<"services" | "appointments">("services");
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Service Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields & Validation
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationHours, setDurationHours] = useState("0");
  const [durationMins, setDurationMins] = useState("30");
  const [category, setCategory] = useState("Beauty & Wellness");
  const [image, setImage] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Action loading state for completing booking or deleting service
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Settings panel
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingName, setSettingName] = useState("");
  const [settingProfileImage, setSettingProfileImage] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const settingsRef = useRef<HTMLDivElement>(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Load theme + settings from localStorage
  useEffect(() => {
    const savedTheme = (localStorage.getItem("provider_theme") || "dark") as "dark" | "light";
    const savedProfile = localStorage.getItem("provider_profile_image") || "";
    const savedName = localStorage.getItem("provider_display_name") || currentUser.name || "";
    setTheme(savedTheme);
    setSettingProfileImage(savedProfile);
    setSettingName(savedName);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // Close settings when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const applyTheme = (t: "dark" | "light") => {
    setTheme(t);
    localStorage.setItem("provider_theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };

  const handleSettingNameSave = () => {
    localStorage.setItem("provider_display_name", settingName.trim());
    setIsSettingsOpen(false);
  };

  const handleSettingProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setSettingProfileImage(result);
      localStorage.setItem("provider_profile_image", result);
    };
    reader.readAsDataURL(file);
  };

  const displayName = localStorage.getItem("provider_display_name") || currentUser.name || "Service Provider";

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // 1. Fetch provider's services
      const servicesData = await apiRequest<ServicesResponse>("/services", { token });
      const providerServices = (servicesData.services || []).filter((s) => {
        if (!s.provider) return true;
        const providerId = typeof s.provider === "string" ? s.provider : s.provider._id;
        return providerId === currentUser.id || !providerId;
      });
      setServices(providerServices);

      // 2. Fetch provider's bookings
      try {
        const bookingsData = await apiRequest<ProviderBookingsResponse>("/bookings/provider", { token });
        setBookings(bookingsData.bookings || []);
      } catch {
        setBookings([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard data.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    addToast("Logged out successfully.", "info");
    navigate("/login");
  };

  // Handle file upload -> convert & compress to Base64
  const handleImageFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setFormError("Selected image file is too large (max 10MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
          setImage(compressedBase64);
          setFormError("");
        } else if (typeof event.target?.result === "string") {
          setImage(event.target.result);
          setFormError("");
        }
      };
      if (typeof event.target?.result === "string") {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Open modal for Create or Edit
  const openCreateModal = () => {
    setEditingService(null);
    setName("");
    setDescription("");
    setPrice("");
    setIsFree(false);
    setDurationHours("0");
    setDurationMins("30");
    setCategory("Beauty & Wellness");
    setImage("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description);
    const free = service.price === 0;
    setIsFree(free);
    setPrice(free ? "" : service.price.toString());
    const totalMins = service.duration || 0;
    setDurationHours(String(Math.floor(totalMins / 60)));
    setDurationMins(String(totalMins % 60));
    setCategory(service.category || "Beauty & Wellness");
    setImage(service.image || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setFormError("");
  };

  // Form Submit (Create or Update Service)
  const handleServiceFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Service name is required.");
      return;
    }

    if (!description.trim()) {
      setFormError("Service description is required.");
      return;
    }

    const numPrice = isFree ? 0 : Number(price);
    if (!isFree && (price === "" || Number.isNaN(numPrice) || numPrice < 0)) {
      setFormError("Please enter a valid price (minimum $0).");
      return;
    }

    const numDuration = (Number(durationHours) || 0) * 60 + (Number(durationMins) || 0);
    if (numDuration < 1) {
      setFormError("Please enter a valid duration (at least 1 minute).");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      if (editingService) {
        // UPDATE Service
        await apiRequest<{ message: string; service: Service }>(`/services/${editingService._id}`, {
          method: "PUT",
          token,
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            price: numPrice,
            duration: numDuration,
            category,
            image: image.trim(),
          }),
        });

        addToast(`Service "${name.trim()}" updated successfully!`, "success");
      } else {
        // CREATE Service
        await apiRequest<{ message: string; service: Service }>("/services", {
          method: "POST",
          token,
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            price: numPrice,
            duration: numDuration,
            category,
            image: image.trim(),
          }),
        });

        addToast(`Service "${name.trim()}" created successfully!`, "success");
      }

      closeModal();
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save service.";
      setFormError(msg);
      addToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Service
  const handleDeleteService = async (serviceId: string) => {
    try {
      setActionLoadingId(serviceId);
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      await apiRequest<{ message: string }>(`/services/${serviceId}`, {
        method: "DELETE",
        token,
      });

      addToast("Service deleted successfully.", "success");
      setDeleteConfirmId(null);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete service.";
      addToast(msg, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Complete Booking Action
  const handleCompleteBooking = async (bookingId: string) => {
    try {
      setActionLoadingId(bookingId);
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      await apiRequest<{ message: string }>(`/bookings/${bookingId}/complete`, {
        method: "PUT",
        token,
      });

      addToast("Appointment marked as completed!", "success");
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to complete booking.";
      addToast(msg, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getCustomerName = (booking: Booking): string => {
    if (!booking.customer) return "Customer";
    if (typeof booking.customer === "string") return booking.customer;
    return booking.customer.name || booking.customer.email || "Customer";
  };

  const getServiceName = (booking: Booking): string => {
    if (!booking.service) return "Service";
    if (typeof booking.service === "string") return "Service";
    return booking.service.name || "Service";
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

  const scheduledBookings = bookings.filter((b) => b.status === "scheduled");
  const completedBookings = bookings.filter((b) => b.status === "completed");

  return (
    <main className="customer-page">
      {/* Navigation Bar */}
      <nav className="customer-navbar">
        <div className="customer-brand">
          <div className="brand-icon">P</div>
          <div>
            <strong>BookEasy Provider</strong>
            <span>Service Management</span>
          </div>
        </div>


        <div className="customer-user-area">
          {/* Settings gear */}
          <div className="settings-wrapper" ref={settingsRef}>
            <button
              type="button"
              className="settings-gear-btn"
              onClick={() => setIsSettingsOpen((o) => !o)}
              title="Settings"
            >
              ⚙️
            </button>

            {isSettingsOpen && (
              <div className="settings-dropdown">
                <div className="settings-section-title">Settings</div>

                {/* Profile Photo */}
                <div className="settings-section">
                  <label className="settings-label">Profile Photo</label>
                  <div className="settings-avatar-row">
                    <div className="settings-avatar-preview">
                      {settingProfileImage
                        ? <img src={settingProfileImage} alt="Profile" />
                        : <span>{displayName.charAt(0).toUpperCase()}</span>
                      }
                    </div>
                    <label className="settings-upload-btn">
                      📁 Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleSettingProfileUpload}
                      />
                    </label>
                    {settingProfileImage && (
                      <button
                        type="button"
                        className="settings-remove-btn"
                        onClick={() => { setSettingProfileImage(""); localStorage.removeItem("provider_profile_image"); }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit Name */}
                <div className="settings-section">
                  <label className="settings-label">Display Name</label>
                  <div className="settings-name-row">
                    <input
                      type="text"
                      className="settings-name-input"
                      value={settingName}
                      onChange={(e) => setSettingName(e.target.value)}
                      placeholder="Your name"
                    />
                    <button
                      type="button"
                      className="settings-save-btn"
                      onClick={handleSettingNameSave}
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Dark / Light Mode */}
                <div className="settings-section">
                  <label className="settings-label">Theme</label>
                  <div className="settings-theme-row">
                    <button
                      type="button"
                      className={`settings-theme-btn ${theme === "dark" ? "active" : ""}`}
                      onClick={() => applyTheme("dark")}
                    >
                      🌙 Dark
                    </button>
                    <button
                      type="button"
                      className={`settings-theme-btn ${theme === "light" ? "active" : ""}`}
                      onClick={() => applyTheme("light")}
                    >
                      ☀️ Light
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="customer-user">
            <div
              className="user-avatar"
              style={settingProfileImage ? { padding: 0, overflow: "hidden" } : { background: "linear-gradient(135deg, #38bdf8, #1d4ed8)" }}
            >
              {settingProfileImage
                ? <img src={settingProfileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : displayName.charAt(0).toUpperCase() || "P"
              }
            </div>
            <div>
              <strong>{displayName}</strong>
              <span>Provider Account</span>
            </div>
          </div>

          <button type="button" className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <section className="my-bookings-container">
        {/* Header Banner */}
        <div className="my-bookings-header">
          <div>
            <span className="hero-badge">✦ PROVIDER CONTROL CENTER</span>
            <h1>Manage Services & Customer Appointments</h1>
            <p>
              Create and manage your professional service catalog, track client bookings, and mark appointments as completed.
            </p>
          </div>

          <button type="button" className="primary-action-btn" onClick={openCreateModal}>
            + Create New Service
          </button>
        </div>

        {/* Stats Grid */}
        <div className="bookings-stats-grid">
          <div className="stat-card">
            <span className="stat-icon">🛠️</span>
            <div>
              <span className="stat-label">Active Services</span>
              <strong className="stat-value">{services.length}</strong>
            </div>
          </div>

          <div className="stat-card stat-card-upcoming">
            <span className="stat-icon">📅</span>
            <div>
              <span className="stat-label">Scheduled Appointments</span>
              <strong className="stat-value">{scheduledBookings.length}</strong>
            </div>
          </div>

          <div className="stat-card stat-card-completed">
            <span className="stat-icon">✓</span>
            <div>
              <span className="stat-label">Completed Services</span>
              <strong className="stat-value">{completedBookings.length}</strong>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">👥</span>
            <div>
              <span className="stat-label">Total Client Bookings</span>
              <strong className="stat-value">{bookings.length}</strong>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="bookings-control-bar">
          <div className="bookings-tabs">
            <button
              type="button"
              className={`tab-btn ${activeTab === "services" ? "active" : ""}`}
              onClick={() => setActiveTab("services")}
            >
              My Offered Services ({services.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "appointments" ? "active" : ""}`}
              onClick={() => setActiveTab("appointments")}
            >
              Client Appointments ({bookings.length})
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="services-state">
            <div className="loading-spinner"></div>
            <p>Loading your provider dashboard...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="services-state error-state">
            <div className="state-icon">!</div>
            <h3>Unable to load dashboard</h3>
            <p>{error}</p>
            <button type="button" onClick={loadData}>
              Try again
            </button>
          </div>
        )}

        {/* TAB 1: SERVICES MANAGEMENT */}
        {!loading && !error && activeTab === "services" && (
          <div>
            {services.length === 0 ? (
              <div className="services-state">
                <div className="state-icon">🛠️</div>
                <h3>No services offered yet</h3>
                <p>Add your first service to start accepting customer bookings.</p>
                <button type="button" className="primary-action-btn" onClick={openCreateModal}>
                  + Create First Service
                </button>
              </div>
            ) : (
              <div className="service-grid">
                {services.map((service) => (
                  <article className="service-card" key={service._id}>
                    <div className="service-image">
                      <img
                        src={getServiceImage(service)}
                        alt={service.name}
                        loading="lazy"
                      />
                      <div className="service-image-overlay">
                        <span className="service-category-badge">{service.category || "General"}</span>
                        <span className="service-status">Active</span>
                      </div>
                    </div>

                    <div className="service-card-content">
                      <div className="service-card-top">
                        <div className="service-icon">✦</div>
                        <span className="provider-tag">Provider Service</span>
                      </div>

                      <h3>{service.name}</h3>
                      <p className="service-description-preview">{service.description}</p>

                      <div className="service-info">
                        <div>
                          <span>Price</span>
                          <strong style={{ color: service.price === 0 ? "#4ade80" : "#e2a15d" }}>
                            {service.price === 0 ? "Free" : `$${service.price}`}
                          </strong>
                        </div>
                        <div>
                          <span>Duration</span>
                          <strong>
                            {service.duration >= 60
                              ? `${Math.floor(service.duration / 60)}h${service.duration % 60 > 0 ? ` ${service.duration % 60}m` : ""}`
                              : `${service.duration}m`}
                          </strong>
                        </div>
                      </div>

                      <div className="service-actions-row">
                        <button
                          type="button"
                          className="view-details-button"
                          onClick={() => openEditModal(service)}
                        >
                          ✏️ Edit Service
                        </button>
                        <button
                          type="button"
                          className="cancel-booking-btn"
                          onClick={() => setDeleteConfirmId(service._id)}
                          style={{ marginLeft: "auto" }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: APPOINTMENTS & BOOKINGS */}
        {!loading && !error && activeTab === "appointments" && (
          <div>
            {bookings.length === 0 ? (
              <div className="services-state">
                <div className="state-icon">📅</div>
                <h3>No appointments booked yet</h3>
                <p>When customers book your services, their appointments will appear here.</p>
              </div>
            ) : (
              <div className="bookings-list">
                {bookings.map((booking) => {
                  const { formattedDate, formattedTime } = formatDateTime(booking.date);
                  const customerName = getCustomerName(booking);
                  const serviceName = getServiceName(booking);
                  const isScheduled = booking.status === "scheduled";

                  const displayTime = booking.time || formattedTime;

                  return (
                    <div key={booking._id} className={`booking-card status-${booking.status}`}>
                      <div className="booking-card-header">
                        <div className="booking-service-title-area">
                          <div className="booking-icon-badge">👤</div>
                          <div>
                            <h3>{customerName}</h3>
                            <span className="booking-provider-name">Booked: {serviceName}</span>
                          </div>
                        </div>

                        <span className={`status-pill status-${booking.status}`}>
                          {booking.status === "scheduled" && "Scheduled"}
                          {booking.status === "completed" && "Completed"}
                          {booking.status === "cancelled" && "Cancelled"}
                        </span>
                      </div>

                      <div className="booking-card-details">
                        <div className="detail-item">
                          <span className="detail-label">Date & Time</span>
                          <strong className="detail-value highlighted">
                            🗓️ {formattedDate} at ⏰ {displayTime}
                          </strong>
                        </div>

                        <div className="detail-item">
                          <span className="detail-label">Status</span>
                          <strong className="detail-value" style={{ textTransform: "capitalize" }}>
                            {booking.status}
                          </strong>
                        </div>
                      </div>

                      <div className="booking-card-footer">
                        <span className="booking-id-tag">Booking ID: {booking._id.substring(0, 8)}...</span>

                        {isScheduled && (
                          <button
                            type="button"
                            className="primary-action-btn"
                            style={{ padding: "6px 14px", fontSize: "12px" }}
                            disabled={actionLoadingId === booking._id}
                            onClick={() => handleCompleteBooking(booking._id)}
                          >
                            {actionLoadingId === booking._id ? "Updating..." : "✓ Mark Completed"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Service Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="hero-badge">{editingService ? "✦ EDIT SERVICE" : "✦ CREATE SERVICE"}</span>
              <button type="button" className="close-modal-btn" onClick={closeModal}>
                ✕
              </button>
            </div>

            <h2>{editingService ? "Edit Service Details" : "Add New Service"}</h2>
            <p className="service-modal-provider">
              Fill in the form below to {editingService ? "update your existing service" : "publish a new service for customers to book"}.
            </p>

            <form onSubmit={handleServiceFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              <div className="form-group">
                <label htmlFor="service-name">Service Name *</label>
                <input
                  id="service-name"
                  type="text"
                  placeholder="e.g. Executive Haircut & Beard Trim"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="service-category">Category *</label>
                <select
                  id="service-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#141419",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "10px",
                    color: "#f5f2ed",
                    fontSize: "13px",
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Service Image (Upload File or Enter URL)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {image && (
                    <div style={{ position: "relative", width: "100%", height: "140px", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.15)", background: "#0a0a0f" }}>
                      <img
                        src={getServiceImage({ image, category })}
                        alt="Service preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        onClick={() => setImage("")}
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          background: "rgba(0, 0, 0, 0.75)",
                          color: "#ff6b6b",
                          border: "1px solid rgba(255, 107, 107, 0.4)",
                          borderRadius: "50%",
                          width: "28px",
                          height: "28px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                        }}
                        title="Remove Image"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <label
                      htmlFor="service-image-file"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "9px 16px",
                        background: "linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(29, 78, 216, 0.2))",
                        border: "1px solid rgba(56, 189, 248, 0.4)",
                        borderRadius: "8px",
                        color: "#38bdf8",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      📁 Upload Image File
                      <input
                        id="service-image-file"
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleImageFileUpload}
                      />
                    </label>
                    <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)" }}>or enter URL below</span>
                  </div>

                  <input
                    id="service-image"
                    type="text"
                    placeholder="https://images.unsplash.com/... or paste image link"
                    value={image.startsWith("data:image") ? "[Image File Uploaded]" : image}
                    onChange={(e) => setImage(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="service-desc">Description *</label>
                <textarea
                  id="service-desc"
                  rows={3}
                  placeholder="Describe what is included in this service..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#141419",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "10px",
                    color: "#f5f2ed",
                    fontFamily: "inherit",
                    fontSize: "13px",
                  }}
                />
              </div>

              {/* Free / Paid toggle */}
              <div className="form-group">
                <label>Pricing Type *</label>
                <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  <button
                    type="button"
                    onClick={() => { setIsFree(false); }}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: "10px",
                      border: !isFree ? "2px solid #e2a15d" : "1px solid rgba(255,255,255,0.12)",
                      background: !isFree ? "rgba(226,161,93,0.15)" : "#141419",
                      color: !isFree ? "#e2a15d" : "rgba(255,255,255,0.55)",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    💰 Paid Service
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsFree(true); setPrice(""); }}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: "10px",
                      border: isFree ? "2px solid #4ade80" : "1px solid rgba(255,255,255,0.12)",
                      background: isFree ? "rgba(74,222,128,0.12)" : "#141419",
                      color: isFree ? "#4ade80" : "rgba(255,255,255,0.55)",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    🎁 Free Service
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="form-group">
                  <label htmlFor="service-price">Price ($) *</label>
                  <input
                    id="service-price"
                    type="number"
                    min="0"
                    step="1"
                    placeholder={isFree ? "Free" : "e.g. 45"}
                    value={isFree ? "" : price}
                    disabled={isFree}
                    onChange={(e) => setPrice(e.target.value)}
                    style={isFree ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                  />
                </div>

                <div className="form-group">
                  <label>Duration *</label>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                      <input
                        id="service-duration-hours"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={durationHours}
                        onChange={(e) => setDurationHours(e.target.value)}
                      />
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textAlign: "center" }}>Hours</span>
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "18px", paddingBottom: "18px" }}>:</span>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                      <input
                        id="service-duration-mins"
                        type="number"
                        min="0"
                        max="59"
                        step="1"
                        placeholder="0"
                        value={durationMins}
                        onChange={(e) => setDurationMins(e.target.value)}
                      />
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textAlign: "center" }}>Minutes</span>
                    </div>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="auth-error" role="alert">
                  <span>!</span> {formError}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="primary-action-btn" disabled={submitting}>
                  {submitting ? "Saving..." : editingService ? "Update Service" : "Publish Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon warning">!</div>
            <h2>Delete Service?</h2>
            <p>Are you sure you want to delete this service? It will no longer be available for customer bookings.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setDeleteConfirmId(null)}
                disabled={actionLoadingId === deleteConfirmId}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={() => handleDeleteService(deleteConfirmId)}
                disabled={actionLoadingId === deleteConfirmId}
              >
                {actionLoadingId === deleteConfirmId ? "Deleting..." : "Yes, Delete Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProviderDashboard;
