import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, Phone, Mail, Clock, Wallet, User as UserIcon, 
  LogOut, LayoutDashboard, KeyRound, Sparkles, Menu, X, Network
} from 'lucide-react';

export default function Navbar() {
  const { user, wallet, logout, cmsContent } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const phone = cmsContent?.supportPhone || "+91 98765 43210";
  const email = cmsContent?.supportEmail || "contact@samarthindia.com";
  const hours = cmsContent?.workingHours || "Mon - Sat: 9:00 AM - 6:00 PM";
  const topText = cmsContent?.topBarText || "Welcome to Samarth India Wellness & Rewards Network";

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Contact Strip */}
      <div className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 text-xs py-2 px-4 sm:px-8 text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-slate-300">{topText}</span>
          </div>
          <div className="flex items-center flex-wrap gap-4 text-[11px]">
            <a href={`tel:${phone}`} className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{phone}</span>
            </a>
            <div className="hidden md:flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{hours}</span>
            </div>
            <a href={`mailto:${email}`} className="hidden lg:flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>{email}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Glassmorphic Navbar */}
      <nav className="bg-slate-900/85 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-[2px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
                SAMARTH <span className="text-emerald-400">INDIA</span>
              </div>
              <div className="text-[10px] tracking-wider text-slate-400 uppercase font-semibold">
                Wellness & Chain Network
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 bg-slate-800/50 p-1 rounded-full border border-slate-700/50 text-sm">
            <Link 
              to="/" 
              className={`px-4 py-1.5 rounded-full transition-all ${
                isActive('/') ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Home
            </Link>
            <a 
              href="#products" 
              className="px-4 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
            >
              Products
            </a>
            <a 
              href="#working-process" 
              className="px-4 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
            >
              Process
            </a>
            <a 
              href="#about" 
              className="px-4 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
            >
              About Us
            </a>
            <a 
              href="#rewards" 
              className="px-4 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
            >
              Rewards
            </a>
          </div>

          {/* Right Action / Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* User Wallet Badge */}
                <Link 
                  to="/dashboard/wallet"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:border-emerald-400 transition-colors"
                >
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>₹{wallet?.currentBalance?.toFixed(2) || '0.00'}</span>
                </Link>

                {/* Dashboard Shortcut */}
                {(user.role === 'admin' || user.role === 'superadmin') ? (
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 hover:brightness-110 transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {user.role === 'superadmin' ? '👑 Super Admin' : 'Admin Panel'}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link 
                      to="/dashboard/captcha" 
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-bold hover:bg-teal-500/30 transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                      Solve Captcha
                    </Link>
                    <Link 
                      to="/dashboard" 
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/20"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Dashboard
                    </Link>
                  </div>
                )}

                {/* Logout Button */}
                <button 
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Join Network
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <Link 
                to="/dashboard"
                className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-bold"
              >
                ₹{wallet?.currentBalance?.toFixed(0) || '0'}
              </Link>
            )}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-800 space-y-2 text-sm">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md hover:bg-slate-800 text-slate-200">Home</Link>
            <a href="#products" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md hover:bg-slate-800 text-slate-200">Products</a>
            <a href="#working-process" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md hover:bg-slate-800 text-slate-200">Working Process</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md hover:bg-slate-800 text-slate-200">About Us</a>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md bg-emerald-600/30 text-emerald-300 font-semibold">Member Dashboard</Link>
                <Link to="/dashboard/captcha" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md hover:bg-slate-800 text-teal-300">Earn from Captchas</Link>
                <Link to="/dashboard/tree" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md hover:bg-slate-800 text-slate-200">My Referral Tree</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md bg-amber-600/30 text-amber-300 font-semibold">Admin Panel</Link>
                )}
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-red-400">Sign Out</button>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 rounded-lg bg-slate-800 text-white font-semibold">Log In</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 rounded-lg bg-emerald-600 text-white font-bold">Join Now</Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
