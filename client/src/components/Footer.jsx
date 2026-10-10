import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

import logo from "../assets/logo.png";

export default function Footer() {
  const { cmsContent } = useAuth();

  const address =
    cmsContent?.officeAddress ||
    "Ganga Shopping Mall, 2nd Floor, Main Agra Road, Dausa, Rajasthan 303303";

  const phone =
    cmsContent?.supportPhone ||
    "+91 8459949190";

  const email =
    cmsContent?.supportEmail ||
    "contact@digital-lyf LYF.com";

  return (
    <footer className="relative overflow-hidden border-t border-violet-100 bg-gradient-to-br from-violet-50 via-white to-orange-50 text-slate-600">

      {/* ============================================================
          BACKGROUND EFFECTS
      ============================================================ */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* Violet glow */}
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />

        {/* Pink glow */}
        <div className="absolute right-[-120px] top-20 h-80 w-80 rounded-full bg-pink-300/20 blur-3xl" />

        {/* Blue glow */}
        <div className="absolute bottom-[-140px] left-[15%] h-80 w-80 rounded-full bg-blue-300/15 blur-3xl" />

        {/* Orange glow */}
        <div className="absolute bottom-[-120px] right-[10%] h-80 w-80 rounded-full bg-orange-300/20 blur-3xl" />

        {/* Emerald glow */}
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-300/15 blur-3xl" />

        {/* Ambient gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-200/10 via-pink-200/10 to-orange-200/10" />
      </div>

      {/* Rainbow top border */}
      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-pink-500 via-orange-400 to-emerald-400" />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">

        {/* ============================================================
            MAIN FOOTER
        ============================================================ */}

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">

          {/* ========================================================
              BRAND
          ======================================================== */}

          <div className="space-y-5">

            <Link
              to="/"
              className="group inline-flex items-center gap-3"
            >

              {/* Rainbow Logo Border */}
              <div className="relative h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-tr from-violet-500 via-pink-500 to-orange-400 p-[2px] shadow-lg shadow-violet-500/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-pink-500/20">

                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[14px] bg-white">

                  <img
                    src={logo}
                    alt="DIGITAL LYF PVT. LTD. Logo"
                    className="h-full w-full object-contain p-1.5"
                  />

                </div>
              </div>

              {/* Company Name */}
              <div>
                <h2 className="bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text text-lg font-black tracking-tight text-transparent">
                  DIGITAL LYF
                </h2>

                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-600">
                  PVT. LTD.
                </p>
              </div>

            </Link>

            <p className="max-w-sm text-sm leading-6 text-slate-500">
              Empowering our digital community with reliable services,
              member support and a secure platform experience.
            </p>

            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 shadow-sm backdrop-blur-xl">

              <ShieldCheck className="h-4 w-4 text-emerald-600" />

              <span className="text-xs font-semibold text-emerald-700">
                Secure & Trusted Platform
              </span>

            </div>

          </div>

          {/* ========================================================
              COMPANY
          ======================================================== */}

          <div>

            <h3 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800">
              <span className="h-5 w-1 rounded-full bg-gradient-to-b from-violet-600 to-pink-500" />
              Company
            </h3>

            <ul className="space-y-3 text-sm">

              <li>
                <Link
                  to="/"
                  className="group flex items-center justify-between text-slate-500 transition-colors hover:text-violet-600"
                >
                  Home Page

                  <ArrowUpRight
                    className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                  />
                </Link>
              </li>

              <li>
                <a
                  href="#products"
                  className="group flex items-center justify-between text-slate-500 transition-colors hover:text-pink-600"
                >
                  Bio-Magnetic Products

                  <ArrowUpRight
                    className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                  />
                </a>
              </li>

              <li>
                <a
                  href="#working-process"
                  className="group flex items-center justify-between text-slate-500 transition-colors hover:text-orange-500"
                >
                  Working Process

                  <ArrowUpRight
                    className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                  />
                </a>
              </li>

              <li>
                <a
                  href="#about"
                  className="group flex items-center justify-between text-slate-500 transition-colors hover:text-violet-600"
                >
                  About DIGITAL LYF

                  <ArrowUpRight
                    className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                  />
                </a>
              </li>

              <li>
                <Link
                  to="/login"
                  className="group flex items-center justify-between text-slate-500 transition-colors hover:text-cyan-600"
                >
                  Distributor Login

                  <ArrowUpRight
                    className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                  />
                </Link>
              </li>

              <li>
                <Link
                  to="/login"
                  className="group flex items-center justify-between bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text font-bold text-transparent transition-opacity hover:opacity-75"
                >
                  Existing Member Login

                  <ArrowUpRight className="h-3.5 w-3.5 text-pink-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </li>

            </ul>
          </div>

          {/* ========================================================
              MEMBER SERVICES
          ======================================================== */}

          <div>

            <h3 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800">
              <span className="h-5 w-1 rounded-full bg-gradient-to-b from-cyan-500 to-emerald-500" />
              Member Services
            </h3>

            <ul className="space-y-3 text-sm">

              <li>
                <Link
                  to="/dashboard/captcha"
                  className="group flex items-center justify-between text-slate-500 transition-colors hover:text-cyan-600"
                >
                  Daily Captcha Workstation

                  <ArrowUpRight
                    className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                  />
                </Link>
              </li>

              <li>
                <Link
                  to="/dashboard/tree"
                  className="group flex items-center justify-between text-slate-500 transition-colors hover:text-emerald-600"
                >
                  Genealogy Network Tree

                  <ArrowUpRight
                    className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                  />
                </Link>
              </li>

              <li>
                <Link
                  to="/dashboard/wallet"
                  className="group flex items-center justify-between text-slate-500 transition-colors hover:text-violet-600"
                >
                  Wallet & TDS Payouts

                  <ArrowUpRight
                    className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                  />
                </Link>
              </li>

              <li>
                <Link
                  to="/dashboard/profile"
                  className="group flex items-center justify-between text-slate-500 transition-colors hover:text-pink-600"
                >
                  PAN & Bank KYC Verification

                  <ArrowUpRight
                    className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                  />
                </Link>
              </li>

              <li className="pt-2">

                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-100 hover:shadow-md"
                >
                  Administrator Access

                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>

              </li>

            </ul>
          </div>

          {/* ========================================================
              HEAD OFFICE
          ======================================================== */}

          <div>

            <h3 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800">
              <span className="h-5 w-1 rounded-full bg-gradient-to-b from-orange-500 to-amber-400" />
              Head Office
            </h3>

            <div className="space-y-3">

              {/* Address */}
              <div className="rounded-2xl border border-violet-100 bg-white/75 p-3 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                    <MapPin className="h-4 w-4 text-violet-600" />
                  </div>

                  <div className="min-w-0">

                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Office Address
                    </p>

                    <p className="text-xs leading-5 text-slate-600">
                      {address}
                    </p>

                  </div>

                </div>
              </div>

              {/* Phone */}
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/75 p-3 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                  <Phone className="h-4 w-4 text-emerald-600" />
                </div>

                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Support Phone
                  </p>

                  <p className="text-xs text-slate-600">
                    {phone}
                  </p>
                </div>

              </a>

              {/* Email */}
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-white/75 p-3 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"
              >

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-50">
                  <Mail className="h-4 w-4 text-pink-600" />
                </div>

                <div className="min-w-0">

                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Email
                  </p>

                  <p className="truncate text-xs text-slate-600">
                    {email}
                  </p>

                </div>

              </a>

            </div>
          </div>

        </div>

        {/* ============================================================
            DIVIDER
        ============================================================ */}

        <div className="my-10 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />

        {/* ============================================================
            BOTTOM BAR
        ============================================================ */}

        <div className="flex flex-col gap-4 text-xs sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-slate-500">
              © {new Date().getFullYear()}{" "}
              <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text font-bold text-transparent">
                DIGITAL LYF PVT. LTD.
              </span>
              . All Rights Reserved.
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Managed through a secure React MERN platform.
            </p>

          </div>

          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">

            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Secure Platform
            </span>

            <span className="text-violet-200">•</span>

            <span>Member Support</span>

            <span className="text-pink-200">•</span>

            <span>DIGITAL LYF PVT. LTD.</span>

          </div>

        </div>

      </div>
    </footer>
  );
}