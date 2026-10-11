import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [mode, setMode] = useState("login");

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!loginId.trim() || !password.trim()) {
      setError("Please enter login ID and password.");
      return;
    }

    try {
      await login(loginId, password);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Login failed.");
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setResetLoading(true);

    try {
      // Backend endpoint to be implemented
      const response = await api.post("/auth/forgot-password", {
        email: email.trim(),
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to send reset code."
        );
      }

      setMessage(
        response.data?.message ||
          "Reset code has been sent to your email."
      );

      setMode("reset");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to send reset code."
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    if (!newPassword.trim()) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setResetLoading(true);

    try {
      // Backend endpoint to be implemented
      const response = await api.post("/auth/reset-password", {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message || "Unable to reset password."
        );
      }

      setMessage(
        response.data?.message ||
          "Password reset successfully. You can now login."
      );

      setEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setMode("login");
        setMessage("");
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to reset password."
      );
    } finally {
      setResetLoading(false);
    }
  };

  const goToLogin = () => {
    setMode("login");
    setError("");
    setMessage("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">

        {/* Card gh*/}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">

          {/* LOGIN */}
          {mode === "login" && (
            <>
              {/* Logo */}
              <div className="mb-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
                  <ShieldCheck className="h-9 w-9 text-white" />
                </div>

                <h1 className="text-3xl font-bold text-slate-900">
                  Samarth Admin
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Sign in to access the admin dashboard
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              {/* Success */}
              {message && (
                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">
                  {message}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">

                {/* Login ID */}
                <div>
                  <label
                    htmlFor="loginId"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Login ID
                  </label>

                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="loginId"
                      type="text"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      placeholder="Enter admin ID or email"
                      autoComplete="username"
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setError("");
                        setMessage("");
                      }}
                      className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => !prev)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogIn className="h-5 w-5" />

                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            </>
          )}

          {/* FORGOT PASSWORD */}
          {mode === "forgot" && (
            <>
              <button
                type="button"
                onClick={goToLogin}
                className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </button>

              <div className="mb-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900">
                  Forgot Password?
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter your registered email address and we'll
                  send you a password reset code.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Registered Email
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      autoComplete="email"
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Mail className="h-5 w-5" />

                  {resetLoading
                    ? "Sending..."
                    : "Send Reset Code"}
                </button>
              </form>
            </>
          )}

          {/* RESET PASSWORD */}
          {mode === "reset" && (
            <>
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <div className="mb-8 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
                  <KeyRound className="h-8 w-8 text-blue-600" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900">
                  Reset Password
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter the code sent to your email and create a
                  new password.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleResetPassword}
                className="space-y-5"
              >
                {/* OTP */}
                <div>
                  <label
                    htmlFor="otp"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Verification Code
                  </label>

                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6)
                      )
                    }
                    placeholder="Enter 6-digit code"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-lg font-bold tracking-[0.4em] text-slate-900 outline-none placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    New Password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="newPassword"
                      type={
                        showNewPassword ? "text" : "password"
                      }
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(e.target.value)
                      }
                      placeholder="Enter new password"
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword((prev) => !prev)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      placeholder="Confirm new password"
                      className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-12 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((prev) => !prev)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <KeyRound className="h-5 w-5" />

                  {resetLoading
                    ? "Resetting..."
                    : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {/* Footer */}
          <div className="mt-8 border-t border-slate-100 pt-5 text-center">
            <p className="text-xs text-slate-400">
              Samarth Network Platform
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Secure Admin Portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;