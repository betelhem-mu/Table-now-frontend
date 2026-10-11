import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { apiRequest } from "../services/api";
import { useToast } from "../context/ToastContext";
import { clearAuthSession } from "../utils/authSession";
import "./Settings.css";

type SettingsSection = "profile" | "appearance" | "security" | "logout";
type ThemeMode = "light" | "dark" | "system";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "customer" | "provider" | "admin";
  theme?: ThemeMode;
  deletionRequested?: boolean;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Profile Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userRole, setUserRole] = useState<"customer" | "provider" | "admin">("customer");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem("app_theme") as ThemeMode) || "system";
  });

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Deletion Request State
  const [deletionRequested, setDeletionRequested] = useState(false);
  const [deletionSubmitting, setDeletionSubmitting] = useState(false);
  const [showDeletionConfirmModal, setShowDeletionConfirmModal] = useState(false);

  // Logout Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Theme application logic
  const applyTheme = (theme: ThemeMode) => {
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  };

  // Listen to system theme changes if theme is "system"
  useEffect(() => {
    applyTheme(selectedTheme);
    localStorage.setItem("app_theme", selectedTheme);
    localStorage.setItem("provider_theme", selectedTheme === "light" ? "light" : "dark");
    localStorage.setItem("customer_theme", selectedTheme === "light" ? "light" : "dark");

    if (selectedTheme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [selectedTheme]);

  // Load User Profile on Mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const data = await apiRequest<{ user: UserProfile }>("/users/profile", { token });
        if (data.user) {
          setName(data.user.name);
          setEmail(data.user.email);
          setUserRole(data.user.role);
          if (data.user.theme) {
            setSelectedTheme(data.user.theme);
          }
          if (data.user.deletionRequested) {
            setDeletionRequested(true);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch user profile, using stored session:", err);
        const localUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (localUser.name) setName(localUser.name);
        if (localUser.email) setEmail(localUser.email);
        if (localUser.role) setUserRole(localUser.role);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Navigate back to user's dashboard based on role
  const handleBackToDashboard = () => {
    if (userRole === "admin") navigate("/admin");
    else if (userRole === "provider") navigate("/provider");
    else navigate("/customer");
  };

  // 1. Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");

    if (!name.trim()) {
      setProfileError("Full name is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setProfileError("Please enter a valid email address.");
      return;
    }

    try {
      setProfileSaving(true);
      const token = localStorage.getItem("token") || "";

      const res = await apiRequest<{ message: string; user: UserProfile }>("/users/profile", {
        method: "PUT",
        token,
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      // Update local storage session data
      const currentStored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...currentStored,
          name: res.user.name,
          email: res.user.email,
        })
      );

      // Scoped display name for customer/provider profiles
      const userKey = currentStored.id || currentStored._id || currentStored.email;
      if (userKey) {
        if (userRole === "customer") localStorage.setItem(`customer_display_name_${userKey}`, res.user.name);
        if (userRole === "provider") localStorage.setItem(`provider_display_name_${userKey}`, res.user.name);
      }

      addToast("Profile updated successfully!", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update profile.";
      setProfileError(msg);
      addToast(msg, "error");
    } finally {
      setProfileSaving(false);
    }
  };

  // 2. Handle Theme Selection
  const handleThemeChange = async (theme: ThemeMode) => {
    setSelectedTheme(theme);
    applyTheme(theme);

    try {
      const token = localStorage.getItem("token");
      if (token) {
        await apiRequest("/users/theme", {
          method: "PUT",
          token,
          body: JSON.stringify({ theme }),
        });
      }
      addToast(`Appearance preference set to ${theme === "system" ? "System Default" : theme.charAt(0).toUpperCase() + theme.slice(1) + " Mode"}.`, "success");
    } catch {
      // Preference still saved locally
    }
  };

  // 3. Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    try {
      setPasswordSaving(true);
      const token = localStorage.getItem("token") || "";

      await apiRequest("/users/change-password", {
        method: "PUT",
        token,
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      addToast("Password changed successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to change password.";
      setPasswordError(msg);
      addToast(msg, "error");
    } finally {
      setPasswordSaving(false);
    }
  };

  // 4. Handle Account Deletion Request
  const handleConfirmDeletionRequest = async () => {
    try {
      setDeletionSubmitting(true);
      const token = localStorage.getItem("token") || "";

      await apiRequest("/users/deletion-request", {
        method: "POST",
        token,
      });

      setDeletionRequested(true);
      setShowDeletionConfirmModal(false);
      addToast("Account deletion request submitted. An administrator will review your request.", "info");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to submit deletion request.", "error");
    } finally {
      setDeletionSubmitting(false);
    }
  };

  // 5. Handle Logout
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await apiRequest("/users/logout", {
          method: "POST",
          token,
        });
      }
    } catch {
      // Continue client logout even if network fails
    } finally {
      clearAuthSession();
      addToast("Logged out successfully.", "info");
      navigate("/login");
    }
  };

  return (
    <div className="settings-page">
      {/* Top Navbar */}
      <header className="settings-navbar">
        <div className="settings-brand" onClick={handleBackToDashboard} title="Back to Dashboard">
          <Logo size={36} />
          <div>
            <strong>BookEasy</strong>
            <span>Settings</span>
          </div>
        </div>

        <div className="settings-nav-actions">
          <button
            type="button"
            className="back-dashboard-btn"
            onClick={handleBackToDashboard}
            title="Return to your main dashboard"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Settings Body */}
      <div className="settings-container">
        {/* Left Sidebar Navigation */}
        <aside className="settings-sidebar" aria-label="Settings Navigation">
          <div className="sidebar-header">
            <h2 className="sidebar-heading">Settings</h2>
            <p className="sidebar-description">Manage your account</p>
          </div>

          <nav className="sidebar-nav">
            <button
              type="button"
              className={`sidebar-item ${activeSection === "profile" ? "active" : ""}`}
              onClick={() => setActiveSection("profile")}
              aria-current={activeSection === "profile" ? "page" : undefined}
            >
              <span className="sidebar-icon">👤</span>
              <span>Profile</span>
            </button>

            <button
              type="button"
              className={`sidebar-item ${activeSection === "appearance" ? "active" : ""}`}
              onClick={() => setActiveSection("appearance")}
              aria-current={activeSection === "appearance" ? "page" : undefined}
            >
              <span className="sidebar-icon">🎨</span>
              <span>Appearance</span>
            </button>

            <button
              type="button"
              className={`sidebar-item ${activeSection === "security" ? "active" : ""}`}
              onClick={() => setActiveSection("security")}
              aria-current={activeSection === "security" ? "page" : undefined}
            >
              <span className="sidebar-icon">🛡️</span>
              <span>Security & Privacy</span>
            </button>

            <button
              type="button"
              className="sidebar-item sidebar-item-logout"
              onClick={() => setShowLogoutModal(true)}
              title="Log out of BookEasy"
            >
              <span className="sidebar-icon">🚪</span>
              <span>Log Out</span>
            </button>
          </nav>
        </aside>

        {/* Right Main Content Area */}
        <main className="settings-content">
          {loadingProfile ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-secondary)" }}>
              <div className="loading-spinner" style={{ margin: "0 auto 1rem auto" }}></div>
              <p>Loading your account settings...</p>
            </div>
          ) : (
            <>
              {/* SECTION 1: PROFILE */}
              {activeSection === "profile" && (
                <div>
                  <div className="settings-header-banner">
                    <h1 className="settings-title">Profile Settings</h1>
                    <p className="settings-subtitle">
                      Update your account details and contact information.
                    </p>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="settings-form">
                    {profileError && (
                      <div className="form-error" role="alert" style={{ background: "rgba(239, 68, 68, 0.1)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
                        {profileError}
                      </div>
                    )}

                    <div className="form-field">
                      <label htmlFor="profile-name" className="form-label">
                        Full Name *
                      </label>
                      <input
                        id="profile-name"
                        type="text"
                        className="form-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                        disabled={profileSaving}
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="profile-email" className="form-label">
                        Email Address *
                      </label>
                      <input
                        id="profile-email"
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                        disabled={profileSaving}
                      />
                      <span className="form-helper">
                        This email is used for account login and notifications.
                      </span>
                    </div>

                    <div className="form-field">
                      <label className="form-label">Account Role</label>
                      <input
                        type="text"
                        className="form-input"
                        value={userRole.toUpperCase()}
                        disabled
                        style={{ cursor: "not-allowed", textTransform: "capitalize", background: "rgba(255, 255, 255, 0.03)" }}
                      />
                      <span className="form-helper">
                        Role permissions are managed by administrators.
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="settings-btn-primary"
                      disabled={profileSaving}
                    >
                      {profileSaving ? "Saving Changes..." : "Save Profile"}
                    </button>
                  </form>
                </div>
              )}

              {/* SECTION 2: APPEARANCE */}
              {activeSection === "appearance" && (
                <div>
                  <div className="settings-header-banner">
                    <h1 className="settings-title">Appearance Settings</h1>
                    <p className="settings-subtitle">
                      Customize how BookEasy looks on your device.
                    </p>
                  </div>

                  <div className="theme-options-grid">
                    {/* Light Mode Card */}
                    <div
                      className={`theme-card ${selectedTheme === "light" ? "selected" : ""}`}
                      onClick={() => handleThemeChange("light")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && handleThemeChange("light")}
                    >
                      <div className="theme-card-icon">☀️</div>
                      <div className="theme-card-title">Light Mode</div>
                      <div className="theme-card-desc">Clean, high-clarity interface with crisp contrasts</div>
                      <div className="theme-card-check">✓</div>
                    </div>

                    {/* Dark Mode Card */}
                    <div
                      className={`theme-card ${selectedTheme === "dark" ? "selected" : ""}`}
                      onClick={() => handleThemeChange("dark")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && handleThemeChange("dark")}
                    >
                      <div className="theme-card-icon">🌙</div>
                      <div className="theme-card-title">Dark Mode</div>
                      <div className="theme-card-desc">Sleek, low-glare glassmorphic dark palette</div>
                      <div className="theme-card-check">✓</div>
                    </div>

                    {/* System Default Card */}
                    <div
                      className={`theme-card ${selectedTheme === "system" ? "selected" : ""}`}
                      onClick={() => handleThemeChange("system")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && handleThemeChange("system")}
                    >
                      <div className="theme-card-icon">💻</div>
                      <div className="theme-card-title">System Default</div>
                      <div className="theme-card-desc">Automatically matches your operating system theme</div>
                      <div className="theme-card-check">✓</div>
                    </div>
                  </div>

                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", background: "var(--bg-glass)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                    💡 <strong>Tip:</strong> Your appearance preference is saved and will automatically apply across all BookEasy pages and future sessions.
                  </div>
                </div>
              )}

              {/* SECTION 3: SECURITY & PRIVACY */}
              {activeSection === "security" && (
                <div className="security-section">
                  <div className="settings-header-banner" style={{ marginBottom: 0 }}>
                    <h1 className="settings-title">Security & Privacy</h1>
                    <p className="settings-subtitle">
                      Manage your password and data privacy settings.
                    </p>
                  </div>

                  {/* Feature A: Change Password */}
                  <div className="security-block">
                    <div className="security-block-header">
                      <h2 className="security-block-title">🔒 Change Password</h2>
                      <p className="security-block-desc">
                        Ensure your account remains safe by choosing a strong password with at least 6 characters.
                      </p>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="settings-form">
                      {passwordError && (
                        <div className="form-error" role="alert" style={{ background: "rgba(239, 68, 68, 0.1)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
                          {passwordError}
                        </div>
                      )}

                      <div className="form-field">
                        <label htmlFor="current-password" className="form-label">
                          Current Password *
                        </label>
                        <input
                          id="current-password"
                          type="password"
                          className="form-input"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          disabled={passwordSaving}
                        />
                      </div>

                      <div className="form-field">
                        <label htmlFor="new-password" className="form-label">
                          New Password *
                        </label>
                        <input
                          id="new-password"
                          type="password"
                          className="form-input"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          disabled={passwordSaving}
                        />
                        <span className="form-helper">Must be at least 6 characters.</span>
                      </div>

                      <div className="form-field">
                        <label htmlFor="confirm-password" className="form-label">
                          Confirm New Password *
                        </label>
                        <input
                          id="confirm-password"
                          type="password"
                          className="form-input"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          disabled={passwordSaving}
                        />
                      </div>

                      <button
                        type="submit"
                        className="settings-btn-primary"
                        disabled={passwordSaving}
                      >
                        {passwordSaving ? "Updating Password..." : "Change Password"}
                      </button>
                    </form>
                  </div>

                  {/* Feature B: Account Deletion Request */}
                  <div className="security-block danger-block">
                    <div className="security-block-header">
                      <h2 className="security-block-title">⚠️ Account Deletion Request</h2>
                      <p className="security-block-desc">
                        Submit a request to permanently delete your account. This action flags your profile for administrative review without immediately purging your data.
                      </p>
                    </div>

                    {deletionRequested ? (
                      <div style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "1rem", borderRadius: "10px", color: "#fbbf24", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontSize: "1.25rem" }}>⏳</span>
                        <div>
                          <strong>Deletion Request Pending</strong>
                          <div style={{ fontSize: "0.85rem", color: "#fcd34d", marginTop: "2px" }}>
                            You have submitted a deletion request. An administrator will review and process your request.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <button
                          type="button"
                          className="danger-action-btn"
                          onClick={() => setShowDeletionConfirmModal(true)}
                        >
                          Request Account Deletion
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Account Deletion Request Confirmation Modal */}
      {showDeletionConfirmModal && (
        <div className="modal-backdrop" onClick={() => setShowDeletionConfirmModal(false)}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "460px", border: "1px solid rgba(239, 68, 68, 0.35)" }}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>⚠️</span>
                <div>
                  <h3 style={{ color: "#f87171", margin: 0, fontSize: "1.2rem", fontWeight: "700" }}>
                    Request Account Deletion
                  </h3>
                  <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Administrative Request</span>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowDeletionConfirmModal(false)}
                title="Close"
              >
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ padding: "1.25rem 0" }}>
              <p style={{ color: "#cbd5e1", fontSize: "0.925rem", lineHeight: "1.5", margin: 0 }}>
                Are you sure you want to submit an account deletion request? This will notify administrators to review and schedule your account for permanent closure.
              </p>
            </div>

            <div
              className="modal-actions"
              style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}
            >
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowDeletionConfirmModal(false)}
                disabled={deletionSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-action-btn"
                onClick={handleConfirmDeletionRequest}
                disabled={deletionSubmitting}
              >
                {deletionSubmitting ? "Submitting..." : "Confirm Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-backdrop" onClick={() => setShowLogoutModal(false)}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "420px" }}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.4rem" }}>🚪</span>
                <div>
                  <h3 style={{ color: "var(--text-primary)", margin: 0, fontSize: "1.2rem", fontWeight: "700" }}>
                    Log Out of BookEasy
                  </h3>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>Session Management</span>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setShowLogoutModal(false)}
                title="Close"
              >
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ padding: "1.25rem 0" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.925rem", lineHeight: "1.5", margin: 0 }}>
                Are you sure you want to log out? You will need to enter your credentials to access your account again.
              </p>
            </div>

            <div
              className="modal-actions"
              style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}
            >
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                  color: "#fff",
                  border: "none",
                  padding: "0.6rem 1.25rem",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
