import React from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Common Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Public Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ActivateAccountPage from "./pages/ActivateAccountPage";

// Customer Portal Pages
import UserDashboard from "./pages/user/UserDashboard";
import CaptchaEarnPage from "./pages/user/CaptchaEarnPage";
import ReferralTreePage from "./pages/user/ReferralTreePage";
import WithdrawalPage from "./pages/user/WithdrawalPage";
import ProfileKycPage from "./pages/user/ProfileKycPage";
import RegisterMemberPage from "./pages/user/RegisterMemberPage";

// =====================================================
// CUSTOMER PROTECTED ROUTE
// =====================================================

const ProtectedUserRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // ---------------------------------------------------
  // AUTH LOADING
  // ---------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-br from-violet-50 via-white to-orange-50 px-6">
        <div className="text-center">
          <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" />

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 via-pink-500 to-orange-500 shadow-lg shadow-violet-200">
              <div className="h-2.5 w-2.5 rounded-full bg-white" />
            </div>
          </div>

          <h2 className="text-base font-bold text-slate-800">
            Loading your portal
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Please wait while we securely load your account...
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------
  // NOT AUTHENTICATED
  // ---------------------------------------------------
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ---------------------------------------------------
  // ADMIN ACCOUNTS
  // Admin panel is a separate frontend.
  // ---------------------------------------------------
  const role = String(user.role || "user")
    .trim()
    .toLowerCase();

  if (role === "admin" || role === "superadmin") {
    return <Navigate to="/login" replace />;
  }

  // ---------------------------------------------------
  // CUSTOMER ACCESS
  // ---------------------------------------------------
  return children;
};

// =====================================================
// APP
// =====================================================

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-violet-50 via-white to-orange-50 text-slate-800">
      {/* =================================================
          PUBLIC / CUSTOMER NAVBAR
      ================================================= */}
      <Navbar />

      {/* =================================================
          MAIN CONTENT
      ================================================= */}
      <main className="flex-1">
        <Routes>

          {/* =================================================
              PUBLIC WEBSITE
          ================================================= */}

          <Route
            path="/"
            element={<HomePage />}
          />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          {/* =================================================
              ACCOUNT ACTIVATION
              Inactive customers can activate their account
              using the activation PIN sent by admin.
          ================================================= */}

          <Route
            path="/activate-account"
            element={<ActivateAccountPage />}
          />

          {/* =================================================
              CUSTOMER PORTAL
          ================================================= */}

          <Route
            path="/dashboard"
            element={
              <ProtectedUserRoute>
                <UserDashboard />
              </ProtectedUserRoute>
            }
          />

          {/* Existing logged-in customer can register
              a new member from inside the dashboard. */}
          <Route
            path="/dashboard/register"
            element={
              <ProtectedUserRoute>
                <RegisterMemberPage />
              </ProtectedUserRoute>
            }
          />

          <Route
            path="/dashboard/captcha"
            element={
              <ProtectedUserRoute>
                <CaptchaEarnPage />
              </ProtectedUserRoute>
            }
          />

          <Route
            path="/dashboard/tree"
            element={
              <ProtectedUserRoute>
                <ReferralTreePage />
              </ProtectedUserRoute>
            }
          />

          <Route
            path="/dashboard/wallet"
            element={
              <ProtectedUserRoute>
                <WithdrawalPage />
              </ProtectedUserRoute>
            }
          />

          <Route
            path="/dashboard/profile"
            element={
              <ProtectedUserRoute>
                <ProfileKycPage />
              </ProtectedUserRoute>
            }
          />

          {/* =================================================
              FALLBACK
          ================================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>
      </main>

      {/* =================================================
          FOOTER
      ================================================= */}
      <Footer />
    </div>
  );
}