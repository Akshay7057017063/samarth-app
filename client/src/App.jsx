import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Common Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Member Portal Pages
import UserDashboard from './pages/user/UserDashboard';
import CaptchaEarnPage from './pages/user/CaptchaEarnPage';
import ReferralTreePage from './pages/user/ReferralTreePage';
import WithdrawalPage from './pages/user/WithdrawalPage';
import ProfileKycPage from './pages/user/ProfileKycPage';

// Admin Panel Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageSiteContent from './pages/admin/ManageSiteContent';
import ManageWithdrawals from './pages/admin/ManageWithdrawals';
import TdsReport from './pages/admin/TdsReport';
import ManageUsers from './pages/admin/ManageUsers';

// Route Guards
const ProtectedUserRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-12 text-center text-slate-400">Loading your portal...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const ProtectedAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-12 text-center text-slate-400">Verifying administrator clearance...</div>;
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1">
        <Routes>
          {/* Public Website Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Member Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedUserRoute><UserDashboard /></ProtectedUserRoute>
          } />
          <Route path="/dashboard/captcha" element={
            <ProtectedUserRoute><CaptchaEarnPage /></ProtectedUserRoute>
          } />
          <Route path="/dashboard/tree" element={
            <ProtectedUserRoute><ReferralTreePage /></ProtectedUserRoute>
          } />
          <Route path="/dashboard/wallet" element={
            <ProtectedUserRoute><WithdrawalPage /></ProtectedUserRoute>
          } />
          <Route path="/dashboard/profile" element={
            <ProtectedUserRoute><ProfileKycPage /></ProtectedUserRoute>
          } />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={
            <ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>
          } />
          <Route path="/admin/cms" element={
            <ProtectedAdminRoute><ManageSiteContent /></ProtectedAdminRoute>
          } />
          <Route path="/admin/withdrawals" element={
            <ProtectedAdminRoute><ManageWithdrawals /></ProtectedAdminRoute>
          } />
          <Route path="/admin/tds" element={
            <ProtectedAdminRoute><TdsReport /></ProtectedAdminRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedAdminRoute><ManageUsers /></ProtectedAdminRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
