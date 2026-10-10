import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

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

              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Access your distributor dashboard & digital workstation
              </p>

            </div>


            {/* =====================================================
                QUICK LOGIN
            ===================================================== */}

            <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-br from-violet-50 via-white to-orange-50 border border-violet-100">

              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">

                <KeyRound className="w-3.5 h-3.5 text-orange-500" />

                <span>
                  Click to fill credentials
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


            {/* =====================================================
                FORM
            ===================================================== */}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              {/* Error */}

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">

                  <AlertCircle className="w-4 h-4 shrink-0" />

                  <span>
                    {error}
                  </span>

                </div>
              )}


              {/* User Code / Email */}

              <div>

                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  User Code or Email
                </label>

                <div className="relative">

                  <User className="w-4 h-4 text-violet-500 absolute left-3.5 top-3.5" />

                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) =>
                      setLoginId(e.target.value)
                    }
                    placeholder="e.g. SUPER001 or SI681908"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono text-xs placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all uppercase"
                  />

                </div>

              </div>


              {/* Password */}

              <div>

                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Password
                </label>

                <div className="relative">

                  <Lock className="w-4 h-4 text-cyan-500 absolute left-3.5 top-3.5" />

                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                  />

                </div>

              </div>


              {/* ===================================================
                  LOGIN BUTTON
              =================================================== */}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white overflow-hidden bg-gradient-to-r from-violet-600 via-pink-500 to-orange-400 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
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


            {/* =====================================================
                REGISTER
            ===================================================== */}

            <div className="mt-7 text-center text-xs text-slate-500">

              Have an activation PIN?{' '}

              <Link
                to="/activate-account"
                className="font-bold bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
              >
                Activate your account
              </Link>

            </div>


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