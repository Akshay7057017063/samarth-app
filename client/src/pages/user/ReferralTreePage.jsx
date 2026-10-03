import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReferralTreeVisualizer from "../../components/ReferralTreeVisualizer";
import {
  Network,
  Users,
  UserCheck,
  Sparkles,
  Crown,
  TrendingUp,
  CheckCircle2,
  ArrowLeft,
  ArrowUpRight,
  ShieldCheck,
  GitBranch,
  RefreshCw,
  AlertCircle,
  Activity,
} from "lucide-react";

/* ============================================================
   API BASE URL
============================================================ */

/*
 * Local development:
 *
 * Vite proxy:
 * /api -> http://localhost:5000
 *
 * Production:
 * Set VITE_API_BASE_URL in .env
 *
 * Example:
 * VITE_API_BASE_URL=https://api.bull-mark.com/api
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/+$/, "");

/* ============================================================
   NORMALIZE TREE RESPONSE
============================================================ */

/*
 * Different backend versions may return:
 *
 * data.tree
 * data.binaryTree
 * data.data.tree
 * data.data.binaryTree
 *
 * This helper keeps frontend compatible with all of them.
 */

const getBinaryTreeFromResponse = (data) => {
  return (
    data?.binaryTree ||
    data?.tree ||
    data?.data?.binaryTree ||
    data?.data?.tree ||
    null
  );
};

/* ============================================================
   NORMALIZE DIRECT REFERRALS
============================================================ */

const getDirectsFromResponse = (data) => {
  if (Array.isArray(data?.directs)) {
    return data.directs;
  }

  if (Array.isArray(data?.data?.directs)) {
    return data.data.directs;
  }

  return [];
};

/* ============================================================
   PAGE
============================================================ */

