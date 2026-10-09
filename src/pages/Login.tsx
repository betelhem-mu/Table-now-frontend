import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { apiRequest } from "../services/api";
import type { AuthResponse } from "../types";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      if (data.user.role === "admin") {
        navigate("/admin");
      } else if (data.user.role === "provider") {
        navigate("/provider");
      } else {
        navigate("/customer");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials."
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
        <div className="auth-brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <Logo size={40} />

          <div>
            <h1>BookEasy</h1>
            <span>Smart booking made simple</span>
          </div>
        </div>

        <div className="auth-heading">
          <h2>Welcome back</h2>
          <p>
            Sign in to continue managing your bookings.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email address</label>

            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div className="password-label-row">
              <label htmlFor="login-password">Password</label>

              <button
                type="button"
                className="forgot-password"
                onClick={() => {
                  setError("Password recovery will be available soon.");
                }}
              >
                Forgot password?
              </button>
            </div>

            <div className="password-input-wrapper">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <label className="remember-row">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />

            <span>Remember me</span>
          </label>

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
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>New to BookEasy?</span>
        </div>

        <button
          type="button"
          className="secondary-auth-button"
          onClick={() => navigate("/register")}
        >
          Create an account
        </button>

        <p className="auth-footer">
          Securely manage your bookings, reservations, and services
          with BookEasy.
        </p>
      </section>
    </main>
  );
};

export default Login;