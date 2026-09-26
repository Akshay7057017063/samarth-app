import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Wallet,
  IndianRupee,
  FileText,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Activity,
  Loader2,
  Package,
  TrendingUp,
  CircleX,
  Target,
  BarChart3,
  ListChecks,
  KeyRound,
  Eye,
  EyeOff,
  X,
} from "lucide-react";

import api from "../../services/api";

const CustomerDetails = () => {
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [stats, setStats] = useState(null);
  const [captchaStats, setCaptchaStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // RESET PASSWORD STATE
  // =====================================================

  const [showResetPasswordModal, setShowResetPasswordModal] =
    useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [resetPasswordLoading, setResetPasswordLoading] =
    useState(false);

  const [resetPasswordError, setResetPasswordError] =
    useState("");

  const [resetPasswordSuccess, setResetPasswordSuccess] =
    useState("");

  // =====================================================
  // LOAD CUSTOMER DETAILS + CAPTCHA DETAILS
  // =====================================================

  const loadCustomerDetails = async () => {
    if (!id) {
      setError("Customer ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [detailsResult, captchaResult] =
        await Promise.allSettled([
          api.get(
            `/admin/users/${encodeURIComponent(id)}/details`
          ),
          api.get(
            `/admin/users/${encodeURIComponent(
              id
            )}/captcha-stats`
          ),
        ]);

      // ===================================================
      // CUSTOMER DETAILS RESPONSE
      // ===================================================

      if (detailsResult.status === "fulfilled") {
        const detailsResponse =
          detailsResult.value;

        const detailsData =
          detailsResponse.data;

        if (!detailsData?.success) {
          throw new Error(
            detailsData?.message ||
              "Failed to load customer details."
          );
        }

        setCustomer(
          detailsData.user ||
            detailsData.customer ||
            null
        );

        setStats(
          detailsData.stats ||
            detailsData.statistics ||
            null
        );
      } else {
        const detailsError =
          detailsResult.reason;

        throw new Error(
          detailsError?.response?.data?.message ||
            detailsError?.message ||
            "Failed to load customer details."
        );
      }

      // ===================================================
      // CAPTCHA RESPONSE
      // ===================================================

      if (captchaResult.status === "fulfilled") {
        const captchaResponse =
          captchaResult.value;

        const captchaData =
          captchaResponse.data;

        if (captchaData?.success) {
          setCaptchaStats(
            captchaData.stats || null
          );
        } else {
          setCaptchaStats(null);
        }
      } else {
        console.error(
          "Captcha statistics error:",
          captchaResult.reason
        );

        setCaptchaStats(null);
      }
    } catch (err) {
      console.error(
        "Customer details error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load customer details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerDetails();
  }, [id]);

  // =====================================================
  // OPEN RESET PASSWORD MODAL
  // =====================================================

  const openResetPasswordModal = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setResetPasswordError("");
    setResetPasswordSuccess("");
    setShowResetPasswordModal(true);
  };

  // =====================================================
  // CLOSE RESET PASSWORD MODAL
  // =====================================================

  const closeResetPasswordModal = () => {
    if (resetPasswordLoading) {
      return;
    }

    setShowResetPasswordModal(false);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setResetPasswordError("");
    setResetPasswordSuccess("");
  };

  // =====================================================
  // RESET CUSTOMER PASSWORD
  // =====================================================

  const handleResetPassword = async (event) => {
    event.preventDefault();

    setResetPasswordError("");
    setResetPasswordSuccess("");

    const cleanPassword = String(
      newPassword
    );

    const cleanConfirmPassword = String(
      confirmPassword
    );

    if (!cleanPassword) {
      setResetPasswordError(
        "Please enter a new password."
      );
      return;
    }

    if (cleanPassword.length < 6) {
      setResetPasswordError(
        "Password must be at least 6 characters long."
      );
      return;
    }

    if (!cleanConfirmPassword) {
      setResetPasswordError(
        "Please confirm the new password."
      );
      return;
    }

    if (
      cleanPassword !==
      cleanConfirmPassword
    ) {
      setResetPasswordError(
        "Passwords do not match."
      );
      return;
    }

    if (!id) {
      setResetPasswordError(
        "Customer ID is missing."
      );
      return;
    }

    try {
      setResetPasswordLoading(true);

      const response = await api.put(
        `/admin/users/${encodeURIComponent(
          id
        )}/reset-password`,
        {
          newPassword: cleanPassword,
        }
      );

      const data = response.data;

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Failed to reset customer password."
        );
      }

      setResetPasswordSuccess(
        "Customer password updated successfully."
      );

      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setShowResetPasswordModal(false);
        setResetPasswordSuccess("");
      }, 1200);
    } catch (err) {
      console.error(
        "Reset customer password error:",
        err
      );

      setResetPasswordError(
        err.response?.data?.message ||
          err.message ||
          "Failed to reset customer password."
      );
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />

          <p className="text-sm font-medium text-slate-500">
            Loading customer dashboard...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !customer) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />

          <h2 className="mt-3 text-lg font-bold text-red-800">
            Customer Not Found
          </h2>

          <p className="mt-1 text-sm text-red-600">
            {error ||
              "Unable to load customer information."}
          </p>

          <Link
            to="/customers"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  // =====================================================
  // CUSTOMER DATA
  // =====================================================

  const name =
    customer.name ||
    customer.fullName ||
    "Unnamed Customer";

  const memberId =
    customer.memberId ||
    customer.userCode ||
    "-";

  const email =
    customer.email ||
    "-";

  const phone =
    customer.phone ||
    customer.mobile ||
    "-";

  const status =
    customer.status ||
    "active";

  const isActive =
    String(status).toLowerCase() ===
    "active";

  const userType =
    customer.userType ||
    customer.type ||
    "UNPAID";

  const accountId =
    customer._id ||
    customer.id ||
    "-";

  // =====================================================
  // WALLET VALUES
  // =====================================================

  const walletBalance =
    Number(
      stats?.currentBalance ??
        stats?.walletBalance ??
        captchaStats?.currentBalance ??
        customer?.wallet?.balance ??
        0
    );

  const totalEarnings =
    Number(
      stats?.totalEarnings ??
        customer?.wallet?.totalEarnings ??
        0
    );

  const totalWithdrawn =
    Number(
      stats?.totalWithdrawn ??
        customer?.wallet?.totalWithdrawn ??
        0
    );

  const pendingWithdrawals =
    Number(
      stats?.pendingWithdrawals ??
        customer?.wallet?.pendingWithdrawals ??
        0
    );

  // =====================================================
  // WORK VALUES
  // =====================================================

  const totalWork =
    Number(
      stats?.totalWork ??
        stats?.totalCaptchaWork ??
        customer?.totalWork ??
        0
    );

  const completedWork =
    Number(
      stats?.completedWork ??
        stats?.completedCaptchaWork ??
        customer?.completedWork ??
        0
    );

  const pendingWork =
    Number(
      stats?.pendingWork ??
        stats?.pendingCaptchaWork ??
        customer?.pendingWork ??
        0
    );

  // =====================================================
  // CAPTCHA STATISTICS
  // =====================================================

  const totalCaptchaAttempts =
    Number(
      captchaStats?.totalAttempts ||
        0
    );

  const correctCaptchas =
    Number(
      captchaStats?.totalCorrect ??
        captchaStats?.correctAttempts ??
        0
    );

  const wrongCaptchas =
    Number(
      captchaStats?.totalWrong ??
        captchaStats?.wrongAttempts ??
        0
    );

  const captchaAccuracy =
    Number(
      captchaStats?.accuracy ||
        0
    );

  const todayCaptchaAttempts =
    Number(
      captchaStats?.todayAttempts ||
        0
    );

  const todayCorrectCaptchas =
    Number(
      captchaStats?.todayCorrect ||
        0
    );

  const todayWrongCaptchas =
    Number(
      captchaStats?.todayWrong ||
        0
    );

  const captchaEarnings =
    Number(
      captchaStats?.captchaEarnings ||
        0
    );

  const todayCaptchasSolved =
    Number(
      captchaStats?.todayCaptchasSolved ||
        0
    );

  const recentCaptchaAttempts =
    Array.isArray(
      captchaStats?.attempts
    )
      ? captchaStats.attempts
      : [];

  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const formatCurrency = (value) => {
    return `₹${Number(
      value || 0
    ).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (value) => {
    if (!value) return "-";

    try {
      return new Date(
        value
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "-";
    }
  };

  // =====================================================
  // FORMAT DATE TIME
  // =====================================================

  const formatDateTime = (value) => {
    if (!value) return "-";

    try {
      return new Date(
        value
      ).toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return "-";
    }
  };

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6">
      {/* =================================================
          TOP HEADER
      ================================================= */}

      <div className="flex flex-col gap-4">
        {/* Back */}

        <Link
          to="/customers"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Link>

        {/* Customer Header */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                {/* Avatar */}

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl font-black text-blue-600 sm:h-20 sm:w-20 sm:text-2xl">
                  {name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                {/* Customer Info */}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl lg:text-3xl">
                      {name}
                    </h1>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isActive
                            ? "bg-emerald-500"
                            : "bg-red-500"
                        }`}
                      />

                      {isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Member ID:{" "}
                    <span className="font-bold text-slate-700">
                      {memberId}
                    </span>
                  </p>

                  <div className="mt-3 flex flex-col gap-1.5 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-5">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {email}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Header Actions */}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col xl:flex-row">
                <button
                  type="button"
                  onClick={openResetPasswordModal}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <KeyRound className="h-4 w-4" />
                  Reset Password
                </button>

                <span
                  className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-bold ${
                    String(
                      userType
                    ).toUpperCase() === "PAID"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {String(
                    userType
                  ).toUpperCase()}{" "}
                  CUSTOMER
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          DASHBOARD TITLE
      ================================================= */}

      <div>
        <div className="flex items-center gap-2">
          <LayoutDashboardIcon />

          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
            Customer Dashboard
          </h2>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Overview and activity of {name}.
        </p>
      </div>

      {/* =================================================
          MAIN STAT CARDS
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Wallet Balance"
          value={formatCurrency(
            walletBalance
          )}
          icon={Wallet}
          iconClass="bg-blue-50 text-blue-600"
          valueClass="text-slate-900"
        />

        <StatCard
          title="Total Earnings"
          value={formatCurrency(
            totalEarnings
          )}
          icon={IndianRupee}
          iconClass="bg-emerald-50 text-emerald-600"
          valueClass="text-emerald-700"
        />

        <StatCard
          title="Total Withdrawn"
          value={formatCurrency(
            totalWithdrawn
          )}
          icon={TrendingUp}
          iconClass="bg-purple-50 text-purple-600"
          valueClass="text-purple-700"
        />

        <StatCard
          title="Pending Withdrawal"
          value={formatCurrency(
            pendingWithdrawals
          )}
          icon={Clock}
          iconClass="bg-amber-50 text-amber-600"
          valueClass="text-amber-700"
        />
      </div>

      {/* =================================================
          WORK STATISTICS
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Work"
          value={totalWork}
          icon={FileText}
          iconClass="bg-cyan-50 text-cyan-600"
          valueClass="text-slate-900"
        />

        <StatCard
          title="Completed Work"
          value={completedWork}
          icon={CheckCircle2}
          iconClass="bg-emerald-50 text-emerald-600"
          valueClass="text-emerald-700"
        />

        <StatCard
          title="Pending Work"
          value={pendingWork}
          icon={Clock}
          iconClass="bg-amber-50 text-amber-600"
          valueClass="text-amber-700"
        />
      </div>

      {/* =================================================
          CAPTCHA STATISTICS
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Target className="h-5 w-5 text-blue-600" />
                Captcha Statistics
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Captcha work and performance of this customer.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <Activity className="h-3.5 w-3.5" />
              Customer Specific
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Attempts"
            value={totalCaptchaAttempts}
            icon={BarChart3}
            iconClass="bg-blue-50 text-blue-600"
            valueClass="text-slate-900"
          />

          <StatCard
            title="Correct Captchas"
            value={correctCaptchas}
            icon={CheckCircle2}
            iconClass="bg-emerald-50 text-emerald-600"
            valueClass="text-emerald-700"
          />

          <StatCard
            title="Wrong Captchas"
            value={wrongCaptchas}
            icon={CircleX}
            iconClass="bg-red-50 text-red-600"
            valueClass="text-red-700"
          />

          <StatCard
            title="Accuracy"
            value={`${captchaAccuracy.toFixed(
              2
            )}%`}
            icon={Target}
            iconClass="bg-purple-50 text-purple-600"
            valueClass="text-purple-700"
          />
        </div>

        <div className="border-t border-slate-200">
          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
            <CaptchaSummaryItem
              label="Today Attempts"
              value={todayCaptchaAttempts}
            />

            <CaptchaSummaryItem
              label="Today Correct"
              value={todayCorrectCaptchas}
              valueClass="text-emerald-600"
            />

            <CaptchaSummaryItem
              label="Today Wrong"
              value={todayWrongCaptchas}
              valueClass="text-red-600"
            />

            <CaptchaSummaryItem
              label="Today Solved"
              value={todayCaptchasSolved}
              valueClass="text-blue-600"
            />

            <CaptchaSummaryItem
              label="Captcha Earnings"
              value={formatCurrency(
                captchaEarnings
              )}
              valueClass="text-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* =================================================
          RECENT CAPTCHA ATTEMPTS
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <ListChecks className="h-5 w-5 text-cyan-600" />
            Recent Captcha Attempts
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Latest captcha activity of {name}.
          </p>
        </div>

        {recentCaptchaAttempts.length === 0 ? (
          <div className="p-8 text-center">
            <Target className="mx-auto h-10 w-10 text-slate-300" />

            <p className="mt-3 text-sm font-semibold text-slate-600">
              No captcha attempts found
            </p>

            <p className="mt-1 text-xs text-slate-400">
              This customer has not submitted any captcha yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="whitespace-nowrap px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    #
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Result
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Reward
                  </th>

                  <th className="whitespace-nowrap px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Date & Time
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {recentCaptchaAttempts.map(
                  (attempt, index) => {
                    const result = String(
                      attempt.result ||
                        attempt.status ||
                        ""
                    ).toLowerCase();

                    const isCorrect =
                      result === "correct";

                    return (
                      <tr
                        key={
                          attempt._id ||
                          `${attempt.createdAt}-${index}`
                        }
                        className="transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-slate-700">
                          {index + 1}
                        </td>

                        <td className="whitespace-nowrap px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                              isCorrect
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {isCorrect ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <CircleX className="h-3.5 w-3.5" />
                            )}

                            {isCorrect
                              ? "Correct"
                              : "Wrong"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-slate-700">
                          {formatCurrency(
                            attempt.rewardEarned ||
                              0
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-500">
                          {formatDateTime(
                            attempt.createdAt
                          )}
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

      {/* =================================================
          CUSTOMER INFORMATION + ACCOUNT
      ================================================= */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Personal Information */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <User className="h-5 w-5 text-blue-600" />
              Personal Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <InfoItem
              label="Full Name"
              value={name}
            />

            <InfoItem
              label="Member ID"
              value={memberId}
            />

            <InfoItem
              label="Email"
              value={email}
            />

            <InfoItem
              label="Phone"
              value={phone}
            />

            <InfoItem
              label="Customer Type"
              value={String(
                userType
              ).toUpperCase()}
            />

            <InfoItem
              label="Account Status"
              value={
                isActive
                  ? "Active"
                  : "Inactive"
              }
            />
          </div>
        </div>

        {/* Account Information */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Account Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <InfoItem
              label="Joined Date"
              value={formatDate(
                customer.createdAt ||
                  customer.joinedAt ||
                  customer.created_at
              )}
              icon={Calendar}
            />

            <InfoItem
              label="Package"
              value={
                customer.packageName ||
                customer.package ||
                "-"
              }
              icon={Package}
            />

            <InfoItem
              label="Role"
              value={
                customer.role ||
                "user"
              }
              icon={ShieldCheck}
            />

            <InfoItem
              label="Account ID"
              value={accountId}
              icon={CreditCard}
            />
          </div>
        </div>
      </div>

      {/* =================================================
          WALLET SUMMARY
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Wallet className="h-5 w-5 text-blue-600" />
              Wallet Summary
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Financial summary for this customer.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          <WalletItem
            label="Current Balance"
            value={formatCurrency(
              walletBalance
            )}
          />

          <WalletItem
            label="Total Earnings"
            value={formatCurrency(
              totalEarnings
            )}
          />

          <WalletItem
            label="Total Withdrawn"
            value={formatCurrency(
              totalWithdrawn
            )}
          />

          <WalletItem
            label="Pending Withdrawal"
            value={formatCurrency(
              pendingWithdrawals
            )}
          />
        </div>
      </div>

      {/* =================================================
          ACTIVITY
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Activity className="h-5 w-5 text-cyan-600" />
            Customer Activity
          </h3>
        </div>

        <div className="p-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Customer account is{" "}
                  {isActive
                    ? "active"
                    : "inactive"}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Customer activity and captcha
                  work statistics are displayed
                  above.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          RESET PASSWORD MODAL
      ================================================= */}

      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                    <KeyRound className="h-4.5 w-4.5 text-blue-600" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    Reset Customer Password
                  </h3>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Set a new password for{" "}
                  <span className="font-semibold text-slate-700">
                    {name}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={closeResetPasswordModal}
                disabled={
                  resetPasswordLoading
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}

            <form
              onSubmit={handleResetPassword}
              className="space-y-5 p-5"
            >
              {/* Account ID */}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Account ID
                </p>

                <p className="mt-1.5 break-all text-sm font-bold text-slate-800">
                  {accountId}
                </p>
              </div>

              {/* New Password */}

              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  New Password
                </label>

                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="newPassword"
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    disabled={
                      resetPasswordLoading
                    }
                    minLength={6}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword(
                        (value) => !value
                      )
                    }
                    disabled={
                      resetPasswordLoading
                    }
                    className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    title={
                      showNewPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <p className="mt-1.5 text-[11px] text-slate-400">
                  Minimum 6 characters.
                </p>
              </div>

              {/* Confirm Password */}

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Confirm Password
                </label>

                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      confirmPassword
                    }
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    disabled={
                      resetPasswordLoading
                    }
                    minLength={6}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
                    disabled={
                      resetPasswordLoading
                    }
                    className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    title={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}

              {resetPasswordError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

                    <p className="text-xs font-medium leading-5 text-red-700">
                      {resetPasswordError}
                    </p>
                  </div>
                </div>
              )}

              {/* Success */}

              {resetPasswordSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

                    <p className="text-xs font-medium leading-5 text-emerald-700">
                      {resetPasswordSuccess}
                    </p>
                  </div>
                </div>
              )}

              {/* Security Note */}

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3">
                <p className="text-xs leading-5 text-blue-700">
                  The new password will be securely
                  hashed before it is stored in the
                  backend database.
                </p>
              </div>

              {/* Buttons */}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    closeResetPasswordModal
                  }
                  disabled={
                    resetPasswordLoading
                  }
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    resetPasswordLoading
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resetPasswordLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({
  title,
  value,
  icon: Icon,
  iconClass,
  valueClass,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {title}
          </p>

          <p
            className={`mt-2 break-words text-2xl font-black sm:text-3xl ${valueClass}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

// =====================================================
// CAPTCHA SUMMARY ITEM
// =====================================================

const CaptchaSummaryItem = ({
  label,
  value,
  valueClass = "text-slate-900",
}) => {
  return (
    <div className="p-5">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-xl font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
};

// =====================================================
// INFO ITEM
// =====================================================

const InfoItem = ({
  label,
  value,
  icon: Icon,
}) => {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="h-4 w-4 shrink-0 text-slate-400" />
        )}

        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-1.5 break-words text-sm font-semibold text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
};

// =====================================================
// WALLET ITEM
// =====================================================

const WalletItem = ({
  label,
  value,
}) => {
  return (
    <div className="p-5">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
};

// =====================================================
// DASHBOARD ICON
// =====================================================

const LayoutDashboardIcon = () => {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
      <Activity className="h-4 w-4 text-blue-600" />
    </div>
  );
};

export default CustomerDetails;