export default function ReferralTreePage() {
  const {
    user,
    token,
  } = useAuth();

  const [treeData, setTreeData] =
    useState(null);

  const [directs, setDirects] =
    useState([]);

  const [treeStats, setTreeStats] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ==========================================================
     LOAD TREE + DIRECT REFERRALS
  ========================================================== */

  const loadNetworkData = async ({
    showLoader = true,
  } = {}) => {
    if (!token) {
      setTreeData(null);
      setDirects([]);
      setTreeStats(null);
      setLoading(false);
      return;
    }

    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const [
        treeResponse,
        directsResponse,
      ] = await Promise.all([
        fetch(
          `${API_BASE_URL}/referral/tree`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        fetch(
          `${API_BASE_URL}/referral/directs`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);

      /* ======================================================
         TREE RESPONSE
      ====================================================== */

      let treeJson = null;

      try {
        treeJson =
          await treeResponse.json();
      } catch {
        treeJson = null;
      }

      if (!treeResponse.ok) {
        throw new Error(
          treeJson?.message ||
            "Unable to load binary tree."
        );
      }

      if (
        treeJson?.success === false
      ) {
        throw new Error(
          treeJson?.message ||
            "Unable to load binary tree."
        );
      }

      const binaryTree =
        getBinaryTreeFromResponse(
          treeJson
        );

      setTreeData(
        binaryTree || null
      );

      /* ======================================================
         TREE STATS
      ====================================================== */

      const responseStats =
        treeJson?.stats ||
        treeJson?.summary ||
        treeJson?.data?.stats ||
        treeJson?.data?.summary ||
        null;

      setTreeStats(
        responseStats
      );

      /* ======================================================
         DIRECT REFERRALS RESPONSE
      ====================================================== */

      let directsJson = null;

      try {
        directsJson =
          await directsResponse.json();
      } catch {
        directsJson = null;
      }

      if (!directsResponse.ok) {
        console.warn(
          "DIRECT REFERRALS REQUEST FAILED:",
          directsJson?.message ||
            directsResponse.status
        );

        setDirects([]);
      } else {
        setDirects(
          directsJson?.success === false
            ? []
            : getDirectsFromResponse(
                directsJson
              )
        );
      }
    } catch (fetchError) {
      console.error(
        "BINARY TREE PAGE ERROR:",
        fetchError
      );

      setError(
        fetchError?.message ||
          "Unable to load your binary network."
      );

      setTreeData(null);
      setTreeStats(null);
      setDirects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadNetworkData({
      showLoader: true,
    });
  }, [token]);

  /* ==========================================================
     SAFE MEMBER ID
  ========================================================== */

  const memberId =
    treeData?.memberId ||
    treeData?.userCode ||
    user?.memberId ||
    user?.userCode ||
    "—";

  /* ==========================================================
     BINARY COUNTS
  ========================================================== */

  const leftCount = Number(
    treeData?.leftCount ??
      treeStats?.leftCount ??
      user?.leftCount ??
      0
  );

  const rightCount = Number(
    treeData?.rightCount ??
      treeStats?.rightCount ??
      user?.rightCount ??
      0
  );

  const totalBinaryTeam = Number(
    treeData?.totalTeam ??
      treeData?.totalCount ??
      treeStats?.totalTeam ??
      treeStats?.totalCount ??
      user?.totalTeam ??
      user?.teamCount ??
      leftCount + rightCount
  );

  /* ==========================================================
     DIRECT REFERRAL COUNTS
  ========================================================== */

  const directReferralCount =
    Number(
      user?.directReferralsCount ??
        user?.totalReferral ??
        treeStats?.directCount ??
        directs.length ??
        0
    );

  const activeDirects = useMemo(() => {
    return directs.filter(
      (member) =>
        String(
          member?.status || ""
        ).toLowerCase() ===
        "active"
    ).length;
  }, [directs]);

  /* ==========================================================
     ACTIVE BINARY TEAM
  ========================================================== */

  const activeBinaryTeam = Number(
    treeStats?.activeTeam ??
      user?.activeTeam ??
      0
  );

  /* ==========================================================
     PAGE DATA
  ========================================================== */

  const networkStatus =
    treeData
      ? "Network Active"
      : "Network Unavailable";

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-violet-50 via-white to-orange-50 text-slate-800">

      {/* =====================================================
          AMBIENT BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl" />

        <div className="absolute right-[-100px] top-16 h-80 w-80 rounded-full bg-pink-300/20 blur-3xl" />

        <div className="absolute bottom-[-100px] left-[30%] h-80 w-80 rounded-full bg-orange-300/15 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />

      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* ===================================================
            BACK + REFRESH
        =================================================== */}

        <div className="mb-5 flex items-center justify-between gap-3">

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() =>
                loadNetworkData({
                  showLoader: false,
                })
              }
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>

            <div
              className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider shadow-sm sm:flex ${
                treeData
                  ? "border-emerald-100 bg-white/90 text-emerald-700"
                  : "border-red-100 bg-red-50 text-red-600"
              }`}
            >
              {treeData ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}

              {networkStatus}
            </div>

          </div>
        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-2 text-xs text-red-700">

              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <span>
                {error}
              </span>

            </div>

            <button
              type="button"
              onClick={() =>
                loadNetworkData({
                  showLoader: false,
                })
              }
              className="w-fit rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm"
            >
              Retry
            </button>

          </div>
        )}

        {/* ===================================================
            HEADER
        =================================================== */}

        <section className="relative mb-7 overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-[1px] shadow-xl shadow-violet-100/50 backdrop-blur-xl">

          <div className="relative overflow-hidden rounded-[23px] bg-gradient-to-br from-white via-violet-50/60 to-orange-50/70 px-5 py-7 sm:px-8 sm:py-8">

            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-pink-300/25 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-violet-300/20 blur-3xl" />

            <div className="pointer-events-none absolute right-1/3 top-1/3 h-32 w-32 rounded-full bg-cyan-200/20 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

              <div>

                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/90 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-700 shadow-sm">

                  <Network className="h-4 w-4" />

                  My Binary Network

                </div>

                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">

                  Binary

                  <span className="ml-2 bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                    Tree
                  </span>

                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  Explore your binary network, left team, right team and member placement through the interactive tree.
                </p>

              </div>

              {/* HEADER STATS */}

              <div className="grid grid-cols-2 gap-3">

                <div className="min-w-[145px] rounded-2xl border border-violet-100 bg-white/90 px-4 py-3 shadow-sm">

                  <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">

                    <UserCheck className="h-3.5 w-3.5 text-violet-500" />

                    Direct Referrals

                  </div>

                  <div className="mt-1.5 text-2xl font-black text-slate-900">
                    {formatNumber(
                      directReferralCount
                    )}
                  </div>

                </div>

                <div className="min-w-[145px] rounded-2xl border border-pink-100 bg-white/90 px-4 py-3 shadow-sm">

                  <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">

                    <Network className="h-3.5 w-3.5 text-pink-500" />

                    Binary Team

                  </div>

                  <div className="mt-1.5 text-2xl font-black text-slate-900">
                    {formatNumber(
                      totalBinaryTeam
                    )}
                  </div>

                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ===================================================
            SUMMARY CARDS
        =================================================== */}

        <section className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-4">

          {/* Direct Team */}

          <div className="group rounded-3xl border border-violet-100 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-100/50">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-transform group-hover:scale-105">

                <UserCheck className="h-5 w-5" />

              </div>

              <div>

                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Direct Referrals
                </div>

                <div className="mt-1 text-lg font-black text-slate-900">
                  {formatNumber(
                    directReferralCount
                  )}
                </div>

              </div>

            </div>
          </div>

          {/* Left Team */}

          <div className="group rounded-3xl border border-violet-100 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-100/50">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-transform group-hover:scale-105">

                <ArrowUpRight className="h-5 w-5 -rotate-90" />

              </div>

              <div>

                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Left Team
                </div>

                <div className="mt-1 text-lg font-black text-slate-900">
                  {formatNumber(
                    leftCount
                  )}
                </div>

              </div>

            </div>
          </div>

          {/* Right Team */}

          <div className="group rounded-3xl border border-orange-100 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-100/50">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600 transition-transform group-hover:scale-105">

                <GitBranch className="h-5 w-5" />

              </div>

              <div>

                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Right Team
                </div>

                <div className="mt-1 text-lg font-black text-slate-900">
                  {formatNumber(
                    rightCount
                  )}
                </div>

              </div>

            </div>
          </div>

          {/* Member ID */}

          <div className="group rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-100/50">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-transform group-hover:scale-105">

                <Crown className="h-5 w-5" />

              </div>

              <div className="min-w-0">

                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Member ID
                </div>

                <div className="mt-1 truncate text-sm font-black text-slate-900">
                  {memberId}
                </div>

              </div>

            </div>
          </div>

        </section>

        {/* ===================================================
            BINARY TREE
        =================================================== */}

        <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-200 via-pink-200 to-orange-200 p-[1px] shadow-xl shadow-violet-100/50">

          <div className="relative overflow-hidden rounded-[23px] bg-white/95 p-4 backdrop-blur-xl sm:p-6">

            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-orange-300/15 blur-3xl" />

            <div className="relative">

              {/* TREE HEADER */}

              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-pink-500 to-orange-500 text-white shadow-lg shadow-violet-200">

                    <GitBranch className="h-5 w-5" />

                  </div>

                  <div>

                    <h2 className="text-lg font-black text-slate-900">
                      Interactive Binary Tree
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Your binary placement and downline structure.
                    </p>

                  </div>

                </div>

                <div className="flex flex-wrap items-center gap-2">

                  <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-violet-700">

                    <Network className="h-3.5 w-3.5" />

                    {formatNumber(
                      totalBinaryTeam
                    )}{" "}
                    Total

                  </div>

                  {refreshing && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-cyan-700">

                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />

                      Updating

                    </div>
                  )}

                </div>

              </div>

              {/* TREE CONTENT */}

              {loading ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-violet-50/50">

                  <div className="text-center">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 via-pink-100 to-orange-100 text-violet-600 shadow-sm">

                      <RefreshCw className="h-7 w-7 animate-spin" />

                    </div>

                    <p className="mt-4 text-sm font-black text-slate-700">
                      Loading your binary tree...
                    </p>

                    <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                      Fetching binary parent, left team, right team and downline members.
                    </p>

                  </div>

                </div>
              ) : treeData ? (
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/70 via-white to-violet-50/40">

                  <ReferralTreeVisualizer
                    tree={treeData}
                    userMemberId={memberId}
                  />

                </div>
              ) : (
                <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70">

                  <div className="max-w-md text-center">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">

                      <Network className="h-7 w-7" />

                    </div>

                    <h3 className="mt-4 text-sm font-black text-slate-700">
                      Binary tree is currently unavailable
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      The server did not return a binary tree for this account. Check the backend referral tree route and try again.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        loadNetworkData({
                          showLoader: false,
                        })
                      }
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-violet-200 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Try Again
                    </button>

                  </div>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* ===================================================
            BINARY SUMMARY
        =================================================== */}

        <section className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* Left */}

          <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-violet-50 p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <div className="text-[10px] font-extrabold uppercase tracking-wider text-violet-600">
                  Left Side
                </div>

                <div className="mt-1 text-2xl font-black text-slate-900">
                  {formatNumber(
                    leftCount
                  )}
                </div>

                <div className="mt-1 text-[10px] text-slate-500">
                  Members in left binary subtree
                </div>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">

                <ArrowUpRight className="h-5 w-5 -rotate-90" />

              </div>

            </div>

          </div>

          {/* Right */}

          <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <div className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600">
                  Right Side
                </div>

                <div className="mt-1 text-2xl font-black text-slate-900">
                  {formatNumber(
                    rightCount
                  )}
                </div>

                <div className="mt-1 text-[10px] text-slate-500">
                  Members in right binary subtree
                </div>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">

                <GitBranch className="h-5 w-5" />

              </div>

            </div>

          </div>

          {/* Total */}

          <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
                  Total Binary Team
                </div>

                <div className="mt-1 text-2xl font-black text-slate-900">
                  {formatNumber(
                    totalBinaryTeam
                  )}
                </div>

                <div className="mt-1 text-[10px] text-slate-500">
                  Active:{" "}
                  {formatNumber(
                    activeBinaryTeam
                  )}
                </div>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">

                <Activity className="h-5 w-5" />

              </div>

            </div>

          </div>

        </section>

        {/* ===================================================
            DIRECT REFERRALS
        =================================================== */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-100 via-violet-100 to-orange-100 p-[1px] shadow-xl shadow-pink-100/40">

          <div className="relative overflow-hidden rounded-[23px] bg-white/95 p-5 backdrop-blur-xl sm:p-7">

            <div className="pointer-events-none absolute -left-16 bottom-[-60px] h-40 w-40 rounded-full bg-pink-300/20 blur-3xl" />

            <div className="pointer-events-none absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-violet-300/20 blur-3xl" />

            <div className="relative">

              {/* HEADER */}

              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 text-white shadow-md shadow-violet-200">

                    <Users className="h-5 w-5" />

                  </div>

                  <div>

                    <h2 className="text-lg font-black text-slate-900">
                      Direct Referral Members
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Members directly connected to your sponsor/referral account.
                    </p>

                  </div>

                </div>

                <div className="flex w-fit items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-violet-700">

                  <Users className="h-3.5 w-3.5" />

                  {formatNumber(
                    directs.length
                  )}{" "}
                  Member
                  {directs.length === 1
                    ? ""
                    : "s"}

                </div>

              </div>

              {/* EMPTY */}

              {directs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 via-white to-violet-50/50 py-14 text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">

                    <Users className="h-7 w-7" />

                  </div>

                  <h3 className="mt-4 text-sm font-black text-slate-700">
                    No direct referrals yet
                  </h3>

                  <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
                    Members who register using your member code will appear here.
                  </p>

                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">

                  <table className="w-full min-w-[920px] text-left text-xs">

                    <thead className="bg-gradient-to-r from-violet-50 via-pink-50 to-orange-50">

                      <tr className="border-b border-slate-200 text-slate-500">

                        <th className="px-4 py-3 font-extrabold">
                          Member ID
                        </th>

                        <th className="px-4 py-3 font-extrabold">
                          Name
                        </th>

                        <th className="px-4 py-3 font-extrabold">
                          Mobile
                        </th>

                        <th className="px-4 py-3 font-extrabold">
                          Directs
                        </th>

                        <th className="px-4 py-3 font-extrabold">
                          Binary Team
                        </th>

                        <th className="px-4 py-3 font-extrabold">
                          Status
                        </th>

                        <th className="px-4 py-3 font-extrabold">
                          Joined On
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">

                      {directs.map(
                        (
                          member,
                          index
                        ) => {

                          const status =
                            String(
                              member?.status ||
                                "active"
                            ).toLowerCase();

                          const isActive =
                            status ===
                            "active";

                          const memberDirects =
                            Number(
                              member?.directReferralsCount ??
                                member?.totalReferral ??
                                0
                            );

                          const memberBinaryTeam =
                            Number(
                              member?.totalTeam ??
                                member?.teamCount ??
                                0
                            );

                          const joinedDate =
                            member?.createdAt
                              ? new Date(
                                  member.createdAt
                                ).toLocaleDateString(
                                  "en-IN"
                                )
                              : "—";

                          return (
                            <tr
                              key={
                                member?._id ||
                                member?.memberId ||
                                index
                              }
                              className="transition-colors hover:bg-violet-50/40"
                            >

                              {/* Member ID */}

                              <td className="px-4 py-4">

                                <span className="inline-flex rounded-lg bg-violet-50 px-2.5 py-1 font-mono font-extrabold text-violet-700">
                                  {member?.memberId ||
                                    member?.userCode ||
                                    "—"}
                                </span>

                              </td>

                              {/* Name */}

                              <td className="px-4 py-4">

                                <div className="font-bold text-slate-800">
                                  {member?.name ||
                                    "—"}
                                </div>

                              </td>

                              {/* Phone */}

                              <td className="px-4 py-4 text-slate-500">

                                {member?.phone ||
                                  "—"}

                              </td>

                              {/* Directs */}

                              <td className="px-4 py-4">

                                <span className="font-black text-pink-600">
                                  {formatNumber(
                                    memberDirects
                                  )}
                                </span>

                              </td>

                              {/* Binary Team */}

                              <td className="px-4 py-4">

                                <span className="font-black text-violet-600">
                                  {formatNumber(
                                    memberBinaryTeam
                                  )}
                                </span>

                              </td>

                              {/* Status */}

                              <td className="px-4 py-4">

                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                                    isActive
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-slate-200 bg-slate-50 text-slate-600"
                                  }`}
                                >

                                  {isActive && (
                                    <CheckCircle2 className="h-3 w-3" />
                                  )}

                                  {status}

                                </span>

                              </td>

                              {/* Joined */}

                              <td className="px-4 py-4 text-slate-500">

                                {joinedDate}

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
        </section>

        {/* ===================================================
            NETWORK INFO
        =================================================== */}

        <section className="relative mt-7 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 p-[1px] shadow-lg shadow-violet-100">

          <div className="relative overflow-hidden rounded-[23px] bg-white/10 px-5 py-5 backdrop-blur sm:px-7">

            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

            <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex flex-col gap-5 text-white sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">

                  <Sparkles className="h-5 w-5" />

                </div>

                <div>

                  <h3 className="text-sm font-black">
                    Binary Network Overview
                  </h3>

                  <p className="mt-1 max-w-2xl text-[11px] leading-5 text-white/75">
                    Your referral relationship and binary placement are maintained as separate structures. Direct referrals show your sponsor connections, while the binary tree shows left and right placement.
                  </p>

                </div>

              </div>

              <div className="grid grid-cols-3 gap-2">

                <div className="rounded-xl bg-white/10 px-3 py-2 text-center">

                  <div className="text-[9px] font-bold uppercase tracking-wider text-white/60">
                    Left
                  </div>

                  <div className="mt-0.5 text-sm font-black">
                    {formatNumber(
                      leftCount
                    )}
                  </div>

                </div>

                <div className="rounded-xl bg-white/10 px-3 py-2 text-center">

                  <div className="text-[9px] font-bold uppercase tracking-wider text-white/60">
                    Right
                  </div>

                  <div className="mt-0.5 text-sm font-black">
                    {formatNumber(
                      rightCount
                    )}
                  </div>

                </div>

                <div className="rounded-xl bg-white/10 px-3 py-2 text-center">

                  <div className="text-[9px] font-bold uppercase tracking-wider text-white/60">
                    Total
                  </div>

                  <div className="mt-0.5 text-sm font-black">
                    {formatNumber(
                      totalBinaryTeam
                    )}
                  </div>

                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ===================================================
            BOTTOM STRIP
        =================================================== */}

        <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500" />

      </main>
    </div>
  );
}

/* ============================================================
   FORMAT NUMBER
============================================================ */

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString("en-IN");
}