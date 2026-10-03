import React, { useMemo, useState } from "react";
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
  GitBranch,
  Circle,
} from "lucide-react";

/* ============================================================
   HELPERS
============================================================ */

const getChildren = (node) => {
  if (!node?.children) {
    return {
      left: null,
      right: null,
    };
  }

  // Backend binaryTree.js returns:
  // children: {
  //   left: {...} | null,
  //   right: {...} | null
  // }

  if (
    typeof node.children === "object" &&
    !Array.isArray(node.children)
  ) {
    return {
      left: node.children.left || null,
      right: node.children.right || null,
    };
  }

  // Backward compatibility if old frontend/backend
  // returns an array.
  if (Array.isArray(node.children)) {
    return {
      left: node.children[0] || null,
      right: node.children[1] || null,
    };
  }

  return {
    left: null,
    right: null,
  };
};

const getDirectCount = (node) => {
  return Number(
    node?.directReferralsCount ??
      node?.totalReferral ??
      0
  );
};

const getTeamCount = (node) => {
  return Number(
    node?.totalTeam ??
      node?.teamCount ??
      0
  );
};

const getLeftCount = (node) => {
  return Number(node?.leftCount ?? 0);
};

const getRightCount = (node) => {
  return Number(node?.rightCount ?? 0);
};

/* ============================================================
   EMPTY BINARY SLOT
============================================================ */

