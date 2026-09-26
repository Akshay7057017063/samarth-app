import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  User, Settings, Calendar, Award, IndianRupee, Users, 
  Layers, ArrowLeft, ArrowRight, TrendingUp, Check, Copy,
  CreditCard, ShieldCheck, KeyRound, Sparkles, AlertCircle
} from 'lucide-react';

export default function UserDashboard() {
  const { user, wallet, logout } = useAuth();
  const [copiedLeft, setCopiedLeft] = useState(false);
  const [copiedRight, setCopiedRight] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const origin = window.location.origin;
  const userCode = user?.userCode || user?.memberId || 'SI681908';
  const leftReferralLink = `${origin}/register?ref=${userCode}&pos=1`;
  const rightReferralLink = `${origin}/register?ref=${userCode}&pos=2`;

  const copyLink = (text, isLeft) => {
    navigator.clipboard.writeText(text);
    if (isLeft) {
      setCopiedLeft(true);
      setTimeout(() => setCopiedLeft(false), 2000);
    } else {
      setCopiedRight(true);
      setTimeout(() => setCopiedRight(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 antialiased font-sans">
      
      {/* Top Customer Header Bar (Identical to Screenshot) */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 via-emerald-500 to-teal-600 p-[2px] shadow-sm">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="text-base font-black tracking-tight text-slate-800 leading-none">
                  Samarth<span className="text-emerald-600">India</span>
                </div>
                <div className="text-[9px] text-slate-500 font-semibold tracking-wide uppercase">
                  Organics & Wellness
                </div>
              </div>
            </Link>

            <div className="border-l border-slate-200 pl-4">
              <div className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Welcome {user?.name || 'Mahesh rajendra jondhale'} ({userCode})</span>
                <span>👋</span>
              </div>
              <div className="text-xs text-slate-500">
                Here's what's happening with your store today.
              </div>
            </div>
          </div>

          {/* User Profile on Right */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow">
              {user?.name?.charAt(0) || 'M'}
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {user?.name?.split(' ')[0] || 'Mahesh'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium capitalize">
                {user?.role === 'admin' ? 'Admin' : (user?.rank || 'Distributor')}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Navigation Sub-Bar (Matches Screenshot Menu: Dashboard, Profile, Commission, Team, etc.) */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-6 overflow-x-auto text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'dashboard' ? 'border-purple-600 text-purple-600 font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span>Dashboard</span>
          </button>
          
          <Link
            to="/dashboard/profile"
            className="py-2 px-3 border-b-2 border-transparent hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            Profile
          </Link>
          
          <Link
            to="/dashboard/tree"
            className="py-2 px-3 border-b-2 border-transparent hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            Team
          </Link>

          <Link
            to="/dashboard/captcha"
            className="py-2 px-3 border-b-2 border-transparent text-emerald-600 font-bold hover:text-emerald-700 transition-colors whitespace-nowrap flex items-center gap-1"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Captcha Workstation</span>
          </Link>

          <Link
            to="/dashboard/wallet"
            className="py-2 px-3 border-b-2 border-transparent hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            Withdraw (TDS)
          </Link>

          <button
            onClick={() => alert(`Your Pin Wallet Balance: 1 Active Package Pin available for ${userCode}`)}
            className="py-2 px-3 border-b-2 border-transparent hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            Pin Management
          </button>

          <button
            onClick={() => alert('Franchise Desk: Apply for district or pin-code franchise to earn 5% extra on store stock.')}
            className="py-2 px-3 border-b-2 border-transparent hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            Add Franchise
          </button>

          <button
            onClick={() => alert('Topup / Upgrade: Select Bio-Magnetic Single Mat (100 PV) or Double Bed Package.')}
            className="py-2 px-3 border-b-2 border-transparent hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            Topup
          </button>

          <button
            onClick={logout}
            className="py-2 px-3 border-b-2 border-transparent text-red-500 hover:text-red-700 transition-colors whitespace-nowrap ml-auto"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        
        {/* Title and Breadcrumb */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">
            Dashboard
          </h1>
          <div className="text-xs text-slate-400">
            / Dashboard
          </div>
        </div>

        {/* 5 Top Colored Income Cards (Exact Match to Screenshot!) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* 1. Matching Income (Orange) */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 text-white shadow-md relative overflow-hidden flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-amber-100">Matching Income</div>
              <div className="text-3xl font-black mt-2">
                {user?.matchingIncome || 0}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-900/80 flex items-center justify-center shadow-inner">
              <span className="font-bold text-base">₹</span>
            </div>
          </div>

          {/* 2. Today's Matching Income (Purple) */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-5 text-white shadow-md relative overflow-hidden flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-purple-100">Today's Matching Income</div>
              <div className="text-3xl font-black mt-2">
                {user?.todayMatchingIncome || 0}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-900/80 flex items-center justify-center shadow-inner">
              <span className="font-bold text-base">₹</span>
            </div>
          </div>

          {/* 3. Franchise Referral Income (Blue) */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 text-white shadow-md relative overflow-hidden flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-blue-100">Franchise Referral Income</div>
              <div className="text-3xl font-black mt-2">
                {user?.franchiseReferralIncome || 0}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-900/80 flex items-center justify-center shadow-inner">
              <span className="font-bold text-base">₹</span>
            </div>
          </div>

          {/* 4. Franchise Matching Income (Red-Orange) */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-5 text-white shadow-md relative overflow-hidden flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-orange-100">Franchise Matching Income</div>
              <div className="text-3xl font-black mt-2">
                {user?.franchiseMatchingIncome || 0}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-900/80 flex items-center justify-center shadow-inner">
              <span className="font-bold text-base">₹</span>
            </div>
          </div>

          {/* 5. Total Income (Green) */}
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl p-5 text-white shadow-md relative overflow-hidden flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-emerald-100">Total Income</div>
              <div className="text-3xl font-black mt-2">
                {user?.totalIncome || 0}
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-900/80 flex items-center justify-center shadow-inner">
              <span className="font-bold text-base">₹</span>
            </div>
          </div>

        </div>

        {/* Main Grid: Stat Badges + Side Promotion Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Columns (3x5 Grid of White Metric Cards) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* User Code */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="text-[11px] text-slate-500 font-medium">User Code</div>
                <div className="text-sm font-black text-slate-900 font-mono truncate">{userCode}</div>
              </div>
            </div>

            {/* Sponsor Code */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="text-[11px] text-slate-500 font-medium">Sponsor Code</div>
                <div className="text-sm font-black text-slate-900 font-mono truncate">{user?.sponsorCode || 'SI107476'}</div>
              </div>
            </div>

            {/* Date Of Entry */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="text-[11px] text-slate-500 font-medium">Date Of Entry</div>
                <div className="text-sm font-black text-slate-900 truncate">{user?.dateOfEntry || '04/08/2026'}</div>
              </div>
            </div>

            {/* User Type */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">User Type</div>
                <div className="text-sm font-black text-slate-900 font-mono">{user?.userType || 'UNPAID'}</div>
              </div>
            </div>

            {/* Activation Date */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Activation Date</div>
                <div className="text-sm font-black text-slate-900">{user?.activationDate || '-'}</div>
              </div>
            </div>

            {/* Joining Package */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Joining Package</div>
                <div className="text-sm font-black text-slate-900">{user?.joiningPackage || '-'}</div>
              </div>
            </div>

            {/* Left Count */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Left Count</div>
                <div className="text-sm font-black text-slate-900 font-mono">{user?.leftCount ?? 5}</div>
              </div>
            </div>

            {/* Right Count */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Right Count</div>
                <div className="text-sm font-black text-slate-900 font-mono">{user?.rightCount ?? 0}</div>
              </div>
            </div>

            {/* Left Business */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Left Business</div>
                <div className="text-sm font-black text-slate-900 font-mono">{user?.leftBusiness ?? 10800}</div>
              </div>
            </div>

            {/* Right Business */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Right Business</div>
                <div className="text-sm font-black text-slate-900 font-mono">{user?.rightBusiness ?? 0}</div>
              </div>
            </div>

            {/* Total Referral */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Total Referral</div>
                <div className="text-sm font-black text-slate-900 font-mono">{user?.totalReferral ?? 0}</div>
              </div>
            </div>

            {/* Active Referral */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Active Referral</div>
                <div className="text-sm font-black text-slate-900 font-mono">{user?.activeReferral ?? 0}</div>
              </div>
            </div>

            {/* Left PV */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Left PV</div>
                <div className="text-sm font-black text-slate-900 font-mono">{user?.leftPv ?? 60}</div>
              </div>
            </div>

            {/* Right PV */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Right PV</div>
                <div className="text-sm font-black text-slate-900 font-mono">{user?.rightPv ?? 0}</div>
              </div>
            </div>

            {/* Left Carry Forward PV */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Left Carry Forward PV</div>
                <div className="text-sm font-black text-slate-900 font-mono">{user?.leftCarryForwardPv ?? 60}</div>
              </div>
            </div>

            {/* Right Carry Forward PV */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                <ArrowRight className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Right Carry Forward PV</div>
                <div className="text-sm font-black text-slate-900 font-mono">{user?.rightCarryForwardPv ?? 0}</div>
              </div>
            </div>

            {/* My Rank */}
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3 sm:col-span-2">
              <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">My Rank</div>
                <div className="text-sm font-black text-slate-900">{user?.rank || 'Distributor'}</div>
              </div>
            </div>

          </div>

          {/* Right Column: Promotional & Team Cards */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Boost up your Revenue Card */}
            <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
              <h3 className="text-xl font-bold leading-tight">
                Boost up your Revenue
              </h3>
              <p className="text-xs text-amber-50 mt-1">
                by upgrading your increase Revenue.
              </p>
              <button
                onClick={() => alert('Upgrade to Bio-Magnetic Double Bed Package to activate binary pair matching!')}
                className="mt-6 px-6 py-2 rounded-lg border border-white/60 bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all shadow-sm"
              >
                Upgrade Now
              </button>
            </div>

            {/* Team Summary Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900">
                Team
              </h4>
              
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Total Team</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[11px]">{user?.teamPercent || '15%'}</span>
                    <span className="font-bold text-slate-900">{user?.totalTeam ?? 5}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Active Team</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[11px]">{user?.teamPercent || '15%'}</span>
                    <span className="font-bold text-slate-900">{user?.activeTeam ?? 5}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Captcha Task Earning Shortcut */}
            <div className="bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>Daily Captcha Task Earning</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Solve up to 50 verification captchas daily to earn instant cash in your wallet.
              </p>
              <Link
                to="/dashboard/captcha"
                className="block text-center py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Open Captcha Workstation →
              </Link>
            </div>

          </div>

        </div>

        {/* Binary Referral Links Section (Left & Right Leg Links) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Left Side Referral Link */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-slate-900">
              Left Side Referral Link
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={leftReferralLink}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-600 truncate"
              />
              <button
                onClick={() => copyLink(leftReferralLink, true)}
                className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold transition-colors shrink-0 shadow-sm"
              >
                {copiedLeft ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Right Side Referral Link */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-slate-900">
              Right Side Referral Link
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={rightReferralLink}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-600 truncate"
              />
              <button
                onClick={() => copyLink(rightReferralLink, false)}
                className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold transition-colors shrink-0 shadow-sm"
              >
                {copiedRight ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

        </div>

        {/* Latest News Section */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-2">
          <h4 className="text-sm font-bold text-slate-900">
            Latest News
          </h4>
          <div className="text-xs text-slate-500 leading-relaxed">
            Welcome to Samarth India Organics & Wellness. The new quarterly binary pair matching bonus is live. Activate your Right Leg to start matching the 60 Left Carry Forward PV!
          </div>
        </div>

      </div>

      {/* Customer Footer Bar (Exact Match) */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        Copyright 2025 © Samarth India Organics & Wellness India Private Limited
      </footer>

    </div>
  );
}
