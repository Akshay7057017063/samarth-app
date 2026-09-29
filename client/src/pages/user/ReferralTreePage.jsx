import React, { useEffect, useState } from "react";
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
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://api.bull-mark.com/api";

export default function ReferralTreePage() {
  const { user, token } = useAuth();

  const [treeData, setTreeData] = useState(null);
  const [directs, setDirects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setTreeData(null);
      setDirects([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchTree = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/referral/tree`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.message || "Unable to load referral tree."
          );
        }

        if (isMounted && data.success) {
          setTreeData(data.tree || null);
        }
      } catch (error) {
        console.error("REFERRAL TREE ERROR:", error);

        if (isMounted) {
          setTreeData(null);
        }
      }
    };

    const fetchDirects = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/referral/directs`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.message ||
              "Unable to load direct referrals."
          );
        }

        if (isMounted && data.success) {
          setDirects(
            Array.isArray(data.directs)
              ? data.directs
              : []
          );
        }
      } catch (error) {
        console.error(
          "DIRECT REFERRALS ERROR:",
          error
        );

        if (isMounted) {
          setDirects([]);
        }
      }
    };

    setLoading(true);

    Promise.all([
      fetchTree(),
      fetchDirects(),
    ]).finally(() => {
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // ----------------------------------------------------
  // SAFE CUSTOMER VALUES
  // ----------------------------------------------------

  const totalDownline = Number(
    user?.teamCount ??
      user?.totalTeam ??
      0
  );

  const memberId =
    user?.memberId ||
    user?.userCode ||
    "—";

  const activeDirects = directs.filter(
    (member) =>
      String(member?.status || "").toLowerCase() ===
      "active"
  ).length;

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

        {/* =====================================================
            BACK TO DASHBOARD
        ===================================================== */}

        <div className="mb-5 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-white/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 shadow-sm sm:flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            Customer Network
          </div>
        </div>

        {/* =====================================================
            HEADER
        ===================================================== */}

        <section className="relative mb-7 overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-[1px] shadow-xl shadow-violet-100/50 backdrop-blur-xl">

          <div className="relative overflow-hidden rounded-[23px] bg-gradient-to-br from-white via-violet-50/60 to-orange-50/70 px-5 py-7 sm:px-8 sm:py-8">

            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-pink-300/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-violet-300/20 blur-3xl" />
            <div className="pointer-events-none absolute right-1/3 top-1/3 h-32 w-32 rounded-full bg-cyan-200/20 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

              <div>

                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/90 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-violet-700 shadow-sm">
                  <Network className="h-4 w-4" />
                  My Network
                </div>

                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  Referral
                  <span className="ml-2 bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                    Tree
                  </span>
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  Explore your direct referrals and complete downline
                  network through your interactive customer genealogy tree.
                </p>

              </div>

              {/* Header Stats */}

              <div className="grid grid-cols-2 gap-3">

                <div className="min-w-[145px] rounded-2xl border border-violet-100 bg-white/90 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <Users className="h-3.5 w-3.5 text-violet-500" />
                    Direct Referrals
                  </div>

                  <div className="mt-1.5 text-2xl font-black text-slate-900">
                    {directs.length}
                  </div>
                </div>

                <div className="min-w-[145px] rounded-2xl border border-pink-100 bg-white/90 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <TrendingUp className="h-3.5 w-3.5 text-pink-500" />
                    Total Downline
                  </div>

                  <div className="mt-1.5 text-2xl font-black text-slate-900">
                    {totalDownline}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        <section className="mb-7 grid grid-cols-1 gap-4 md:grid-cols-4">

          {/* Direct Team */}

          <div className="group rounded-3xl border border-violet-100 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-100/50">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-transform group-hover:scale-105">
                <UserCheck className="h-5 w-5" />
              </div>

              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Direct Team
                </div>

                <div className="mt-1 text-lg font-black text-slate-900">
                  {directs.length}
                </div>
              </div>

            </div>
          </div>

          {/* Network Size */}

          <div className="group rounded-3xl border border-pink-100 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-100/50">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-100 text-pink-600 transition-transform group-hover:scale-105">
                <Network className="h-5 w-5" />
              </div>

              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Network Size
                </div>

                <div className="mt-1 text-lg font-black text-slate-900">
                  {totalDownline}
                </div>
              </div>

            </div>
          </div>

          {/* Active Directs */}

          <div className="group rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-100/50">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-transform group-hover:scale-105">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Active Directs
                </div>

                <div className="mt-1 text-lg font-black text-slate-900">
                  {activeDirects}
                </div>
              </div>

            </div>
          </div>

          {/* Member ID */}

          <div className="group rounded-3xl border border-orange-100 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-100/50">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600 transition-transform group-hover:scale-105">
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

        {/* =====================================================
            NETWORK TREE
        ===================================================== */}

        <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-200 via-pink-200 to-orange-200 p-[1px] shadow-xl shadow-violet-100/50">

          <div className="relative overflow-hidden rounded-[23px] bg-white/95 p-4 backdrop-blur-xl sm:p-6">

            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-orange-300/15 blur-3xl" />

            <div className="relative">

              {/* Header */}

              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-pink-500 to-orange-500 text-white shadow-lg shadow-violet-200">
                    <GitBranch className="h-5 w-5" />
                  </div>

                  <div>

                    <h2 className="text-lg font-black text-slate-900">
                      Interactive Network Tree
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Expand members and explore your referral hierarchy.
                    </p>

                  </div>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Network Active
                </div>

              </div>

              {/* Loading */}

              {loading ? (
                <div className="flex min-h-[380px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-violet-50/50">

                  <div className="text-center">

                    <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 via-pink-100 to-orange-100 text-violet-600 shadow-sm">
                      <Network className="h-7 w-7" />
                    </div>

                    <p className="mt-4 text-sm font-black text-slate-700">
                      Loading your network...
                    </p>

                    <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                      We are building your referral hierarchy from your
                      customer account.
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
                <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70">

                  <div className="max-w-md text-center">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                      <Network className="h-7 w-7" />
                    </div>

                    <h3 className="mt-4 text-sm font-black text-slate-700">
                      Network tree is currently unavailable
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Please refresh the page and try again. Your account
                      details remain available from the customer dashboard.
                    </p>

                  </div>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* =====================================================
            DIRECT REFERRALS
        ===================================================== */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-100 via-violet-100 to-orange-100 p-[1px] shadow-xl shadow-pink-100/40">

          <div className="relative overflow-hidden rounded-[23px] bg-white/95 p-5 backdrop-blur-xl sm:p-7">

            <div className="pointer-events-none absolute -left-16 bottom-[-60px] h-40 w-40 rounded-full bg-pink-300/20 blur-3xl" />
            <div className="pointer-events-none absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-violet-300/20 blur-3xl" />

            <div className="relative">

              {/* Header */}

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
                      Members directly connected to your customer account.
                    </p>

                  </div>

                </div>

                <div className="flex w-fit items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-violet-700">
                  <Users className="h-3.5 w-3.5" />
                  {directs.length} Member
                  {directs.length === 1 ? "" : "s"}
                </div>

              </div>

              {/* Empty State */}

              {directs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 via-white to-violet-50/50 py-14 text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <Users className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 text-sm font-black text-slate-700">
                    No direct referrals yet
                  </h3>

                  <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
                    Members who register through your referral will appear
                    here with their team information.
                  </p>

                  <Link
                    to="/dashboard"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-violet-200 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Back to Dashboard
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>

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
                          Team Size
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

                      {directs.map((member, index) => {

                        const status = String(
                          member?.status || "active"
                        ).toLowerCase();

                        const isActive =
                          status === "active";

                        const joinedDate =
                          member?.createdAt
                            ? new Date(
                                member.createdAt
                              ).toLocaleDateString("en-IN")
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
                                {member?.memberId || "—"}
                              </span>
                            </td>

                            {/* Name */}

                            <td className="px-4 py-4">
                              <div className="font-bold text-slate-800">
                                {member?.name || "—"}
                              </div>
                            </td>

                            {/* Phone */}

                            <td className="px-4 py-4 text-slate-500">
                              {member?.phone || "—"}
                            </td>

                            {/* Directs */}

                            <td className="px-4 py-4">
                              <span className="font-black text-pink-600">
                                {Number(
                                  member?.directReferralsCount ?? 0
                                )}
                              </span>
                            </td>

                            {/* Team */}

                            <td className="px-4 py-4">
                              <span className="font-black text-orange-600">
                                {Number(
                                  member?.teamCount ?? 0
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
                      })}

                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* =====================================================
            NETWORK INFO
        ===================================================== */}

        <section className="relative mt-7 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 p-[1px] shadow-lg shadow-violet-100">

          <div className="relative overflow-hidden rounded-[23px] bg-white/10 px-5 py-5 backdrop-blur sm:px-7">

            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-3 text-white">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>

                  <h3 className="text-sm font-black">
                    Grow Your Referral Network
                  </h3>

                  <p className="mt-1 max-w-2xl text-[11px] leading-5 text-white/75">
                    Use your referral tools from the customer dashboard to
                    share your network links and monitor your team activity.
                  </p>

                </div>

              </div>

              <Link
                to="/dashboard"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-violet-700 shadow-lg transition-all hover:bg-slate-50"
              >
                Open Dashboard
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>

            </div>
          </div>
        </section>

        {/* =====================================================
            BOTTOM RAINBOW STRIP
        ===================================================== */}

        <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500" />

      </main>
    </div>
  );
}