function EmptySlot({ position }) {
  const isLeft = position === "left";

  return (
    <div className="flex min-w-[240px] flex-col items-center">
      <div
        className={`flex w-[240px] flex-col items-center rounded-3xl border-2 border-dashed p-5 ${
          isLeft
            ? "border-violet-200 bg-violet-50/60"
            : "border-orange-200 bg-orange-50/60"
        }`}
      >
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            isLeft
              ? "bg-violet-100 text-violet-500"
              : "bg-orange-100 text-orange-500"
          }`}
        >
          <GitBranch className="h-5 w-5" />
        </div>

        <div
          className={`mt-3 text-[10px] font-black uppercase tracking-[0.16em] ${
            isLeft
              ? "text-violet-600"
              : "text-orange-600"
          }`}
        >
          {isLeft ? "Left Position" : "Right Position"}
        </div>

        <div className="mt-1 text-xs font-bold text-slate-500">
          Available
        </div>

        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-extrabold uppercase text-slate-400">
          <Circle className="h-2.5 w-2.5" />
          Empty Slot
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   RECURSIVE TREE NODE
============================================================ */

function TreeNode({
  node,
  isRoot = false,
  position = null,
}) {
  const [expanded, setExpanded] = useState(true);

  const children = useMemo(
    () => getChildren(node),
    [node]
  );

  const leftChild = children.left;
  const rightChild = children.right;

  const hasLeft = Boolean(leftChild);
  const hasRight = Boolean(rightChild);
  const hasChildren = hasLeft || hasRight;

  const directCount = getDirectCount(node);
  const teamCount = getTeamCount(node);

  const leftCount = getLeftCount(node);
  const rightCount = getRightCount(node);

  const status = String(
    node?.status || "active"
  ).toLowerCase();

  const isActive = status === "active";

  const binaryPosition = String(
    node?.binaryPosition || ""
  ).toLowerCase();

  const level = Number(
    node?.binaryLevel ??
      node?.level ??
      1
  );

  return (
    <div className="flex min-w-0 flex-col items-center">

      {/* ======================================================
          POSITION LABEL
      ====================================================== */}

      {!isRoot && position && (
        <div
          className={`mb-2 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
            position === "left"
              ? "border border-violet-200 bg-violet-50 text-violet-600"
              : "border border-orange-200 bg-orange-50 text-orange-600"
          }`}
        >
          {position} side
        </div>
      )}

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
                : `Level ${level}`}
            </span>

            <span className="max-w-[120px] truncate rounded-lg bg-white/80 px-2 py-1 font-mono text-[10px] font-black text-violet-600 shadow-sm ring-1 ring-violet-100">
              {node?.memberId ||
                node?.userCode ||
                "—"}
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
              STATUS + POSITION
          ================================================== */}

          <div className="relative mt-3 flex flex-wrap gap-2">

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

            {!isRoot && binaryPosition && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase ${
                  binaryPosition === "left"
                    ? "border-violet-200 bg-violet-50 text-violet-700"
                    : "border-orange-200 bg-orange-50 text-orange-700"
                }`}
              >
                <GitBranch className="h-3 w-3" />
                {binaryPosition}
              </span>
            )}

          </div>

          {/* ==================================================
              BINARY PATH
          ================================================== */}

          <div className="relative mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">

            <div className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
              Binary Path
            </div>

            <div className="mt-0.5 truncate font-mono text-[10px] font-bold text-slate-600">
              {node?.binaryPath || "/"}
            </div>

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

            {/* Total Team */}

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
              LEFT / RIGHT COUNTS
          ================================================== */}

          <div className="relative mt-2 grid grid-cols-2 gap-2">

            <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-2.5 py-2 text-center">

              <div className="text-[8px] font-extrabold uppercase tracking-wide text-violet-500">
                Left Team
              </div>

              <div className="mt-0.5 text-xs font-black text-violet-700">
                {leftCount}
              </div>

            </div>

            <div className="rounded-xl border border-orange-100 bg-orange-50/60 px-2.5 py-2 text-center">

              <div className="text-[8px] font-extrabold uppercase tracking-wide text-orange-500">
                Right Team
              </div>

              <div className="mt-0.5 text-xs font-black text-orange-700">
                {rightCount}
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
                setExpanded(
                  (previous) => !previous
                )
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
                  : `View ${
                      Number(hasLeft) +
                      Number(hasRight)
                    } Downline`}
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

          {/* ==================================================
              CHILDREN AREA
          ================================================== */}

          <div className="relative flex justify-center gap-8 pt-8">

            {/* Horizontal connector */}

            <div className="absolute left-[120px] right-[120px] top-0 h-px rounded-full bg-gradient-to-r from-violet-300 via-pink-300 to-orange-300" />

            {/* ==================================================
                LEFT
            ================================================== */}

            <div className="relative flex min-w-0 flex-col items-center">

              {/* Left vertical connector */}

              <div className="absolute -top-8 h-8 w-px bg-gradient-to-b from-violet-300 to-slate-200" />

              {leftChild ? (
                <TreeNode
                  node={leftChild}
                  isRoot={false}
                  position="left"
                />
              ) : (
                <EmptySlot position="left" />
              )}

            </div>

            {/* ==================================================
                RIGHT
            ================================================== */}

            <div className="relative flex min-w-0 flex-col items-center">

              {/* Right vertical connector */}

              <div className="absolute -top-8 h-8 w-px bg-gradient-to-b from-orange-300 to-slate-200" />

              {rightChild ? (
                <TreeNode
                  node={rightChild}
                  isRoot={false}
                  position="right"
                />
              ) : (
                <EmptySlot position="right" />
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

/* ============================================================
   BINARY TREE VISUALIZER
============================================================ */

export default function ReferralTreeVisualizer({
  tree,
  userMemberId,
}) {
  const [copied, setCopied] = useState(false);

  const referralLink =
    typeof window !== "undefined" &&
    userMemberId
      ? `${window.location.origin}/register?ref=${encodeURIComponent(
          userMemberId
        )}`
      : "";

  /* ==========================================================
     COPY REFERRAL LINK
  ========================================================== */

  const handleCopyLink = async () => {
    if (!referralLink) {
      return;
    }

    try {
      if (
        navigator?.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(
          referralLink
        );
      } else {
        const textarea =
          document.createElement("textarea");

        textarea.value = referralLink;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);

        textarea.select();

        document.execCommand("copy");

        document.body.removeChild(
          textarea
        );
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
          Loading Your Binary Tree
        </h3>

        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
          Preparing your binary network and member
          placement...
        </p>

      </div>
    );
  }

  /* ==========================================================
     MAIN UI
  ========================================================== */

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

                {referralLink ||
                  "Referral link unavailable"}

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
          TREE SUMMARY
      ====================================================== */}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">

        {/* Binary Tree */}

        <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm">

          <div className="flex items-center gap-2 text-xs font-extrabold text-violet-700">

            <Network className="h-4 w-4" />

            Binary Tree

          </div>

          <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
            Your binary placement is shown through
            left and right positions.
          </p>

        </div>

        {/* Left / Right */}

        <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-white p-4 shadow-sm">

          <div className="flex items-center gap-2 text-xs font-extrabold text-pink-700">

            <GitBranch className="h-4 w-4" />

            Left & Right Teams

          </div>

          <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
            Every member is placed on either the
            left or right side.
          </p>

        </div>

        {/* Team */}

        <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm">

          <div className="flex items-center gap-2 text-xs font-extrabold text-orange-700">

            <TrendingUp className="h-4 w-4" />

            Team Structure

          </div>

          <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
            Explore your binary downline level by
            level.
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

        <div className="pointer-events-none absolute bottom-0 right-1/4 h-40 w-40 rounded-full bg-orange-200/20 blur-3xl" />

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

            <span>Binary Member</span>

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

            <GitBranch className="h-3.5 w-3.5 text-violet-500" />

            <span>Left / Right Position</span>

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