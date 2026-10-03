import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import type { AuthResponse, UserRole } from "../types";

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("customer");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        }),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "provider") {
        navigate("/provider");
      } else {
        navigate("/customer");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-background-glow auth-background-glow-one"></div>
      <div className="auth-background-glow auth-background-glow-two"></div>

      <section className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon">B</div>

          <div>
            <h1>BookEasy</h1>
            <span>Smart booking made simple</span>
          </div>
        </div>

        <div className="auth-heading">
          <h2>Create your account</h2>
          <p>
            Join BookEasy and manage your bookings with ease.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full name</label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your full name"
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                autoComplete="new-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <span className="input-hint">
              Use at least 6 characters
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="role">Account type</label>

            <select
              id="role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as UserRole)
              }
            >
              <option value="customer">Customer</option>
              <option value="provider">Service Provider</option>
            </select>

            <span className="input-hint">
              {role === "customer"
                ? "Book and manage your appointments."
                : "Offer services and manage customer bookings."}
            </span>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              <span>!</span>
              {error}
            </div>
          )}

          <button
            className="primary-auth-button"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>Already have an account?</span>
        </div>

        <button
          type="button"
          className="secondary-auth-button"
          onClick={() => navigate("/login")}
        >
          Sign in to BookEasy
        </button>

        <p className="auth-footer">
          By creating an account, you agree to our terms and privacy policy.
        </p>
      </section>
    </main>
  );
};

export default Register;