import React, { useState } from "react";
import {
  Network,
  Users,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
  UserCheck,
  ShieldCheck,
  TrendingUp,
  Crown,
} from "lucide-react";

/* ============================================================
   RECURSIVE TREE NODE
============================================================ */

function TreeNode({ node, isRoot = false }) {
  const [expanded, setExpanded] = useState(true);

  const hasChildren =
    Array.isArray(node?.children) &&
    node.children.length > 0;

  const directCount = Number(
    node?.directReferralsCount ?? 0
  );

  const teamCount = Number(
    node?.teamCount ?? 0
  );

  const status = String(
    node?.status || "active"
  ).toLowerCase();

  const isActive = status === "active";

  return (
    <div className="flex min-w-0 flex-col items-center">

      {/* ======================================================
          NODE CARD
      ====================================================== */}

      <div
        className={`relative z-10 w-[280px] overflow-hidden rounded-3xl p-[1px] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
          isRoot
            ? "bg-gradient-to-br from-violet-500 via-pink-500 to-orange-500 shadow-violet-200/60"
            : "bg-gradient-to-br from-slate-200 via-violet-100 to-pink-100 shadow-slate-200/60"
        }`}
      >
        <div
          className={`relative overflow-hidden rounded-[23px] p-4 ${
            isRoot
              ? "bg-gradient-to-br from-violet-50 via-white to-pink-50"
              : "bg-white"
          }`}
        >
          {/* Ambient Glow */}
          <div
            className={`pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full blur-2xl ${
              isRoot
                ? "bg-pink-200/40"
                : "bg-violet-200/30"
            }`}
          />

          {/* ==================================================
              TOP ROW
          ================================================== */}

          <div className="relative flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3">

            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide ${
                isRoot
                  ? "bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 text-white shadow-sm"
                  : "border border-violet-100 bg-violet-50 text-violet-700"
              }`}
            >
              {isRoot
                ? "You • Root"
                : `Tier ${node?.level ?? "—"}`}
            </span>

            <span className="max-w-[120px] truncate rounded-lg bg-white/80 px-2 py-1 font-mono text-[10px] font-black text-violet-600 shadow-sm ring-1 ring-violet-100">
              {node?.memberId || "—"}
            </span>
          </div>

          {/* ==================================================
              MEMBER INFO
          ================================================== */}

          <div className="relative mt-4 flex items-center gap-3">

            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${
                isRoot
                  ? "bg-gradient-to-br from-violet-600 via-pink-500 to-orange-500"
                  : "bg-gradient-to-br from-violet-500 to-pink-500"
              }`}
            >
              <span className="text-sm font-black">
                {String(node?.name || "U")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </span>
            </div>

            <div className="min-w-0">
              <div className="truncate text-sm font-black text-slate-900">
                {node?.name || "Unknown Member"}
              </div>

              <div className="mt-0.5 truncate text-[10px] text-slate-500">
                {node?.email || "No email available"}
              </div>
            </div>

          </div>

          {/* ==================================================
              STATUS
          ================================================== */}

          <div className="relative mt-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide ${
                isActive
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              {isActive && (
                <ShieldCheck className="h-3 w-3" />
              )}

              {status}
            </span>
          </div>

          {/* ==================================================
              STATS
          ================================================== */}

          <div className="relative mt-4 grid grid-cols-2 gap-2 border-t border-slate-200/80 pt-3">

            {/* Directs */}
            <div className="rounded-xl border border-pink-100 bg-gradient-to-br from-pink-50 to-white p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold uppercase tracking-wide text-pink-600">
                <UserCheck className="h-3 w-3" />
                Directs
              </div>

              <div className="mt-1 text-sm font-black text-slate-900">
                {directCount}
              </div>
            </div>

            {/* Team */}
            <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-[9px] font-extrabold uppercase tracking-wide text-violet-600">
                <Users className="h-3 w-3" />
                Team
              </div>

              <div className="mt-1 text-sm font-black text-slate-900">
                {teamCount}
              </div>
            </div>

          </div>

          {/* ==================================================
              EXPAND / COLLAPSE
          ================================================== */}

          {hasChildren && (
            <button
              type="button"
              onClick={() =>
                setExpanded((previous) => !previous)
              }
              className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[10px] font-extrabold transition-all ${
                expanded
                  ? "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                  : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
              }`}
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}

              <span>
                {expanded
                  ? "Collapse Downline"
                  : `View ${node.children.length} Downline`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================
          CHILDREN
      ====================================================== */}

      {hasChildren && expanded && (
        <div className="flex flex-col items-center">

          {/* Vertical connector from parent */}
          <div className="h-8 w-px bg-gradient-to-b from-violet-400 via-pink-400 to-orange-400" />

          <div className="relative flex justify-center gap-8 pt-8">

            {/* Horizontal connector */}
            {node.children.length > 1 && (
              <div className="absolute left-[10%] right-[10%] top-0 h-px rounded-full bg-gradient-to-r from-violet-300 via-pink-300 to-orange-300" />
            )}

            {node.children.map((child, index) => (
              <div
                key={
                  child?._id ||
                  child?.memberId ||
                  index
                }
                className="relative flex min-w-0 flex-col items-center"
              >

                {/* Child vertical connector */}
                <div className="absolute -top-8 h-8 w-px bg-gradient-to-b from-pink-300 to-slate-200" />

                <TreeNode
                  node={child}
                  isRoot={false}
                />

              </div>
            ))}

          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   REFERRAL TREE VISUALIZER
============================================================ */

export default function ReferralTreeVisualizer({
  tree,
  userMemberId,
}) {
  const [copied, setCopied] = useState(false);

  const referralLink = userMemberId
    ? `${window.location.origin}/register?ref=${encodeURIComponent(
        userMemberId
      )}`
    : "";

  const handleCopyLink = async () => {
    if (!referralLink) {
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        const textarea = document.createElement("textarea");

        textarea.value = referralLink;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);
        textarea.select();

        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (error) {
      console.error(
        "COPY REFERRAL LINK ERROR:",
        error
      );
    }
  };

  /* ==========================================================
     EMPTY / LOADING STATE
  ========================================================== */

  if (!tree) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-10 text-center shadow-sm">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 via-pink-100 to-orange-100 text-violet-600 shadow-sm">
          <Network className="h-7 w-7 animate-pulse" />
        </div>

        <h3 className="mt-5 text-sm font-black text-slate-800">
          Loading Your Network
        </h3>

        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
          Preparing your referral hierarchy and member
          relationships...
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ======================================================
          PERSONAL REFERRAL LINK
      ====================================================== */}

      <section className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-orange-50 p-[1px] shadow-sm">

        <div className="relative overflow-hidden rounded-[23px] p-5 sm:p-6">

          {/* Glows */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-pink-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="min-w-0 flex-1">

              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 text-white shadow-md shadow-violet-200">
                  <Sparkles className="h-4 w-4" />
                </div>

                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-600">
                    Referral Invitation
                  </div>

                  <h3 className="mt-0.5 text-sm font-black text-slate-900">
                    Your Personal Referral Link
                  </h3>
                </div>
              </div>

              <div className="break-all rounded-xl border border-white/80 bg-white/80 px-3.5 py-3 font-mono text-[11px] leading-5 text-slate-600 shadow-sm ring-1 ring-slate-100">
                {referralLink || "Referral link unavailable"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              disabled={!referralLink}
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-extrabold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                copied
                  ? "bg-emerald-500 shadow-emerald-200"
                  : "bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 shadow-violet-200 hover:shadow-xl"
              }`}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}

              <span>
                {copied
                  ? "Link Copied!"
                  : "Copy Invite Link"}
              </span>
            </button>

          </div>
        </div>
      </section>

      {/* ======================================================
          TREE INFORMATION
      ====================================================== */}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">

        <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-extrabold text-violet-700">
            <Network className="h-4 w-4" />
            Network Visualization
          </div>

          <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
            Expand or collapse members to explore the hierarchy.
          </p>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-extrabold text-pink-700">
            <Users className="h-4 w-4" />
            Downline Members
          </div>

          <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
            Each member node displays direct referrals and team size.
          </p>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-extrabold text-orange-700">
            <TrendingUp className="h-4 w-4" />
            Network Activity
          </div>

          <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
            Member relationships are shown from your account network data.
          </p>
        </div>

      </section>

      {/* ======================================================
          TREE CANVAS
      ====================================================== */}

      <section className="relative overflow-x-auto overflow-y-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-violet-50/50 p-4 shadow-inner sm:p-7">

        {/* Decorative background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(rgba(139,92,246,0.10) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Soft gradient wash */}
        <div className="pointer-events-none absolute left-1/4 top-0 h-40 w-40 rounded-full bg-violet-200/20 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 bottom-0 h-40 w-40 rounded-full bg-orange-200/20 blur-3xl" />

        <div className="relative flex min-w-max justify-center py-6 sm:py-8">

          <TreeNode
            node={tree}
            isRoot={true}
          />

        </div>
      </section>

      {/* ======================================================
          LEGEND
      ====================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[10px] font-bold text-slate-500">

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 shadow-sm" />
            <span>Your Account</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-violet-200" />
            <span>Network Member</span>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Active Member</span>
          </div>

          <div className="flex items-center gap-2">
            <Crown className="h-3.5 w-3.5 text-orange-500" />
            <span>Root Account</span>
          </div>

          <div className="flex items-center gap-2">
            <ChevronDown className="h-3.5 w-3.5 text-violet-500" />
            <span>Expanded</span>
          </div>

          <div className="flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-orange-500" />
            <span>Collapsed</span>
          </div>

        </div>
      </section>

    </div>
  );
}