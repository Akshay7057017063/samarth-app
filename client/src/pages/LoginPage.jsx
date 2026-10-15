import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://api.bull-mark.com/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Seconds before "Resend code" can be used again
const RESEND_SECONDS = 30;

// Public POST helper (login / forgot / reset are not authenticated)
const postJson = async (path, body) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let data = null;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { ok: res.ok, status: res.status, data };
};

// ============================================================
// PASSWORD FIELD (with show / hide)
// ============================================================

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder = '••••••••',
  autoComplete = 'new-password',
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-slate-600 mb-1.5"
      >
        {label}
      </label>

      <div className="relative">
        <Lock className="w-4 h-4 text-cyan-500 absolute left-3.5 top-3.5" />

        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full pl-10 pr-11 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1.5 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          {show ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // login | forgot | reset | done
  const [view, setView] = useState('login');

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');

  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Resend-code countdown
  useEffect(() => {
    if (cooldown <= 0) return undefined;

    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  const switchView = (next) => {
    setView(next);
    setError('');
    setNotice('');
  };

  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!loginId || !password) {
      setError('Please provide User Code / Email and Password.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await login(loginId, password);

    setLoading(false);

    if (res.success) {
      if (
        res.user.role === 'admin' ||
        res.user.role === 'superadmin'
      ) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.message);
    }
  };

  const fillCredentials = (id, pass) => {
    setLoginId(id);
    setPassword(pass);
    setError('');
  };

  // ==========================================================
  // FORGOT PASSWORD - STEP 1: SEND CODE
  // POST /auth/forgot-password
  // (also used by "Resend code")
  // ==========================================================

  const requestResetCode = async (e) => {
    if (e) e.preventDefault();

    const email = resetEmail.trim().toLowerCase();

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    try {
      const { ok, data } = await postJson('/auth/forgot-password', {
        email,
      });

      if (ok && data?.success) {
        setResetEmail(email);
        setOtp('');
        setView('reset');
        setNotice(
          data.message ||
            'If an account exists for this email, a reset code has been sent.'
        );
        setCooldown(RESEND_SECONDS);
      } else {
        setError(
          data?.message ||
            'Unable to send reset code. Please try again.'
        );
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // FORGOT PASSWORD - STEP 2: CODE + NEW PASSWORD
  // POST /auth/reset-password
  // ==========================================================

  const submitReset = async (e) => {
    e.preventDefault();

    const code = otp.trim();

    if (!/^\d{6}$/.test(code)) {
      setError('Reset code must be exactly 6 digits.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    try {
      const { ok, data } = await postJson('/auth/reset-password', {
        email: resetEmail,
        otp: code,
        newPassword,
      });

      if (ok && data?.success) {
        setLoginId(resetEmail);
        setPassword('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setShowNewPassword(false);
        setView('done');
        setNotice(
          data.message ||
            'Password reset successfully. You can now sign in.'
        );
      } else {
        setError(
          data?.message ||
            'Unable to reset password. Please try again.'
        );
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // SHARED MESSAGE BOXES
  // ==========================================================

  const errorBox = error ? (
    <div
      role="alert"
      className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2"
    >
      <AlertCircle className="w-4 h-4 shrink-0" />

      <span>{error}</span>
    </div>
  ) : null;

  const noticeBox = notice ? (
    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />

      <span>{notice}</span>
    </div>
  ) : null;

  const subtitle = {
    login: 'Access your distributor dashboard & digital workstation',
    forgot: 'Reset your password',
    reset: `Enter the 6-digit code sent to ${resetEmail}`,
    done: 'Your password has been updated',
  }[view];

  const primaryButtonClass =
    'group relative w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white overflow-hidden bg-gradient-to-r from-violet-600 via-pink-500 to-orange-400 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2';

  return (
    <div className="relative min-h-[85vh] overflow-hidden bg-gradient-to-br from-violet-50 via-white to-orange-50 text-slate-800 flex items-center justify-center px-4 py-16">

      {/* =========================================================
          RAINBOW BACKGROUND
      ========================================================= */}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">

        {/* Violet Glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-300/20 blur-3xl" />

        {/* Pink Glow */}
        <div className="absolute top-1/4 -right-40 w-96 h-96 rounded-full bg-pink-300/20 blur-3xl" />

        {/* Blue Glow */}
        <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-blue-300/15 blur-3xl" />

        {/* Orange Glow */}
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-orange-300/20 blur-3xl" />

        {/* Emerald Glow */}
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 rounded-full bg-emerald-300/15 blur-3xl" />

        {/* Center Rainbow Ambient Light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-violet-200/20 via-pink-200/20 to-orange-200/20 blur-3xl" />

        {/* Top Rainbow Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 via-pink-500 via-orange-400 to-emerald-400" />

      </div>


      {/* =========================================================
          LOGIN CONTAINER
      ========================================================= */}

      <div className="relative z-10 w-full max-w-md">

        {/* Rainbow Outer Border */}

        <div className="rounded-[28px] p-[1px] bg-gradient-to-r from-violet-500 via-pink-500 via-orange-400 to-emerald-400 shadow-2xl shadow-violet-500/10">

          {/* Glass Card */}

          <div className="rounded-[27px] bg-white/90 backdrop-blur-xl border border-white/80 p-7 sm:p-8">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="text-center mb-7">

              {/* Logo / Icon */}

              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-500 via-pink-500 to-orange-400 p-[2px] mb-4 shadow-lg shadow-pink-500/20">

                <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">

                  <Sparkles className="w-7 h-7 text-violet-600" />

                </div>

              </div>


              {/* Title */}

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">

                <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                  DIGITAL LYF
                </span>

              </h2>

              <div className="text-xs font-bold text-emerald-600 tracking-widest uppercase mt-1">
                PVT. LTD.
              </div>


              {/* Subtitle */}

              <p className="text-xs text-slate-500 mt-2 leading-relaxed break-words">
                {subtitle}
              </p>

            </div>


            {/* =====================================================
                VIEW: LOGIN
            ===================================================== */}

            {view === 'login' && (
              <>

                {/* Quick login - DEVELOPMENT ONLY.
                    Never shown in a production build, so real
                    credentials are not exposed to the public. */}

                {import.meta.env.DEV && (
                  <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-br from-violet-50 via-white to-orange-50 border border-violet-100">

                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">

                      <KeyRound className="w-3.5 h-3.5 text-orange-500" />

                      <span>
                        Dev only: click to fill credentials
                      </span>

                    </div>


                    <div className="grid grid-cols-3 gap-1.5">

                      {/* Super Admin */}

                      <button
                        type="button"
                        onClick={() =>
                          fillCredentials(
                            'SUPER001',
                            'superadmin123'
                          )
                        }
                        className="py-2.5 px-1 rounded-xl bg-gradient-to-br from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 border border-orange-200 text-orange-700 text-[10px] font-bold transition-all hover:scale-[1.02] text-center"
                      >
                        👑 Super Admin
                      </button>


                      {/* Mahesh */}

                      <button
                        type="button"
                        onClick={() =>
                          fillCredentials(
                            'SI681908',
                            'user123456'
                          )
                        }
                        className="py-2.5 px-1 rounded-xl bg-gradient-to-br from-violet-50 to-pink-50 hover:from-violet-100 hover:to-pink-100 border border-violet-200 text-violet-700 text-[10px] font-bold transition-all hover:scale-[1.02] text-center"
                      >
                        Mahesh
                        <span className="block text-[8px] text-violet-500">
                          SI681908
                        </span>
                      </button>


                      {/* Admin */}

                      <button
                        type="button"
                        onClick={() =>
                          fillCredentials(
                            'ADMIN001',
                            'admin123456'
                          )
                        }
                        className="py-2.5 px-1 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 border border-cyan-200 text-cyan-700 text-[10px] font-bold transition-all hover:scale-[1.02] text-center"
                      >
                        Alex Mora
                        <span className="block text-[8px] text-cyan-600">
                          Admin
                        </span>
                      </button>

                    </div>
                  </div>
                )}


                {/* Notice after a successful reset */}

                {noticeBox && <div className="mb-4">{noticeBox}</div>}


                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >

                  {errorBox}


                  {/* User Code / Email */}

                  <div>

                    <label
                      htmlFor="loginId"
                      className="block text-xs font-semibold text-slate-600 mb-1.5"
                    >
                      User Code or Email
                    </label>

                    <div className="relative">

                      <User className="w-4 h-4 text-violet-500 absolute left-3.5 top-3.5" />

                      <input
                        id="loginId"
                        type="text"
                        value={loginId}
                        onChange={(e) =>
                          setLoginId(e.target.value)
                        }
                        placeholder="e.g. SUPER001 or SI681908"
                        autoComplete="username"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono text-xs placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all uppercase"
                      />

                    </div>

                  </div>


                  {/* Password */}

                  <div>

                    <div className="flex items-center justify-between mb-1.5">

                      <label
                        htmlFor="password"
                        className="block text-xs font-semibold text-slate-600"
                      >
                        Password
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(
                            loginId.includes('@')
                              ? loginId.trim()
                              : ''
                          );
                          switchView('forgot');
                        }}
                        className="text-xs font-bold text-violet-600 hover:text-pink-500 transition-colors"
                      >
                        Forgot password?
                      </button>

                    </div>

                    <div className="relative">

                      <Lock className="w-4 h-4 text-cyan-500 absolute left-3.5 top-3.5" />

                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                      />

                    </div>

                  </div>


                  {/* Login button */}

                  <button
                    type="submit"
                    disabled={loading}
                    className={primaryButtonClass}
                  >

                    {loading ? (
                      <span className="relative z-10">
                        Verifying...
                      </span>
                    ) : (
                      <>

                        <span className="relative z-10">
                          Sign In to Dashboard
                        </span>

                        <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />

                      </>
                    )}

                  </button>

                </form>


                {/* Activate */}

                <div className="mt-7 text-center text-xs text-slate-500">

                  Have an activation PIN?{' '}

                  <Link
                    to="/activate-account"
                    className="font-bold bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                  >
                    Activate your account
                  </Link>

                </div>

              </>
            )}


            {/* =====================================================
                VIEW: FORGOT PASSWORD (enter email)
            ===================================================== */}

            {view === 'forgot' && (
              <form
                onSubmit={requestResetCode}
                className="space-y-4"
                noValidate
              >

                {errorBox}

                <div>

                  <label
                    htmlFor="resetEmail"
                    className="block text-xs font-semibold text-slate-600 mb-1.5"
                  >
                    Registered Email
                  </label>

                  <div className="relative">

                    <Mail className="w-4 h-4 text-violet-500 absolute left-3.5 top-3.5" />

                    <input
                      id="resetEmail"
                      type="email"
                      value={resetEmail}
                      onChange={(e) =>
                        setResetEmail(e.target.value)
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    />

                  </div>

                </div>

                <p className="text-[11px] leading-relaxed text-slate-500">
                  We will email a 6-digit code that is valid for 10 minutes.
                  Email reset is available for administrator accounts.
                  Customers should contact admin to reset their password.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className={primaryButtonClass}
                >
                  {loading ? (
                    <span className="relative z-10">
                      Sending code...
                    </span>
                  ) : (
                    <>
                      <span className="relative z-10">
                        Send Reset Code
                      </span>

                      <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="flex w-full items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-violet-600 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </button>

              </form>
            )}


            {/* =====================================================
                VIEW: RESET PASSWORD (code + new password)
            ===================================================== */}

            {view === 'reset' && (
              <form
                onSubmit={submitReset}
                className="space-y-4"
                noValidate
              >

                {noticeBox}
                {errorBox}

                {/* Code */}

                <div>

                  <label
                    htmlFor="otp"
                    className="block text-xs font-semibold text-slate-600 mb-1.5"
                  >
                    6-digit Reset Code
                  </label>

                  <div className="relative">

                    <KeyRound className="w-4 h-4 text-orange-500 absolute left-3.5 top-3.5" />

                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={(e) =>
                        setOtp(
                          e.target.value.replace(/\D/g, '')
                        )
                      }
                      placeholder="123456"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono text-sm tracking-[0.4em] placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                    />

                  </div>

                </div>

                {/* New password */}

                <PasswordField
                  id="newPassword"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  show={showNewPassword}
                  onToggle={() =>
                    setShowNewPassword((v) => !v)
                  }
                />

                <PasswordField
                  id="confirmPassword"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  show={showNewPassword}
                  onToggle={() =>
                    setShowNewPassword((v) => !v)
                  }
                />

                <p className="text-[11px] text-slate-500">
                  Use at least 6 characters.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className={primaryButtonClass}
                >
                  {loading ? (
                    <span className="relative z-10">
                      Updating...
                    </span>
                  ) : (
                    <>
                      <span className="relative z-10">
                        Reset Password
                      </span>

                      <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs">

                  <button
                    type="button"
                    onClick={() => switchView('forgot')}
                    className="flex items-center gap-1.5 font-bold text-slate-500 hover:text-violet-600 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Change email
                  </button>

                  <button
                    type="button"
                    onClick={() => requestResetCode()}
                    disabled={loading || cooldown > 0}
                    className="font-bold text-violet-600 hover:text-pink-500 transition-colors disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {cooldown > 0
                      ? `Resend code in ${cooldown}s`
                      : 'Resend code'}
                  </button>

                </div>

              </form>
            )}


            {/* =====================================================
                VIEW: DONE
            ===================================================== */}

            {view === 'done' && (
              <div className="space-y-4 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <p className="text-xs leading-relaxed text-slate-600">
                  {notice ||
                    'Password reset successfully. You can now sign in with your new password.'}
                </p>

                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className={primaryButtonClass}
                >
                  <span className="relative z-10">
                    Back to Sign In
                  </span>

                  <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

              </div>
            )}


            {/* =====================================================
                SECURITY INFO
            ===================================================== */}

            <div className="mt-6 pt-5 border-t border-slate-200/80">

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">

                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-100 flex items-center justify-center">

                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />

                </div>

                <span>
                  Secure & protected distributor access
                </span>

              </div>

            </div>

          </div>
        </div>
      </div>

    </div>
  );
}