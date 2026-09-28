
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Wallet,
  IndianRupee,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  FileText,
  Building,
  Send,
  Clock,
  Sparkles,
  ArrowUpRight,
  Landmark,
  CircleDollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function WithdrawalPage() {
  const {
    user,
    wallet,
    token,
    updateWalletLocally,
  } = useAuth();

  const [amount, setAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("UPI");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] = useState({
    text: "",
    type: "",
  });

  const [transactions, setTransactions] = useState([]);

  const [settings, setSettings] = useState({
    tdsRateWithPan: 5,
    tdsRateNoPan: 20,
    adminFeeRate: 5,
    minWithdrawalAmount: 200,
  });

  /* ------------------------------------------------------------
     Load Wallet / Settings / Withdrawal History
  ------------------------------------------------------------ */

  const loadData = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const summaryResponse = await fetch(
        "/api/wallet/summary",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const summaryData = await summaryResponse.json();

      if (summaryData.success) {
        if (summaryData.settings) {
          setSettings(summaryData.settings);
        }

        if (
          payoutMethod === "UPI" &&
          summaryData.user?.bankDetails?.upiId
        ) {
          setPayoutDetails(
            summaryData.user.bankDetails.upiId
          );
        } else if (
          payoutMethod === "BANK" &&
          summaryData.user?.bankDetails?.accountNumber
        ) {
          const accountNumber =
            summaryData.user.bankDetails.accountNumber;

          const ifscCode =
            summaryData.user.bankDetails.ifscCode || "";

          setPayoutDetails(
            ifscCode
              ? `${accountNumber} (${ifscCode})`
              : String(accountNumber)
          );
        }
      }

      const transactionResponse = await fetch(
        "/api/wallet/transactions",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const transactionData =
        await transactionResponse.json();

      if (transactionData.success) {
        const withdrawalTransactions =
          Array.isArray(transactionData.transactions)
            ? transactionData.transactions.filter(
                (transaction) =>
                  transaction.type === "withdrawal"
              )
            : [];

        setTransactions(withdrawalTransactions);
      }
    } catch (error) {
      console.error(
        "LOAD WITHDRAWAL DATA ERROR:",
        error
      );
    }
  }, [token, payoutMethod]);

  /* ------------------------------------------------------------
     Initial Load
  ------------------------------------------------------------ */

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ------------------------------------------------------------
     Amount / TDS / Fee Calculations
  ------------------------------------------------------------ */

  const gross = parseFloat(amount) || 0;

  const hasPan = Boolean(
    user?.panVerified &&
      user?.panNumber &&
      String(user.panNumber).length >= 10
  );

  const tdsRate = hasPan
    ? Number(settings.tdsRateWithPan || 0)
    : Number(settings.tdsRateNoPan || 0);

  const tdsDeduction = parseFloat(
    ((gross * tdsRate) / 100).toFixed(2)
  );

  const adminFee = parseFloat(
    (
      (gross * Number(settings.adminFeeRate || 0)) /
      100
    ).toFixed(2)
  );

  const netPayable = Math.max(
    0,
    parseFloat(
      (gross - tdsDeduction - adminFee).toFixed(2)
    )
  );

  const currentBalance = Number(
    wallet?.currentBalance || 0
  );

  const minimumWithdrawal = Number(
    settings.minWithdrawalAmount || 200
  );

  /* ------------------------------------------------------------
     Withdrawal Submit
  ------------------------------------------------------------ */

  const handleWithdraw = async (e) => {
    e.preventDefault();

    if (!amount || gross < minimumWithdrawal) {
      setFeedback({
        text: `Minimum withdrawal is ₹${minimumWithdrawal}.`,
        type: "error",
      });

      return;
    }

    if (gross > currentBalance) {
      setFeedback({
        text: "Insufficient wallet balance.",
        type: "error",
      });

      return;
    }

    if (!payoutDetails.trim()) {
      setFeedback({
        text: `Please provide your ${payoutMethod} details.`,
        type: "error",
      });

      return;
    }

    setLoading(true);

    setFeedback({
      text: "",
      type: "",
    });

    try {
      const res = await fetch(
        "/api/wallet/withdraw",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            amount: gross,
            payoutMethod,
            payoutDetails: payoutDetails.trim(),
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setFeedback({
          text:
            data.message ||
            "Withdrawal request submitted successfully.",
          type: "success",
        });

        setAmount("");

        if (data.newBalance !== undefined) {
          updateWalletLocally(
            Number(data.newBalance)
          );
        }

        await loadData();
      } else {
        setFeedback({
          text:
            data.message ||
            "Unable to submit withdrawal request.",
          type: "error",
        });
      }
    } catch (error) {
      console.error(
        "WITHDRAWAL ERROR:",
        error
      );

      setFeedback({
        text: "Network error. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------
     Format Helpers
  ------------------------------------------------------------ */

  const formatAmount = (value) =>
    Number(value || 0).toFixed(2);

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString();
  };

  const getStatusClasses = (status) => {
    const normalized = String(
      status || ""
    ).toLowerCase();

    if (
      normalized === "approved" ||
      normalized === "completed"
    ) {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (normalized === "pending") {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }

    return "border-red-200 bg-red-50 text-red-700";
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-violet-50 via-white to-orange-50">

      {/* --------------------------------------------------------
          Ambient Background
      -------------------------------------------------------- */}

      <div className="pointer-events-none absolute -left-32 -top-24 h-80 w-80 rounded-full bg-violet-400/10 blur-3xl" />

      <div className="pointer-events-none absolute right-[-120px] top-40 h-80 w-80 rounded-full bg-pink-400/10 blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 left-[35%] h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-8 sm:py-10">

        {/* ------------------------------------------------------
            Header
        ------------------------------------------------------ */}

        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">

          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-gradient-to-r from-violet-50 via-pink-50 to-orange-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-700">
              <IndianRupee className="h-3.5 w-3.5 text-pink-500" />

              <span>Tax Compliant Payout Desk</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Wallet Withdrawal{" "}
              <span className="gradient-heading">
                & TDS Ledger
              </span>
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Request a payout through UPI or bank transfer.
              Your withdrawal request will be processed after
              admin review.
            </p>
          </div>

          {/* Available Balance */}

          <div className="flex min-w-[220px] items-center gap-3 rounded-2xl border border-violet-100 bg-white/90 px-5 py-3.5 shadow-[0_12px_35px_rgba(15,23,42,0.07)] backdrop-blur">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-pink-500 to-orange-500 text-white shadow-lg shadow-violet-500/20">
              <Wallet className="h-5 w-5" />
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Available for Payout
              </div>

              <div className="mt-0.5 text-xl font-black text-slate-900">
                ₹{formatAmount(currentBalance)}
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------
            Quick Info Cards
        ------------------------------------------------------ */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

          <div className="rounded-2xl border border-violet-100 bg-violet-50/80 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-violet-700">
              <CircleDollarSign className="h-4 w-4" />
              <span>Minimum Withdrawal</span>
            </div>

            <div className="mt-2 text-xl font-black text-slate-900">
              ₹{minimumWithdrawal}
            </div>
          </div>

          <div className="rounded-2xl border border-pink-100 bg-pink-50/80 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-pink-700">
              <ShieldCheck className="h-4 w-4" />
              <span>PAN TDS Rate</span>
            </div>

            <div className="mt-2 text-xl font-black text-slate-900">
              {Number(
                settings.tdsRateWithPan || 0
              )}
              %
            </div>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50/80 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-700">
              <Clock className="h-4 w-4" />
              <span>Processing</span>
            </div>

            <div className="mt-2 text-xl font-black text-slate-900">
              Admin Review
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------
            Main Grid
        ------------------------------------------------------ */}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

          {/* ====================================================
              LEFT: WITHDRAWAL FORM
          ==================================================== */}

          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-8 lg:col-span-7">

            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-400/10 blur-3xl" />

            <div className="relative">

              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <ArrowUpRight className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Request Payout
                  </h3>

                  <p className="text-xs text-slate-500">
                    Enter your amount and payout destination.
                  </p>
                </div>
              </div>

              {/* Feedback */}

              {feedback.text && (
                <div
                  className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 text-sm ${
                    feedback.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {feedback.type === "success" ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  )}

                  <span>{feedback.text}</span>
                </div>
              )}

              <form
                onSubmit={handleWithdraw}
                className="space-y-6"
              >

                {/* Amount */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Gross Withdrawal Amount (₹)
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 z-10 -translate-y-1/2 font-bold text-violet-600">
                      ₹
                    </span>

                    <input
                      type="number"
                      min={minimumWithdrawal}
                      step="1"
                      value={amount}
                      onChange={(e) =>
                        setAmount(e.target.value)
                      }
                      placeholder={`Enter amount (Min ₹${minimumWithdrawal})`}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-10 pr-4 text-sm font-bold text-slate-800 shadow-sm transition-all placeholder:font-normal placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                    />
                  </div>
                </div>

                {/* Payout Channel */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Payout Channel
                  </label>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                    <button
                      type="button"
                      onClick={() =>
                        setPayoutMethod("UPI")
                      }
                      className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-all ${
                        payoutMethod === "UPI"
                          ? "border-violet-300 bg-gradient-to-r from-violet-50 via-pink-50 to-orange-50 text-violet-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:bg-violet-50/50"
                      }`}
                    >
                      <Send className="h-4 w-4" />

                      <span>Instant UPI ID</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPayoutMethod("BANK")
                      }
                      className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-all ${
                        payoutMethod === "BANK"
                          ? "border-violet-300 bg-gradient-to-r from-violet-50 via-pink-50 to-orange-50 text-violet-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:bg-violet-50/50"
                      }`}
                    >
                      <Building className="h-4 w-4" />

                      <span>
                        Bank Account / IMPS
                      </span>
                    </button>

                  </div>
                </div>

                {/* Payout Details */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    {payoutMethod === "UPI"
                      ? "Recipient UPI ID"
                      : "Bank Account & IFSC"}
                  </label>

                  <div className="relative">
                    {payoutMethod === "UPI" ? (
                      <Send className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                    ) : (
                      <Landmark className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                    )}

                    <input
                      type="text"
                      value={payoutDetails}
                      onChange={(e) =>
                        setPayoutDetails(
                          e.target.value
                        )
                      }
                      placeholder={
                        payoutMethod === "UPI"
                          ? "e.g. mobile@upi"
                          : "Account No, Bank Name, IFSC"
                      }
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-11 pr-4 font-mono text-xs text-slate-800 shadow-sm transition-all placeholder:font-sans placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                    />
                  </div>
                </div>

                {/* TDS Calculation */}

                <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-violet-50/60 p-5">

                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-violet-600" />

                    <h4 className="text-sm font-black text-slate-800">
                      Payout Calculation
                    </h4>
                  </div>

                  <div className="space-y-3 text-sm">

                    <div className="flex justify-between gap-4 text-slate-500">
                      <span>Gross Requested</span>

                      <span className="font-mono font-bold text-slate-800">
                        ₹{gross.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 text-red-500">
                      <span>
                        TDS Tax ({tdsRate}%{" "}
                        {hasPan
                          ? "with PAN"
                          : "No PAN"})
                      </span>

                      <span className="font-mono font-bold">
                        -₹{tdsDeduction.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 text-slate-500">
                      <span>
                        Admin & Processing Fee (
                        {Number(
                          settings.adminFeeRate || 0
                        )}
                        %)
                      </span>

                      <span className="font-mono font-bold text-slate-700">
                        -₹{adminFee.toFixed(2)}
                      </span>
                    </div>

                    <div className="my-2 border-t border-slate-200" />

                    <div className="flex items-center justify-between gap-4">
                      <span className="font-black text-slate-800">
                        Net Transfer Amount
                      </span>

                      <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text font-mono text-lg font-black text-transparent">
                        ₹{netPayable.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit */}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    gross < minimumWithdrawal ||
                    gross > currentBalance
                  }
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 py-4 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <IndianRupee className="h-4 w-4" />
                      <span>
                        Submit Withdrawal Request
                      </span>
                    </>
                  )}
                </button>

              </form>
            </div>
          </div>

          {/* ====================================================
              RIGHT: COMPLIANCE
          ==================================================== */}

          <div className="space-y-6 lg:col-span-5">

            {/* Tax Card */}

            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl">

              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-pink-400/10 blur-3xl" />

              <div className="relative">

                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Tax Compliance Guidelines
                    </h4>

                    <p className="text-[11px] text-slate-500">
                      TDS information for payouts
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs leading-6 text-slate-500">

                  <p>
                    TDS may be deducted from eligible
                    commission and task earnings before
                    payout, according to the applicable
                    platform and tax rules.
                  </p>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                    <div className="mb-2 flex items-center gap-2 font-bold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        With Valid PAN:{" "}
                        {Number(
                          settings.tdsRateWithPan || 0
                        )}
                        % TDS
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-bold text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>
                        Without PAN:{" "}
                        {Number(
                          settings.tdsRateNoPan || 0
                        )}
                        % TDS
                      </span>
                    </div>
                  </div>

                  <p>
                    Keep your PAN and payout details updated
                    in your profile so that your account
                    information remains complete for payout
                    processing.
                  </p>
                </div>

                <div className="mt-5">
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-bold text-violet-700 transition-all hover:border-violet-300 hover:bg-violet-100"
                  >
                    <ShieldCheck className="h-4 w-4" />

                    <span>
                      Update PAN & Bank Details
                    </span>

                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

              </div>
            </div>

            {/* Payout Info Card */}

            <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-orange-50 p-6 shadow-sm">

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-pink-500 to-orange-500 text-white shadow-lg shadow-violet-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Payout Information
                  </h4>

                  <p className="text-[11px] text-slate-500">
                    Keep these points in mind
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">

                <div className="flex items-start gap-3 rounded-2xl border border-white bg-white/80 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

                  <p className="text-xs leading-5 text-slate-600">
                    Minimum withdrawal amount is ₹
                    {minimumWithdrawal}.
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white bg-white/80 p-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />

                  <p className="text-xs leading-5 text-slate-600">
                    Withdrawal requests are reviewed before
                    payout processing.
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white bg-white/80 p-3">
                  <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" />

                  <p className="text-xs leading-5 text-slate-600">
                    Your available wallet balance is checked
                    before submitting the request.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------
            Withdrawal History
        ------------------------------------------------------ */}

        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-8">

          <div className="pointer-events-none absolute -left-16 bottom-[-60px] h-40 w-40 rounded-full bg-orange-400/10 blur-3xl" />

          <div className="relative">

            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <FileText className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 sm:text-lg">
                    Withdrawal Requests & Payout Log
                  </h3>

                  <p className="text-xs text-slate-500">
                    Track your previous payout requests.
                  </p>
                </div>
              </div>

              <div className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-[11px] font-bold text-violet-700">
                {transactions.length} Request
                {transactions.length === 1
                  ? ""
                  : "s"}
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 py-12 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                  <FileText className="h-6 w-6" />
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-600">
                  No withdrawal requests made yet.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Your payout history will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[900px] text-left text-xs">

                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-slate-500">

                      <th className="px-4 py-3 font-bold">
                        Date
                      </th>

                      <th className="px-4 py-3 font-bold">
                        Gross Amount
                      </th>

                      <th className="px-4 py-3 font-bold">
                        TDS Deducted
                      </th>

                      <th className="px-4 py-3 font-bold">
                        Admin Fee
                      </th>

                      <th className="px-4 py-3 font-bold">
                        Net Paid
                      </th>

                      <th className="px-4 py-3 font-bold">
                        Channel / UTR
                      </th>

                      <th className="px-4 py-3 font-bold">
                        Status
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">

                    {transactions.map(
                      (tx, idx) => {
                        const status =
                          String(
                            tx.status || "pending"
                          ).toLowerCase();

                        const payoutMethodValue =
                          tx.payoutMethod ||
                          "—";

                        const payoutDetailsValue =
                          tx.payoutDetails ||
                          "—";

                        const utr =
                          tx.utrNumber ||
                          "";

                        return (
                          <tr
                            key={
                              tx._id ||
                              tx.id ||
                              idx
                            }
                            className="transition-colors hover:bg-violet-50/40"
                          >

                            <td className="px-4 py-4 text-slate-500">
                              {formatDate(
                                tx.createdAt
                              )}
                            </td>

                            <td className="px-4 py-4 font-mono font-bold text-slate-800">
                              ₹
                              {formatAmount(
                                tx.grossAmount ??
                                  tx.amount
                              )}
                            </td>

                            <td className="px-4 py-4 font-mono text-red-500">
                              -₹
                              {formatAmount(
                                tx.tdsAmount ??
                                  tx.tds
                              )}

                              {tx.tdsPercentage !==
                              undefined &&
                              tx.tdsPercentage !==
                                null
                                ? ` (${tx.tdsPercentage}%)`
                                : ""}
                            </td>

                            <td className="px-4 py-4 font-mono text-slate-500">
                              -₹
                              {formatAmount(
                                tx.adminFeeAmount ??
                                  tx.adminFee
                              )}
                            </td>

                            <td className="px-4 py-4 font-mono font-black text-emerald-600">
                              ₹
                              {formatAmount(
                                tx.netAmount ??
                                  tx.amount
                              )}
                            </td>

                            <td className="max-w-[240px] px-4 py-4 font-mono text-[11px] text-slate-500">

                              {utr ? (
                                <span>
                                  UTR: {utr}
                                </span>
                              ) : (
                                <span>
                                  {
                                    payoutMethodValue
                                  }
                                  :{" "}
                                  {
                                    payoutDetailsValue
                                  }
                                </span>
                              )}

                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${getStatusClasses(
                                  status
                                )}`}
                              >
                                {status}
                              </span>
                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

