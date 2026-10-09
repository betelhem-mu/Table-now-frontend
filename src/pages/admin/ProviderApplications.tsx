import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../../components/Logo";
import { apiRequest } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import type { ProviderApplication } from "../../types";

interface ApplicationsResponse {
  applications: ProviderApplication[];
}

const ProviderApplications = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [applications, setApplications] = useState<ProviderApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Rejection Modal state
  const [rejectingApp, setRejectingApp] = useState<ProviderApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Approval Modal state
  const [approvingApp, setApprovingApp] = useState<ProviderApplication | null>(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      let queryStr = "";
      const params: string[] = [];
      if (statusFilter !== "all") {
        params.push(`status=${statusFilter}`);
      }
      if (searchQuery.trim()) {
        params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      }
      if (params.length > 0) {
        queryStr = `?${params.join("&")}`;
      }

      const data = await apiRequest<ApplicationsResponse>(`/admin/provider-applications${queryStr}`, { token });
      setApplications(data.applications || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load provider applications.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadApplications();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    addToast("Logged out successfully.", "info");
    navigate("/login");
  };

  const confirmApprove = async () => {
    if (!approvingApp) return;

    try {
      setSubmittingAction(true);
      const token = localStorage.getItem("token") || "";
      await apiRequest(`/admin/provider-applications/${approvingApp.id}/approve`, {
        method: "PATCH",
        token,
      });

      addToast(`Approved application for ${approvingApp.name}!`, "success");
      setApprovingApp(null);
      loadApplications();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to approve application.", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  const confirmReject = async () => {
    if (!rejectingApp) return;

    try {
      setSubmittingAction(true);
      const token = localStorage.getItem("token") || "";
      await apiRequest(`/admin/provider-applications/${rejectingApp.id}/reject`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ reason: rejectionReason }),
      });

      addToast(`Rejected application for ${rejectingApp.name}.`, "info");
      setRejectingApp(null);
      setRejectionReason("");
      loadApplications();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to reject application.", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

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
            <Link to="/admin/applications" className="nav-item active">
              Applications
            </Link>
            <Link to="/admin/users" className="nav-item">
              Users
            </Link>
            <Link to="/admin/services" className="nav-item">
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
            Service Provider Applications
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem", marginTop: "0.25rem" }}>
            Review, approve, or reject service provider verification requests.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justify: "space-between",
            alignItems: "center",
            marginBottom: "1.75rem",
            background: "rgba(30, 41, 59, 0.6)",
            padding: "1rem 1.25rem",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["all", "pending", "approved", "rejected"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: "0.45rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  textTransform: "capitalize",
                  border: "none",
                  cursor: "pointer",
                  background: statusFilter === status ? "#6366f1" : "rgba(255, 255, 255, 0.05)",
                  color: statusFilter === status ? "#ffffff" : "#94a3b8",
                  transition: "all 0.2s ease",
                }}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Search name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "0.45rem 0.85rem",
                color: "#f8fafc",
                fontSize: "0.875rem",
                width: "240px",
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
            <p style={{ marginTop: "1rem" }}>Loading provider applications...</p>
          </div>
        ) : applications.length === 0 ? (
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
            <h3>No applications found</h3>
            <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
              {statusFilter !== "all"
                ? `There are currently no provider applications with status "${statusFilter}".`
                : "No service provider applications have been registered."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {applications.map((app) => {
              const submissionDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "Unknown";
              return (
                <div
                  key={app.id}
                  style={{
                    background: "rgba(30, 41, 59, 0.6)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    justify: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#f8fafc" }}>{app.name}</h3>
                      <span
                        style={{
                          padding: "0.2rem 0.65rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          background:
                            app.providerStatus === "approved"
                              ? "rgba(74, 222, 128, 0.15)"
                              : app.providerStatus === "rejected"
                              ? "rgba(244, 63, 94, 0.15)"
                              : "rgba(234, 179, 8, 0.15)",
                          color:
                            app.providerStatus === "approved"
                              ? "#4ade80"
                              : app.providerStatus === "rejected"
                              ? "#f43f5e"
                              : "#facc15",
                        }}
                      >
                        {app.providerStatus || "pending"}
                      </span>
                    </div>

                    <div style={{ color: "#94a3b8", fontSize: "0.875rem", marginTop: "0.35rem" }}>
                      <strong>Email:</strong> {app.email} &bull; <strong>Submitted:</strong> {submissionDate}
                    </div>

                    {app.providerStatus === "rejected" && app.rejectionReason && (
                      <div
                        style={{
                          marginTop: "0.5rem",
                          padding: "0.5rem 0.75rem",
                          background: "rgba(244, 63, 94, 0.1)",
                          borderLeft: "3px solid #f43f5e",
                          borderRadius: "4px",
                          color: "#fda4af",
                          fontSize: "0.825rem",
                        }}
                      >
                        <strong>Rejection Reason:</strong> {app.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    {app.providerStatus !== "approved" && (
                      <button
                        onClick={() => setApprovingApp(app)}
                        style={{
                          background: "linear-gradient(135deg, #10b981, #059669)",
                          color: "#ffffff",
                          border: "none",
                          padding: "0.55rem 1.15rem",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Approve
                      </button>
                    )}

                    {app.providerStatus !== "rejected" && (
                      <button
                        onClick={() => {
                          setRejectingApp(app);
                          setRejectionReason("");
                        }}
                        style={{
                          background: "rgba(244, 63, 94, 0.15)",
                          color: "#f43f5e",
                          border: "1px solid rgba(244, 63, 94, 0.3)",
                          padding: "0.55rem 1.15rem",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rejection Modal */}
        {rejectingApp && (
          <div className="modal-backdrop" onClick={() => setRejectingApp(null)}>
            <div
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "480px" }}
            >
              <div className="modal-header">
                <h3>Reject Provider Application</h3>
                <button className="modal-close" onClick={() => setRejectingApp(null)}>
                  &times;
                </button>
              </div>

              <div className="modal-body" style={{ padding: "1.25rem 0" }}>
                <p style={{ color: "#cbd5e1", fontSize: "0.925rem" }}>
                  Are you sure you want to reject the provider application for <strong>{rejectingApp.name}</strong> ({rejectingApp.email})?
                </p>

                <div className="form-group" style={{ marginTop: "1.25rem" }}>
                  <label htmlFor="rejection-reason" style={{ fontWeight: "600", color: "#f8fafc" }}>
                    Reason for Rejection (Optional)
                  </label>
                  <textarea
                    id="rejection-reason"
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason for the applicant..."
                    style={{
                      width: "100%",
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      padding: "0.65rem",
                      color: "#f8fafc",
                      fontSize: "0.9rem",
                      marginTop: "0.4rem",
                    }}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setRejectingApp(null)}
                  disabled={submittingAction}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmReject}
                  disabled={submittingAction}
                  style={{
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    color: "#fff",
                    border: "none",
                    padding: "0.6rem 1.25rem",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {submittingAction ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approval Confirmation Modal */}
        {approvingApp && (
          <div className="modal-backdrop" onClick={() => setApprovingApp(null)}>
            <div
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "440px" }}
            >
              <div className="modal-header">
                <h3>Approve Provider Application</h3>
                <button className="modal-close" onClick={() => setApprovingApp(null)}>
                  &times;
                </button>
              </div>

              <div className="modal-body" style={{ padding: "1.25rem 0" }}>
                <p style={{ color: "#cbd5e1", fontSize: "0.95rem" }}>
                  Are you sure you want to approve <strong>{approvingApp.name}</strong> ({approvingApp.email}) as an authorized service provider?
                </p>
                <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                  This will grant them permission to create and manage services on BookEasy.
                </p>
              </div>

              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setApprovingApp(null)}
                  disabled={submittingAction}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmApprove}
                  disabled={submittingAction}
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff",
                    border: "none",
                    padding: "0.6rem 1.25rem",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {submittingAction ? "Approving..." : "Confirm Approval"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProviderApplications;
