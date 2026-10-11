import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

import API_BASE_URL from "../config/api";
import { createDeviceProof } from "../utils/deviceKey";

// =====================================================
// /activate-account
// Public account activation page
// =====================================================
//
// Customer cannot login while inactive.
//
// Flow:
//
// Admin
//   ↓
// Sends 6-digit activation PIN by email
//   ↓
// Customer opens this page
//   ↓
// Member ID / Email + PIN
//   ↓
// POST /api/auth/activate
//   ↓
// Account becomes ACTIVE
//   ↓
// Customer can login
// =====================================================

export default function ActivateAccountPage() {
  const navigate =
    useNavigate();

  const [identifier, setIdentifier] =
    useState("");

  const [pin, setPin] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ===================================================
  // SUBMIT ACTIVATION
  // ===================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanIdentifier =
      String(
        identifier || ""
      ).trim();

    const cleanPin =
      String(pin || "").trim();

    // -------------------------------------------------
    // IDENTIFIER VALIDATION
    // -------------------------------------------------

    if (!cleanIdentifier) {
      setError(
        "Please enter your Member ID or Email."
      );
      return;
    }

    // -------------------------------------------------
    // PIN VALIDATION
    // -------------------------------------------------

    if (!/^\d{6}$/.test(cleanPin)) {
      setError(
        "Activation PIN must be exactly 6 digits."
      );
      return;
    }

    setLoading(true);

    try {
      // This browser becomes the first trusted device
      const deviceProof =
        await createDeviceProof(
          "activate",
          cleanIdentifier
        );

      const res =
        await fetch(
          `${API_BASE_URL}/auth/activate`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              identifier:
                cleanIdentifier,

              pin:
                cleanPin,

              deviceProof,
            }),
          }
        );

      // ------------------------------------------------
      // SAFE RESPONSE PARSING
      // ------------------------------------------------

      const contentType =
        res.headers.get(
          "content-type"
        ) || "";

      let data;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await res.json();
      } else {
        const text =
          await res.text();

        data = {
          success: false,
          message:
            text ||
            `Request failed with status ${res.status}.`,
        };
      }

      // ------------------------------------------------
      // BACKEND ERROR
      // ------------------------------------------------

      if (
        !res.ok ||
        !data?.success
      ) {
        setError(
          data?.message ||
            "Account activation failed."
        );

        return;
      }

      // ------------------------------------------------
      // SUCCESS
      // ------------------------------------------------

      setSuccess(
        data?.message ||
          "Account activated successfully. You can now login."
      );

      // Clear PIN after successful activation.
      setPin("");

      // ------------------------------------------------
      // AUTO REDIRECT
      // ------------------------------------------------
      //
      // Give the customer a moment to read the success
      // message, then send them to Login.
      // ------------------------------------------------

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 2000);
    } catch (error) {
      console.error(
        "❌ ACCOUNT ACTIVATION ERROR:",
        error
      );

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

        {/* =================================================
            ICON
            ================================================= */}

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          <KeyRound className="h-6 w-6" />
        </div>

        {/* =================================================
            TITLE
            ================================================= */}

        <h1 className="mt-4 text-xl font-black text-slate-900">
          Activate Account
        </h1>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Enter your Member ID or Email and the
          6-digit activation PIN sent to your email
          by admin.
        </p>

        {/* =================================================
            FORM
            ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-4"
        >

          {/* ===============================================
              MEMBER ID / EMAIL
              =============================================== */}

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">
              Member ID or Email
            </label>

            <input
              type="text"
              value={identifier}
              onChange={(e) => {
                setIdentifier(
                  e.target.value
                );

                if (error) {
                  setError("");
                }
              }}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50"
              placeholder="Enter Member ID or Email"
            />
          </div>

          {/* ===============================================
              ACTIVATION PIN
              =============================================== */}

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">
              Activation PIN
            </label>

            <input
              type="text"
              value={pin}
              onChange={(e) => {
                const nextPin =
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6);

                setPin(nextPin);

                if (error) {
                  setError("");
                }
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="\d{6}"
              required
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-mono text-lg tracking-[0.5em] outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50"
              placeholder="000000"
            />
          </div>

          {/* ===============================================
              ERROR MESSAGE
              =============================================== */}

          {error ? (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <span>
                {error}
              </span>
            </div>
          ) : null}

          {/* ===============================================
              SUCCESS MESSAGE
              =============================================== */}

          {success ? (
            <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

              <span>
                {success}
              </span>
            </div>
          ) : null}

          {/* ===============================================
              SUBMIT BUTTON
              =============================================== */}

          <button
            type="submit"
            disabled={
              loading ||
              Boolean(success)
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-400 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}

            {loading
              ? "Activating..."
              : "Activate Account"}
          </button>
        </form>

        {/* =================================================
            LOGIN LINK
            ================================================= */}

        <p className="mt-5 text-center text-xs text-slate-500">
          Already active?{" "}

          <Link
            to="/login"
            className="font-bold text-violet-700 hover:underline"
          >
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}