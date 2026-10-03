import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  Phone,
  Mail,
  Clock,
  Wallet,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  KeyRound,
  Menu,
  X,
} from "lucide-react";

import logo from "../assets/logo.png";

export default function Navbar() {
  const { user, wallet, logout, cmsContent } = useAuth();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  // ==========================================================
  // CMS DATA
  // ==========================================================

  const phone =
    cmsContent?.supportPhone ||
    "+91 98765 43210";

  const email =
    cmsContent?.supportEmail ||
    "contact@samarthindia.com";

  const hours =
    cmsContent?.workingHours ||
    "Mon - Sat: 9:00 AM - 6:00 PM";

  const topText =
    cmsContent?.topBarText ||
    "Welcome to DIGITAL LYF PVT. LTD. Wellness & Rewards Network";

  // ==========================================================
  // ROUTE HELPERS
  // ==========================================================

  const isActive = (path) =>
    location.pathname === path;

  /*
   * IMPORTANT:
   * CAPTCHA page वर mobile मध्ये पूर्ण Navbar hide करायचा.
   *
   * Desktop / tablet वर Navbar दिसेल.
   */
  const isCaptchaPage =
    location.pathname.replace(/\/+$/, "") ===
    "/dashboard/captcha";

  // ==========================================================
  // NAV STYLES
  // ==========================================================

  // CHANGED: smaller padding/text between lg and xl so links fit on 1024px laptops
  const navButton =
    "group relative rounded-full border border-transparent px-2.5 py-2 text-sm font-medium text-slate-600 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md xl:px-4 xl:text-base";

  const mobileButton =
    "block w-full rounded-xl px-4 py-2.5 font-medium text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm";

  // ==========================================================
  // CLOSE MOBILE MENU ON ROUTE CHANGE
  // ==========================================================

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // ==========================================================
  // BODY SCROLL SAFETY
  // Prevent accidental body scroll lock from mobile menu
  // ==========================================================

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add(
        "navbar-mobile-menu-open"
      );
    } else {
      document.body.classList.remove(
        "navbar-mobile-menu-open"
      );
    }

    return () => {
      document.body.classList.remove(
        "navbar-mobile-menu-open"
      );
    };
  }, [mobileMenuOpen]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <header
      className={`
        sticky top-0 z-50 w-full
        ${
          isCaptchaPage
            ? "hidden md:block"
            : "block"
        }
      `}
    >
      {/* ========================================================
          TOP CONTACT STRIP
      ======================================================== */}

      <div
        className="
          relative overflow-hidden
          bg-gradient-to-r
          from-violet-600
          via-fuchsia-500
          via-pink-500
          to-orange-400
          px-4 py-2
          text-xs shadow-sm
          sm:px-8
        "
      >
        <div className="pointer-events-none absolute inset-0 bg-white/10" />

        {/* CHANGED: flex-col -> always flex-row, added gap-3 (no more 2-line stack on mobile) */}
        <div
          className="
            relative mx-auto flex max-w-7xl
            flex-row items-center justify-between
            gap-3
          "
        >
          {/* Welcome Text */}
          {/* CHANGED: added min-w-0 so the text can shrink and truncate */}
          <div className="flex min-w-0 items-center gap-2 text-white">
            {/* CHANGED: added shrink-0 so the dot never squishes */}
            <span
              className="
                inline-block h-2 w-2 shrink-0
                animate-pulse rounded-full
                bg-white shadow-sm
              "
            />

            {/* CHANGED: added truncate */}
            <span className="truncate font-semibold">
              {topText}
            </span>
          </div>

          {/* Contact Information */}
          {/* CHANGED: flex-wrap -> shrink-0 (stays on one line, never wraps) */}
          <div
            className="
              flex shrink-0 items-center
              gap-4 text-[11px]
              text-white/95
            "
          >
            <a
              href={`tel:${phone}`}
              className="
                flex items-center gap-1.5
                transition-all duration-200
                hover:-translate-y-0.5
                hover:text-yellow-100
              "
            >
              <Phone className="h-3.5 w-3.5" />
              <span>{phone}</span>
            </a>

            <div
              className="
                hidden items-center gap-1.5
                md:flex
              "
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{hours}</span>
            </div>

            <a
              href={`mailto:${email}`}
              className="
                hidden items-center gap-1.5
                transition-all duration-200
                hover:-translate-y-0.5
                hover:text-yellow-100
                lg:flex
              "
            >
              <Mail className="h-3.5 w-3.5" />
              <span>{email}</span>
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================
          MAIN NAVBAR
      ======================================================== */}

      <nav
        className="
          relative border-b border-white/60
          bg-white/90 px-4 py-3.5
          shadow-md backdrop-blur-xl
          transition-all sm:px-8
        "
      >
        {/* Soft Rainbow Background Glow */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="
              absolute -left-10 -top-16
              h-40 w-40 rounded-full
              bg-violet-400/10 blur-3xl
            "
          />

          <div
            className="
              absolute left-[30%] -top-16
              h-40 w-40 rounded-full
              bg-pink-400/10 blur-3xl
            "
          />

          <div
            className="
              absolute left-[55%] -top-16
              h-40 w-40 rounded-full
              bg-blue-400/10 blur-3xl
            "
          />

          <div
            className="
              absolute -right-10 -top-16
              h-40 w-40 rounded-full
              bg-orange-400/10 blur-3xl
            "
          />

          <div
            className="
              absolute bottom-[-50px]
              left-1/2 h-32 w-32
              -translate-x-1/2 rounded-full
              bg-emerald-400/10 blur-3xl
            "
          />
        </div>

        <div className="relative mx-auto max-w-7xl">
          {/* ====================================================
              DESKTOP / MAIN ROW
          ==================================================== */}

          {/* CHANGED: added gap-3 so groups never touch each other */}
          <div className="flex items-center justify-between gap-3">
            {/* ==================================================
                BRAND LOGO + COMPANY NAME
            ================================================== */}

            {/* CHANGED: added min-w-0 so the company name can truncate */}
            <Link
              to="/"
              className="group flex min-w-0 items-center gap-3"
            >
              {/* Logo */}

              <div
                className="
                  relative h-11 w-11
                  shrink-0 sm:h-12 sm:w-12
                "
              >
                <div
                  className="
                    absolute inset-0
                    rounded-xl
                    bg-gradient-to-tr
                    from-violet-500
                    via-pink-500
                    via-orange-400
                    to-emerald-400
                    p-[2px] shadow-lg
                    transition-all duration-300
                    group-hover:scale-105
                    group-hover:shadow-pink-500/20
                  "
                >
                  <div
                    className="
                      flex h-full w-full
                      items-center justify-center
                      overflow-hidden rounded-[10px]
                      bg-white
                    "
                  >
                    <img
                      src={logo}
                      alt="DIGITAL LYF PVT. LTD. Logo"
                      className="
                        h-full w-full
                        object-contain p-1
                      "
                    />
                  </div>
                </div>
              </div>

              {/* Company Name */}
              {/* CHANGED: always visible on ALL screens. Font size is smaller
                  between lg and xl (text-base) so the desktop row still fits,
                  and full size (text-xl) from xl up. truncate + min-w-0 shorten
                  the name with "…" instead of breaking the layout. */}
              <div className="min-w-0">
                <div
                  className="
                    truncate
                    bg-gradient-to-r
                    from-violet-600
                    via-pink-500
                    to-orange-500
                    bg-clip-text
                    text-[13px] font-bold
                    leading-tight tracking-tight
                    text-transparent
                    min-[400px]:text-base
                    sm:text-xl
                    lg:text-base
                    xl:text-xl
                  "
                >
                  DIGITAL LYF PVT. LTD.
                </div>

                <div
                  className="
                    truncate
                    text-[9px]
                    font-semibold uppercase
                    tracking-wider
                    text-slate-500
                    sm:text-[10px]
                  "
                >
                  Wellness & Chain Network
                </div>
              </div>
            </Link>

            {/* ==================================================
                DESKTOP NAV LINKS
            ================================================== */}

            {/* CHANGED: md:flex -> lg:flex (768px was too narrow for links + buttons) */}
            <div
              className="
                hidden items-center gap-1
                rounded-full
                border border-slate-200
                bg-white/75 p-1
                shadow-sm backdrop-blur-md
                lg:flex
              "
            >
              {/* Home */}

              <Link
                to="/"
                className={`${navButton} ${
                  isActive("/")
                    ? `
                      bg-gradient-to-r
                      from-violet-600
                      via-pink-500
                      to-orange-400
                      text-white shadow-md
                    `
                    : `
                      hover:border-violet-200
                      hover:bg-gradient-to-r
                      hover:from-violet-50
                      hover:to-pink-50
                      hover:text-violet-700
                    `
                }`}
              >
                Home
              </Link>

              {/* Products */}

              <a
                href="#products"
                className={`
                  ${navButton}
                  hover:border-pink-200
                  hover:bg-gradient-to-r
                  hover:from-pink-50
                  hover:to-orange-50
                  hover:text-pink-700
                `}
              >
                Products
              </a>

              {/* Process */}

              <a
                href="#working-process"
                className={`
                  ${navButton}
                  hover:border-blue-200
                  hover:bg-gradient-to-r
                  hover:from-blue-50
                  hover:to-violet-50
                  hover:text-blue-700
                `}
              >
                Process
              </a>

              {/* About */}

              <a
                href="#about"
                className={`
                  ${navButton}
                  hover:border-emerald-200
                  hover:bg-gradient-to-r
                  hover:from-emerald-50
                  hover:to-blue-50
                  hover:text-emerald-700
                `}
              >
                About Us
              </a>

              {/* Rewards */}

              <a
                href="#rewards"
                className={`
                  ${navButton}
                  hover:border-orange-200
                  hover:bg-gradient-to-r
                  hover:from-orange-50
                  hover:to-pink-50
                  hover:text-orange-600
                `}
              >
                Rewards
              </a>
            </div>

            {/* ==================================================
                DESKTOP RIGHT ACTION / AUTH BUTTONS
            ================================================== */}

            {/* CHANGED: md:flex -> lg:flex, added shrink-0 */}
            <div
              className="
                hidden shrink-0 items-center gap-3
                lg:flex
              "
            >
              {user ? (
                <div className="flex items-center gap-3">
                  {/* Wallet */}

                  <Link
                    to="/dashboard/wallet"
                    className="
                      flex items-center gap-2
                      rounded-lg
                      border border-emerald-200
                      bg-gradient-to-r
                      from-emerald-50
                      to-teal-50
                      px-3 py-2
                      text-xs font-semibold
                      text-emerald-700
                      shadow-sm
                      transition-all duration-300
                      hover:-translate-y-0.5
                      hover:border-emerald-400
                      hover:shadow-md
                    "
                  >
                    <Wallet className="h-4 w-4 text-emerald-600" />

                    <span>
                      ₹
                      {wallet?.currentBalance?.toFixed(
                        2
                      ) || "0.00"}
                    </span>
                  </Link>

                  {/* Admin */}

                  {user.role === "admin" ||
                  user.role === "superadmin" ? (
                    <Link
                      to="/admin"
                      className="
                        flex items-center gap-1.5
                        rounded-lg
                        bg-gradient-to-r
                        from-orange-500
                        via-pink-500
                        to-violet-600
                        px-4 py-2
                        text-xs font-bold
                        text-white shadow-md
                        transition-all duration-300
                        hover:-translate-y-0.5
                        hover:brightness-110
                        hover:shadow-lg
                      "
                    >
                      <LayoutDashboard className="h-4 w-4" />

                      {user.role ===
                      "superadmin"
                        ? "👑 Super Admin"
                        : "Admin Panel"}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">
                      {/* Captcha */}

                      {/* CHANGED: added title + label hidden between lg and xl (icon stays) */}
                      <Link
                        to="/dashboard/captcha"
                        title="Solve Captcha"
                        className="
                          flex items-center gap-1.5
                          rounded-lg
                          border border-cyan-200
                          bg-gradient-to-r
                          from-cyan-50
                          to-blue-50
                          px-3 py-2
                          text-xs font-bold
                          text-cyan-700
                          shadow-sm
                          transition-all duration-300
                          hover:-translate-y-0.5
                          hover:border-cyan-400
                          hover:shadow-md
                        "
                      >
                        <KeyRound className="h-3.5 w-3.5 text-cyan-600" />

                        <span className="hidden xl:inline">
                          Solve Captcha
                        </span>
                      </Link>

                      {/* Dashboard */}

                      <Link
                        to="/dashboard"
                        className="
                          flex items-center gap-1.5
                          rounded-lg
                          bg-gradient-to-r
                          from-violet-600
                          via-pink-500
                          to-orange-400
                          px-3.5 py-2
                          text-xs font-bold
                          text-white shadow-md
                          transition-all duration-300
                          hover:-translate-y-0.5
                          hover:brightness-110
                          hover:shadow-lg
                        "
                      >
                        <LayoutDashboard className="h-3.5 w-3.5" />

                        Dashboard
                      </Link>
                    </div>
                  )}

                  {/* Logout */}

                  <button
                    onClick={logout}
                    title="Sign out"
                    className="
                      rounded-lg p-2
                      text-slate-500
                      transition-all duration-300
                      hover:-translate-y-0.5
                      hover:bg-red-50
                      hover:text-red-500
                      hover:shadow-sm
                    "
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Login */}

                  <Link
                    to="/login"
                    className="
                      rounded-lg px-4 py-2
                      text-xs font-semibold
                      text-slate-600
                      transition-all duration-300
                      hover:-translate-y-0.5
                      hover:bg-violet-50
                      hover:text-violet-600
                      hover:shadow-sm
                    "
                  >
                    Log In
                  </Link>

                  {/* Join Network */}

                  <Link
                    to="/register"
                    className="
                      flex items-center gap-1.5
                      rounded-lg
                      bg-gradient-to-r
                      from-violet-600
                      via-pink-500
                      to-orange-400
                      px-4 py-2
                      text-xs font-bold
                      text-white shadow-lg
                      transition-all duration-300
                      hover:-translate-y-0.5
                      hover:scale-[1.02]
                      hover:brightness-110
                      hover:shadow-xl
                    "
                  >
                    <UserIcon className="h-3.5 w-3.5" />

                    Join Network
                  </Link>
                </div>
              )}
            </div>

            {/* ==================================================
                MOBILE ACTIONS
            ================================================== */}

            {/* CHANGED: md:hidden -> lg:hidden, added shrink-0 */}
            <div className="flex shrink-0 items-center gap-2 lg:hidden">
              {user && (
                <Link
                  to="/dashboard"
                  className="
                    rounded-lg
                    bg-gradient-to-r
                    from-violet-600
                    to-pink-500
                    px-3 py-1.5
                    text-xs font-bold
                    text-white shadow-sm
                    transition-all duration-300
                    hover:-translate-y-0.5
                    hover:shadow-md
                  "
                >
                  ₹
                  {wallet?.currentBalance?.toFixed(
                    0
                  ) || "0"}
                </Link>
              )}

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(
                    (previous) => !previous
                  )
                }
                aria-label={
                  mobileMenuOpen
                    ? "Close menu"
                    : "Open menu"
                }
                aria-expanded={
                  mobileMenuOpen
                }
                className="
                  rounded-xl p-2
                  text-slate-600
                  transition-all duration-300
                  hover:-translate-y-0.5
                  hover:bg-violet-50
                  hover:text-violet-600
                  hover:shadow-sm
                "
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* CHANGED: the separate "MOBILE COMPANY NAME" row was removed.
              The name now sits beside the logo (see Brand section above),
              so the mobile bar is one clean row instead of two. */}

          {/* ====================================================
              MOBILE DROPDOWN
          ==================================================== */}

          {/* CHANGED: md:hidden -> lg:hidden, and added max-h + overflow-y-auto
              so a long menu can be scrolled on small phones (the header is
              sticky, so without this the bottom items were unreachable). */}
          {mobileMenuOpen && (
            <div
              className="
                relative mt-4 space-y-2
                max-h-[calc(100dvh-8rem)]
                overflow-y-auto overscroll-contain
                border-t border-slate-200
                pt-4 lg:hidden
              "
            >
              {/* Home */}

              <Link
                to="/"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className={`${mobileButton} ${
                  isActive("/")
                    ? `
                      bg-gradient-to-r
                      from-violet-600
                      via-pink-500
                      to-orange-400
                      font-bold
                      text-white shadow-md
                    `
                    : `
                      hover:bg-violet-50
                      hover:text-violet-700
                    `
                }`}
              >
                Home
              </Link>

              {/* Products */}

              <a
                href="#products"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className={`
                  ${mobileButton}
                  hover:bg-gradient-to-r
                  hover:from-pink-50
                  hover:to-orange-50
                  hover:text-pink-700
                `}
              >
                Products
              </a>

              {/* Process */}

              <a
                href="#working-process"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className={`
                  ${mobileButton}
                  hover:bg-gradient-to-r
                  hover:from-blue-50
                  hover:to-violet-50
                  hover:text-blue-700
                `}
              >
                Working Process
              </a>

              {/* About */}

              <a
                href="#about"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className={`
                  ${mobileButton}
                  hover:bg-gradient-to-r
                  hover:from-emerald-50
                  hover:to-blue-50
                  hover:text-emerald-700
                `}
              >
                About Us
              </a>

              {/* Rewards */}

              <a
                href="#rewards"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className={`
                  ${mobileButton}
                  hover:bg-gradient-to-r
                  hover:from-orange-50
                  hover:to-pink-50
                  hover:text-orange-600
                `}
              >
                Rewards
              </a>

              {/* =================================================
                  AUTHENTICATED MOBILE MENU
              ================================================= */}

              {user ? (
                <>
                  {/* Dashboard */}

                  <Link
                    to="/dashboard"
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    className={`
                      ${mobileButton}
                      bg-gradient-to-r
                      from-violet-50
                      to-pink-50
                      text-violet-700
                      hover:from-violet-100
                      hover:to-pink-100
                    `}
                  >
                    Member Dashboard
                  </Link>

                  {/* Captcha */}

                  <Link
                    to="/dashboard/captcha"
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    className={`
                      ${mobileButton}
                      hover:bg-cyan-50
                      hover:text-cyan-700
                    `}
                  >
                    Earn from Captchas
                  </Link>

                  {/* Tree */}

                  <Link
                    to="/dashboard/tree"
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    className={`
                      ${mobileButton}
                      hover:bg-emerald-50
                      hover:text-emerald-700
                    `}
                  >
                    My Referral Tree
                  </Link>

                  {/* Wallet */}

                  <Link
                    to="/dashboard/wallet"
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    className={`
                      ${mobileButton}
                      hover:bg-violet-50
                      hover:text-violet-700
                    `}
                  >
                    Wallet & Earnings
                  </Link>

                  {/* Profile */}

                  <Link
                    to="/dashboard/profile"
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    className={`
                      ${mobileButton}
                      hover:bg-pink-50
                      hover:text-pink-700
                    `}
                  >
                    My Profile
                  </Link>

                  {/* Admin */}

                  {(user.role === "admin" ||
                    user.role ===
                      "superadmin") && (
                    <Link
                      to="/admin"
                      onClick={() =>
                        setMobileMenuOpen(
                          false
                        )
                      }
                      className={`
                        ${mobileButton}
                        bg-gradient-to-r
                        from-orange-50
                        to-pink-50
                        font-bold
                        text-orange-700
                        hover:from-orange-100
                        hover:to-pink-100
                      `}
                    >
                      {user.role ===
                      "superadmin"
                        ? "👑 Super Admin"
                        : "Admin Panel"}
                    </Link>
                  )}

                  {/* Logout */}

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="
                      block w-full rounded-xl
                      px-4 py-2.5
                      text-left font-medium
                      text-red-500
                      transition-all duration-300
                      hover:-translate-y-0.5
                      hover:bg-red-50
                      hover:shadow-sm
                    "
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                /* =================================================
                   GUEST MOBILE MENU
                ================================================= */

                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    to="/login"
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    className="
                      w-full rounded-xl
                      border border-slate-200
                      bg-white py-2.5
                      text-center font-semibold
                      text-slate-700 shadow-sm
                      transition-all duration-300
                      hover:-translate-y-0.5
                      hover:border-violet-200
                      hover:bg-violet-50
                      hover:text-violet-700
                      hover:shadow-md
                    "
                  >
                    Log In
                  </Link>

                  <Link
                    to="/register"
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    className="
                      w-full rounded-xl
                      bg-gradient-to-r
                      from-violet-600
                      via-pink-500
                      to-orange-400
                      py-2.5
                      text-center font-bold
                      text-white shadow-md
                      transition-all duration-300
                      hover:-translate-y-0.5
                      hover:brightness-110
                      hover:shadow-lg
                    "
                  >
                    Join Now
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}