
import React, { useState } from "react";
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
} from "lucide-react";

export default function ProfileKycPage() {
  const { user, token, refreshUser } = useAuth();

  const [panNumber, setPanNumber] = useState(
    user?.panNumber || ""
  );

  const [accountHolderName, setAccountHolderName] =
    useState(
      user?.bankDetails?.accountHolderName ||
        user?.name ||
        ""
    );

  const [accountNumber, setAccountNumber] = useState(
    user?.bankDetails?.accountNumber || ""
  );

  const [ifscCode, setIfscCode] = useState(
    user?.bankDetails?.ifscCode || ""
  );

  const [bankName, setBankName] = useState(
    user?.bankDetails?.bankName || ""
  );

  const [upiId, setUpiId] = useState(
    user?.bankDetails?.upiId || ""
  );

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState({
    text: "",
    type: "",
  });

  /* ------------------------------------------------------------
     Submit KYC
  ------------------------------------------------------------ */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    setMessage({
      text: "",
      type: "",
    });

    try {
      const res = await fetch("/api/auth/kyc", {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          panNumber: panNumber.trim(),
          accountHolderName: accountHolderName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim(),
          bankName: bankName.trim(),
          upiId: upiId.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({
          text:
            "KYC and bank details successfully updated!",
          type: "success",
        });

        await refreshUser();
      } else {
        setMessage({
          text:
            data.message ||
            "Failed to update details.",
          type: "error",
        });
      }
    } catch (error) {
      console.error(
        "KYC UPDATE ERROR:",
        error
      );

      setMessage({
        text: "Network error. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const isPanVerified =
    Boolean(
      user?.panVerified &&
        user?.panNumber
    );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-violet-50 via-white to-orange-50">

      {/* --------------------------------------------------------
          Ambient Background
      -------------------------------------------------------- */}

      <div className="pointer-events-none absolute -left-32 -top-24 h-80 w-80 rounded-full bg-violet-400/10 blur-3xl" />

      <div className="pointer-events-none absolute right-[-120px] top-20 h-80 w-80 rounded-full bg-pink-400/10 blur-3xl" />

      <div className="pointer-events-none absolute bottom-[-100px] left-[35%] h-80 w-80 rounded-full bg-orange-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-10">

        {/* ------------------------------------------------------
            Header
        ------------------------------------------------------ */}

        <div className="mb-8">

          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-gradient-to-r from-violet-50 via-pink-50 to-orange-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-700">
            <ShieldCheck className="h-3.5 w-3.5 text-pink-500" />

            <span>
              Statutory Compliance & Bank Desk
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            KYC & Tax{" "}
            <span className="gradient-heading">
              Verification
            </span>
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Keep your PAN and payout information updated
            for withdrawal processing.
          </p>
        </div>

        {/* ------------------------------------------------------
            Main Card
        ------------------------------------------------------ */}

        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8 lg:p-10">

          {/* Decorative blobs */}

          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-400/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-orange-400/10 blur-3xl" />

          <div className="relative">

            {/* --------------------------------------------------
                Status Summary
            -------------------------------------------------- */}

            <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2">

              {/* PAN Status */}

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
                        {isPanVerified
                          ? "Verified"
                          : "Pending Verification"}
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

              {/* Bank Status */}

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
                      Keep Information Updated
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* --------------------------------------------------
                Feedback
            -------------------------------------------------- */}

            {message.text && (
              <div
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

            {/* --------------------------------------------------
                Form
            -------------------------------------------------- */}

            <form
              onSubmit={handleSubmit}
              className="space-y-7"
            >

              {/* =================================================
                  PAN SECTION
              ================================================= */}

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

                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    PAN Card Number
                  </label>

                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />

                    <input
                      type="text"
                      maxLength={10}
                      value={panNumber}
                      onChange={(e) =>
                        setPanNumber(
                          e.target.value.toUpperCase()
                        )
                      }
                      placeholder="ABCDE1234F"
                      className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-11 pr-4 font-mono text-sm font-bold tracking-[0.15em] text-slate-800 shadow-sm transition-all placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                    />
                  </div>

                  <div className="mt-2 flex items-start gap-2 text-[11px] leading-5 text-slate-500">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />

                    <span>
                      Enter your 10-character PAN number
                      exactly as shown on your PAN card.
                    </span>
                  </div>
                </div>
              </section>

              {/* =================================================
                  BANK SECTION
              ================================================= */}

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

                  {/* Account Holder */}

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Account Holder Name
                    </label>

                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />

                      <input
                        type="text"
                        value={accountHolderName}
                        onChange={(e) =>
                          setAccountHolderName(
                            e.target.value
                          )
                        }
                        placeholder="Full Name as in Bank"
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                      />
                    </div>
                  </div>

                  {/* Bank Name */}

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Bank Name
                    </label>

                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-500" />

                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) =>
                          setBankName(e.target.value)
                        }
                        placeholder="e.g. State Bank of India, HDFC"
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-4 focus:ring-pink-500/10"
                      />
                    </div>
                  </div>

                  {/* Account Number */}

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Bank Account Number
                    </label>

                    <div className="relative">
                      <Landmark className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" />

                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) =>
                          setAccountNumber(
                            e.target.value
                          )
                        }
                        placeholder="Account Number"
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 font-mono text-sm text-slate-800 shadow-sm transition-all placeholder:font-sans placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                      />
                    </div>
                  </div>

                  {/* IFSC */}

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Bank IFSC Code
                    </label>

                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />

                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) =>
                          setIfscCode(
                            e.target.value.toUpperCase()
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
                  <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Send className="h-4 w-4 text-cyan-500" />

                    <span>
                      Primary UPI ID
                    </span>
                  </label>

                  <div className="relative">
                    <Send className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500" />

                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) =>
                        setUpiId(
                          e.target.value.toLowerCase()
                        )
                      }
                      placeholder="e.g. username@okhdfcbank"
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 font-mono text-sm text-slate-800 shadow-sm transition-all placeholder:font-sans placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/10"
                    />
                  </div>

                  <p className="mt-2 text-[11px] text-slate-500">
                    You can use a UPI ID from Google Pay,
                    PhonePe, Paytm, or another supported UPI
                    provider.
                  </p>
                </div>
              </section>

              {/* =================================================
                  SAVE BUTTON
              ================================================= */}

              <div className="pt-1">

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 py-4 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Save className="h-4 w-4 animate-pulse" />

                      <span>
                        Saving Changes...
                      </span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />

                      <span>
                        Save & Update KYC Information
                      </span>
                    </>
                  )}
                </button>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-violet-500" />

                  <span>
                    Keep your account and payout information
                    accurate and up to date.
                  </span>
                </div>
              </div>
            </form>

            {/* --------------------------------------------------
                Bottom Note
            -------------------------------------------------- */}

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
                    Your saved information is used for your
                    customer profile and payout-related
                    processing.
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

