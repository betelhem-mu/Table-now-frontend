import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../../components/Logo";
import { apiRequest } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import type { User, UserRole } from "../../types";

interface UsersResponse {
  users: User[];
}

const UserManagement = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const loadUsers = async () => {
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
      if (roleFilter !== "all") {
        params.push(`role=${roleFilter}`);
      }
      if (searchQuery.trim()) {
        params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      }
      if (params.length > 0) {
        queryStr = `?${params.join("&")}`;
      }

      const data = await apiRequest<UsersResponse>(`/admin/users${queryStr}`, { token });
      setUsers(data.users || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load user list.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    addToast("Logged out successfully.", "info");
    navigate("/login");
  };

  const toggleUserSuspension = async () => {
    if (!selectedUser) return;

    const newSuspendedState = !selectedUser.isSuspended;

    try {
      setSubmittingAction(true);
      const token = localStorage.getItem("token") || "";

      await apiRequest(`/admin/users/${selectedUser.id}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ isSuspended: newSuspendedState }),
      });

      addToast(
        `User ${selectedUser.name} account ${newSuspendedState ? "suspended" : "reactivated"} successfully!`,
        newSuspendedState ? "info" : "success"
      );

      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to update user status.", "error");
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
            <Link to="/admin/applications" className="nav-item">
              Applications
            </Link>
            <Link to="/admin/users" className="nav-item active">
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
            User Account Management
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem", marginTop: "0.25rem" }}>
            Inspect platform users, search accounts, and manage account activation status.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.75rem",
            background: "rgba(30, 41, 59, 0.6)",
            padding: "1rem 1.25rem",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {/* Role Tabs */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["all", "customer", "provider", "admin"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                style={{
                  padding: "0.45rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  textTransform: "capitalize",
                  border: "none",
                  cursor: "pointer",
                  background: roleFilter === r ? "#6366f1" : "rgba(255, 255, 255, 0.05)",
                  color: roleFilter === r ? "#ffffff" : "#94a3b8",
                  transition: "all 0.2s ease",
                }}
              >
                {r === "all" ? "All Users" : `${r}s`}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Search user name or email..."
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
            <p style={{ marginTop: "1rem" }}>Loading user accounts...</p>
          </div>
        ) : users.length === 0 ? (
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
            <h3>No users found</h3>
            <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
              No accounts matching your search and role filters were found.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {users.map((u) => {
              const createdDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "";
              const isCurrentAdmin = u.id === currentUser.id;
              return (
                <div
                  key={u.id}
                  style={{
                    background: u.isSuspended ? "rgba(239, 68, 68, 0.05)" : "rgba(30, 41, 59, 0.6)",
                    backdropFilter: "blur(12px)",
                    border: u.isSuspended ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#f8fafc" }}>{u.name}</h3>
                      <span
                        style={{
                          padding: "0.2rem 0.65rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          background:
                            u.role === "admin"
                              ? "rgba(168, 85, 247, 0.2)"
                              : u.role === "provider"
                              ? "rgba(56, 189, 248, 0.2)"
                              : "rgba(148, 163, 184, 0.2)",
                          color:
                            u.role === "admin"
                              ? "#c084fc"
                              : u.role === "provider"
                              ? "#38bdf8"
                              : "#cbd5e1",
                        }}
                      >
                        {u.role}
                      </span>

                      {u.isSuspended && (
                        <span
                          style={{
                            padding: "0.2rem 0.65rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            background: "rgba(244, 63, 94, 0.2)",
                            color: "#f43f5e",
                          }}
                        >
                          SUSPENDED
                        </span>
                      )}
                    </div>

                    <div style={{ color: "#94a3b8", fontSize: "0.875rem", marginTop: "0.35rem" }}>
                      <strong>Email:</strong> {u.email} {createdDate ? `• Registered: ${createdDate}` : ""}
                      {u.role === "provider" && (
                        <span> &bull; Provider Status: <strong style={{ color: u.providerStatus === "approved" ? "#4ade80" : u.providerStatus === "rejected" ? "#f43f5e" : "#facc15" }}>{u.providerStatus || "pending"}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    {isCurrentAdmin ? (
                      <span style={{ fontSize: "0.85rem", color: "#64748b", fontStyle: "italic" }}>
                        Current Active Admin
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedUser(u)}
                        style={{
                          background: u.isSuspended ? "linear-gradient(135deg, #10b981, #059669)" : "rgba(244, 63, 94, 0.15)",
                          color: u.isSuspended ? "#ffffff" : "#f43f5e",
                          border: u.isSuspended ? "none" : "1px solid rgba(244, 63, 94, 0.3)",
                          padding: "0.55rem 1.15rem",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        {u.isSuspended ? "Reactivate Account" : "Suspend Account"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Confirmation Modal */}
        {selectedUser && (
          <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
              <div className="modal-header">
                <h3>{selectedUser.isSuspended ? "Reactivate User Account" : "Suspend User Account"}</h3>
                <button className="modal-close" onClick={() => setSelectedUser(null)}>
                  &times;
                </button>
              </div>

              <div className="modal-body" style={{ padding: "1.25rem 0" }}>
                <p style={{ color: "#cbd5e1", fontSize: "0.95rem" }}>
                  Are you sure you want to {selectedUser.isSuspended ? "reactivate" : "suspend"} the account for{" "}
                  <strong>{selectedUser.name}</strong> ({selectedUser.email})?
                </p>

                {!selectedUser.isSuspended && (
                  <p style={{ color: "#f87171", fontSize: "0.85rem", marginTop: "0.75rem", background: "rgba(239, 68, 68, 0.1)", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                    Suspended users will be immediately prevented from logging in or performing any platform actions.
                  </p>
                )}
              </div>

              <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button type="button" className="cancel-btn" onClick={() => setSelectedUser(null)} disabled={submittingAction}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={toggleUserSuspension}
                  disabled={submittingAction}
                  style={{
                    background: selectedUser.isSuspended ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #ef4444, #dc2626)",
                    color: "#fff",
                    border: "none",
                    padding: "0.6rem 1.25rem",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {submittingAction ? "Processing..." : selectedUser.isSuspended ? "Confirm Reactivation" : "Confirm Suspension"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserManagement;
