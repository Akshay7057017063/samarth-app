import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  ShieldCheck,
  Building,
  Send,
  CheckCircle2,
  AlertCircle,
  Save,
  User,
  Landmark,
  BadgeCheck,
  Sparkles,
  CreditCard,
  Lock,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.bull-mark.com/api";

/* ------------------------------------------------------------
   Validation rules (same rules are enforced on the backend)
------------------------------------------------------------ */

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_REGEX = /^\d{6,18}$/;
const UPI_REGEX = /^[a-z0-9._-]{2,256}@[a-z][a-z0-9]{1,63}$/;

const validateForm = (f) => {
  if (f.panNumber && !PAN_REGEX.test(f.panNumber)) {
    return "Invalid PAN format. It should look like ABCDE1234F.";
  }

  const anyBank =
    f.accountNumber || f.ifscCode || f.bankName;

  if (anyBank) {
    if (!f.accountHolderName) return "Please enter the account holder name.";
    if (!f.bankName) return "Please enter your bank name.";
    if (!ACCOUNT_REGEX.test(f.accountNumber))
      return "Account number must be 6 to 18 digits.";
    if (!IFSC_REGEX.test(f.ifscCode))
      return "Invalid IFSC code. It should look like SBIN0001234.";
  }

  if (f.upiId && !UPI_REGEX.test(f.upiId)) {
    return "Invalid UPI ID. It should look like username@bank.";
  }

  if (!f.panNumber && !anyBank && !f.upiId) {
    return "Please enter your PAN, bank details or UPI ID.";
  }

  return "";
};

export default function ProfileKycPage() {
  const { user, token, refreshUser } = useAuth();

  const [form, setForm] = useState({
    panNumber: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const messageRef = useRef(null);

  /* ------------------------------------------------------------
     Fill the form from the logged-in user (also after refreshUser)
  ------------------------------------------------------------ */

  useEffect(() => {
    if (!user) return;

    setForm({
      panNumber: user.panNumber || "",
      accountHolderName:
        user.bankDetails?.accountHolderName || user.name || "",
      accountNumber: user.bankDetails?.accountNumber || "",
      ifscCode: user.bankDetails?.ifscCode || "",
      bankName: user.bankDetails?.bankName || "",
      upiId: user.bankDetails?.upiId || "",
    });
  }, [user]);

  const setField = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    requestAnimationFrame(() =>
      messageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    );
  };

  const isPanVerified = Boolean(user?.panVerified && user?.panNumber);

  /* ------------------------------------------------------------
     Submit KYC  ->  PUT {API_BASE_URL}/auth/kyc
  ------------------------------------------------------------ */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage({ text: "", type: "" });

    if (!token) {
      showMessage("Your session has expired. Please login again.", "error");
      return;
    }

    const payload = {
      panNumber: form.panNumber.trim().toUpperCase(),
      accountHolderName: form.accountHolderName.trim(),
      accountNumber: form.accountNumber.trim(),
      ifscCode: form.ifscCode.trim().toUpperCase(),
      bankName: form.bankName.trim(),
      upiId: form.upiId.trim().toLowerCase(),
    };

    const validationError = validateForm(payload);

    if (validationError) {
      showMessage(validationError, "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/kyc`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // The server might return a non-JSON body (proxy error, 404 page...)
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (res.ok && data?.success) {
        showMessage(
          data.message || "KYC and bank details successfully updated!",
          "success"
        );

        await refreshUser();
      } else if (res.status === 401) {
        showMessage(
          data?.message || "Your session has expired. Please login again.",
          "error"
        );
      } else {
        showMessage(
          data?.message || `Failed to update details (error ${res.status}).`,
          "error"
        );
      }
    } catch (error) {
      console.error("KYC UPDATE ERROR:", error);
      showMessage("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-violet-50 via-white to-orange-50">
      {/* Ambient background */}
      <div className="pointer-events-none absolute -left-32 -top-24 h-80 w-80 rounded-full bg-violet-400/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-120px] top-20 h-80 w-80 rounded-full bg-pink-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-100px] left-[35%] h-80 w-80 rounded-full bg-orange-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-gradient-to-r from-violet-50 via-pink-50 to-orange-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-700">
            <ShieldCheck className="h-3.5 w-3.5 text-pink-500" />
            <span>Statutory Compliance & Bank Desk</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            KYC & Tax <span className="gradient-heading">Verification</span>
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Keep your PAN and payout information updated for withdrawal
            processing.
          </p>
        </div>

        {/* Main card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-orange-400/10 blur-3xl" />

          <div className="relative">
            {/* Status summary */}
            <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                      <ShieldCheck className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        PAN Status
                      </div>
                      <div className="mt-0.5 text-sm font-black text-slate-900">
                        {isPanVerified ? "Verified" : "Pending Verification"}
                      </div>
                    </div>
                  </div>

                  {isPanVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                    <Landmark className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Payout Details
                    </div>
                    <div className="mt-0.5 text-sm font-black text-slate-900">
                      {user?.bankDetails?.accountNumber || user?.bankDetails?.upiId
                        ? "Added"
                        : "Not added yet"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback */}
            {message.text && (
              <div
                ref={messageRef}
                role="alert"
                className={`mb-7 flex items-start gap-3 rounded-2xl border p-4 text-sm ${
                  message.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                )}

                <span>{message.text}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-7" noValidate>
              {/* PAN section */}
              <section className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/70 via-white to-pink-50/50 p-5 sm:p-6">
                <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 text-white shadow-lg shadow-violet-500/20">
                      <ShieldCheck className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-slate-900 sm:text-base">
                        Permanent Account Number
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        PAN Card Information
                      </p>
                    </div>
                  </div>

                  {isPanVerified ? (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-700">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Pending Verification
                    </span>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="panNumber"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    PAN Card Number
                  </label>

                  <div className="relative">
                    {isPanVerified ? (
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                    ) : (
                      <CreditCard className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                    )}

                    <input
                      id="panNumber"
                      type="text"
                      maxLength={10}
                      autoCapitalize="characters"
                      autoComplete="off"
                      value={form.panNumber}
                      readOnly={isPanVerified}
                      onChange={(e) =>
                        setField(
                          "panNumber",
                          e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                        )
                      }
                      placeholder="ABCDE1234F"
                      className={`w-full rounded-2xl border border-slate-200 py-4 pl-11 pr-4 font-mono text-sm font-bold tracking-[0.15em] text-slate-800 shadow-sm transition-all placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10 ${
                        isPanVerified ? "cursor-not-allowed bg-slate-50" : "bg-white"
                      }`}
                    />
                  </div>

                  <div className="mt-2 flex items-start gap-2 text-[11px] leading-5 text-slate-500">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
                    <span>
                      {isPanVerified
                        ? "Your PAN is verified and locked. Contact admin if it needs to be changed."
                        : "Enter your 10-character PAN number exactly as shown on your PAN card."}
                    </span>
                  </div>
                </div>
              </section>

              {/* Bank section */}
              <section className="rounded-3xl border border-pink-100 bg-gradient-to-br from-pink-50/60 via-white to-orange-50/60 p-5 sm:p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/20">
                    <Building className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 sm:text-base">
                      Bank Account & UPI Details
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Add your preferred payout information
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Account holder */}
                  <div>
                    <label
                      htmlFor="accountHolderName"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Account Holder Name
                    </label>

                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />

                      <input
                        id="accountHolderName"
                        type="text"
                        maxLength={100}
                        value={form.accountHolderName}
                        onChange={(e) =>
                          setField("accountHolderName", e.target.value)
                        }
                        placeholder="Full Name as in Bank"
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                      />
                    </div>
                  </div>

                  {/* Bank name */}
                  <div>
                    <label
                      htmlFor="bankName"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Bank Name
                    </label>

                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-500" />

                      <input
                        id="bankName"
                        type="text"
                        maxLength={100}
                        value={form.bankName}
                        onChange={(e) => setField("bankName", e.target.value)}
                        placeholder="e.g. State Bank of India, HDFC"
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-4 focus:ring-pink-500/10"
                      />
                    </div>
                  </div>

                  {/* Account number */}
                  <div>
                    <label
                      htmlFor="accountNumber"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Bank Account Number
                    </label>

                    <div className="relative">
                      <Landmark className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" />

                      <input
                        id="accountNumber"
                        type="text"
                        inputMode="numeric"
                        maxLength={18}
                        autoComplete="off"
                        value={form.accountNumber}
                        onChange={(e) =>
                          setField(
                            "accountNumber",
                            e.target.value.replace(/\D/g, "")
                          )
                        }
                        placeholder="Account Number"
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 font-mono text-sm text-slate-800 shadow-sm transition-all placeholder:font-sans placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                      />
                    </div>
                  </div>

                  {/* IFSC */}
                  <div>
                    <label
                      htmlFor="ifscCode"
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      Bank IFSC Code
                    </label>

                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />

                      <input
                        id="ifscCode"
                        type="text"
                        maxLength={11}
                        autoCapitalize="characters"
                        autoComplete="off"
                        value={form.ifscCode}
                        onChange={(e) =>
                          setField(
                            "ifscCode",
                            e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                          )
                        }
                        placeholder="e.g. SBIN0001234"
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 font-mono text-sm uppercase text-slate-800 shadow-sm transition-all placeholder:font-sans placeholder:normal-case placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                      />
                    </div>
                  </div>
                </div>

                {/* UPI */}
                <div className="mt-5">
                  <label
                    htmlFor="upiId"
                    className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
                  >
                    <span>Primary UPI ID</span>
                  </label>

                  <div className="relative">
                    <Send className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500" />

                    <input
                      id="upiId"
                      type="text"
                      maxLength={100}
                      autoCapitalize="none"
                      autoComplete="off"
                      value={form.upiId}
                      onChange={(e) =>
                        setField(
                          "upiId",
                          e.target.value.toLowerCase().replace(/\s/g, "")
                        )
                      }
                      placeholder="e.g. username@okhdfcbank"
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 font-mono text-sm text-slate-800 shadow-sm transition-all placeholder:font-sans placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/10"
                    />
                  </div>

                  <p className="mt-2 text-[11px] text-slate-500">
                    You can use a UPI ID from Google Pay, PhonePe, Paytm, or
                    another supported UPI provider.
                  </p>
                </div>
              </section>

              {/* Save button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 py-4 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Save className="h-4 w-4 animate-pulse" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                      <span>Save & Update KYC Information</span>
                    </>
                  )}
                </button>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-violet-500" />
                  <span>
                    Keep your account and payout information accurate and up to
                    date.
                  </span>
                </div>
              </div>
            </form>

            {/* Bottom note */}
            <div className="mt-7 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-pink-50 to-orange-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-800">
                    Profile Information
                  </h4>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Your saved information is used for your customer profile and
                    payout-related processing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}