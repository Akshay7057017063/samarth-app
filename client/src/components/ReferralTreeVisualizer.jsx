
import React, { useMemo, useState } from "react";

import {
  ChevronDown,
  ChevronRight,
  Check,
  Circle,
  GitBranch,
  Network,
  ShieldCheck,
  Users,
} from "lucide-react";

// ============================================================
// HELPERS
// ============================================================

const getChildren = (node) => {
  if (!node?.children) {
    return { left: null, right: null };
  }

  if (
    typeof node.children === "object" &&
    !Array.isArray(node.children)
  ) {
    return {
      left: node.children.left || null,
      right: node.children.right || null,
    };
  }

  if (Array.isArray(node.children)) {
    return {
      left: node.children[0] || null,
      right: node.children[1] || null,
    };
  }

  return { left: null, right: null };
};

const getMemberName = (node) =>
  node?.name ||
  node?.fullName ||
  node?.memberName ||
  node?.username ||
  "Member";

const getInitials = (name) => {
  const parts = String(name || "Member")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "M";

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
};

const getMemberId = (node) =>
  node?.memberId ||
  node?.userCode ||
  node?.username ||
  "";

const getStatus = (node) =>
  String(node?.status || "inactive")
    .trim()
    .toLowerCase();

const getLevel = (node) =>
  Number(node?.binaryLevel ?? node?.level ?? 1);

const getDirectCount = (node) =>
  Number(node?.directReferralsCount ?? node?.totalReferral ?? 0);

const getTeamCount = (node) =>
  Number(node?.totalTeam ?? node?.teamCount ?? 0);

const getLeftCount = (node) =>
  Number(node?.leftCount ?? 0);

const getRightCount = (node) =>
  Number(node?.rightCount ?? 0);

// ============================================================
// EMPTY SLOT
// ============================================================

function EmptySlot({ position }) {
  const isLeft = position === "left";

  return (
    <div className="flex w-[108px] flex-col items-center sm:w-[140px]">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed sm:h-16 sm:w-16 ${
          isLeft
            ? "border-violet-300 bg-violet-50 text-violet-400"
            : "border-orange-300 bg-orange-50 text-orange-400"
        }`}
      >
        <Circle className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>

      <span
        className={`mt-1.5 text-[9px] font-black uppercase sm:text-[10px] ${
          isLeft ? "text-violet-600" : "text-orange-600"
        }`}
      >
        {isLeft ? "Left" : "Right"}
      </span>

      <span className="mt-0.5 text-[9px] text-slate-400">
        Empty slot
      </span>
    </div>
  );
}

// ============================================================
// MEMBER NODE
// ============================================================

function MemberNode({
  node,
  isRoot = false,
  position = null,
  expanded,
  hasChildren,
  onToggle,
}) {
  const name = getMemberName(node);
  const memberId = getMemberId(node);
  const isActive = getStatus(node) === "active";
  const initials = getInitials(name);
  const level = getLevel(node);
  const directCount = getDirectCount(node);
  const teamCount = getTeamCount(node);
  const leftCount = getLeftCount(node);
  const rightCount = getRightCount(node);

  return (
    <div
      className={`flex w-[108px] flex-col items-center rounded-2xl px-1.5 py-2 transition sm:w-[140px] sm:px-2 sm:py-3 ${
        isRoot
          ? "border border-violet-200 bg-white shadow-md shadow-violet-100"
          : "border border-slate-100 bg-white/90 shadow-sm"
      }`}
    >
      {/* MEMBER AVATAR */}

      <div className="relative">
        {isRoot && (
          <div className="absolute -inset-1 rounded-full bg-violet-300/30 blur-md" />
        )}

        <div
          className={`relative flex h-12 w-12 items-center justify-center rounded-full border-2 text-white shadow-sm sm:h-[62px] sm:w-[62px] sm:border-[3px] ${
            isRoot
              ? "border-white bg-gradient-to-br from-violet-600 via-pink-500 to-orange-500"
              : isActive
              ? "border-emerald-100 bg-gradient-to-br from-emerald-500 to-violet-600"
              : "border-slate-200 bg-gradient-to-br from-slate-400 to-slate-500"
          }`}
        >
          <span className="text-sm font-black sm:text-base">
            {initials}
          </span>

          {isActive && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 sm:h-5 sm:w-5">
              <Check className="h-2.5 w-2.5 text-white" />
            </span>
          )}

          {isRoot && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-white bg-slate-900 px-1.5 py-0.5 text-[7px] font-black uppercase text-white sm:px-2">
              You
            </span>
          )}
        </div>
      </div>

      {/* NAME */}

      <div
        className="mt-2 w-full truncate text-center text-[10px] font-black text-slate-800 sm:text-xs"
        title={name}
      >
        {name}
      </div>

      {/* MEMBER ID */}

      <div
        className="mt-0.5 w-full truncate text-center font-mono text-[8px] font-bold text-slate-400 sm:text-[9px]"
        title={memberId || "No ID"}
      >
        {memberId || "No ID"}
      </div>

      {/* POSITION AND LEVEL */}

      <div className="mt-1.5 flex items-center justify-center gap-1">
        {!isRoot && position && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[7px] font-black uppercase sm:text-[8px] ${
              position === "left"
                ? "bg-violet-50 text-violet-600"
                : "bg-orange-50 text-orange-600"
            }`}
          >
            {position}
          </span>
        )}

        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[7px] font-black text-slate-500 sm:text-[8px]">
          L{level}
        </span>

        <span
          className={`rounded-full px-1.5 py-0.5 text-[7px] font-black sm:text-[8px] ${
            isActive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* TEAM COUNTS */}

      <div className="mt-2 flex items-center justify-center gap-1.5 text-[8px] font-bold text-slate-500 sm:gap-2 sm:text-[9px]">
        <span className="inline-flex items-center gap-0.5">
          <Users className="h-3 w-3" />
          {teamCount}
        </span>

        <span className="text-slate-300">|</span>

        <span>D {directCount}</span>
      </div>

      {/* BINARY COUNTS */}

      <div className="mt-1.5 flex w-full items-center justify-center gap-1">
        <span className="rounded-md bg-violet-50 px-1.5 py-1 text-[8px] font-black text-violet-600 sm:text-[9px]">
          L: {leftCount}
        </span>

        <span className="rounded-md bg-orange-50 px-1.5 py-1 text-[8px] font-black text-orange-600 sm:text-[9px]">
          R: {rightCount}
        </span>
      </div>

      {/* EXPAND / COLLAPSE */}

      {hasChildren && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${name}'s team`}
          className="mt-2 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 active:scale-95 sm:h-8 sm:w-8"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      )}

      {!hasChildren && (
        <span className="mt-2 text-[8px] text-slate-400">
          End of branch
        </span>
      )}
    </div>
  );
}

// ============================================================
// RECURSIVE TREE NODE
// ============================================================

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

  return (
    <div className="flex flex-col items-center">
      <MemberNode
        node={node}
        isRoot={isRoot}
        position={position}
        expanded={expanded}
        hasChildren={hasChildren}
        onToggle={() => setExpanded((prev) => !prev)}
      />

      {hasChildren && expanded && (
        <div className="relative mt-4 sm:mt-6">
          {/* Parent connector */}

          <div className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-slate-300 sm:h-6" />

          {/* Children grid */}

          <div
            className={`relative grid grid-cols-2 pt-4 sm:pt-6 ${
              hasLeft && hasRight
                ? "gap-x-1 sm:gap-x-6"
                : "gap-x-0"
            }`}
          >
            {/* Horizontal connector */}

            {hasLeft && hasRight && (
              <div className="absolute left-1/4 right-1/4 top-0 h-px bg-slate-300" />
            )}

            {/* Left branch connector */}

            {hasLeft && (
              <div className="absolute left-1/4 top-0 h-4 w-px bg-violet-300 sm:h-6" />
            )}

            {/* Right branch connector */}

            {hasRight && (
              <div className="absolute right-1/4 top-0 h-4 w-px bg-orange-300 sm:h-6" />
            )}

            {/* Left child */}

            <div className="flex min-w-0 justify-center">
              {leftChild ? (
                <TreeNode
                  node={leftChild}
                  position="left"
                />
              ) : (
                <EmptySlot position="left" />
              )}
            </div>

            {/* Right child */}

            <div className="flex min-w-0 justify-center">
              {rightChild ? (
                <TreeNode
                  node={rightChild}
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

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ReferralTreeVisualizer({
  tree,
  userMemberId,
}) {
  // Reserved for identifying the logged-in member if needed.
  void userMemberId;

  if (!tree) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm sm:rounded-3xl sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
          <Network className="h-7 w-7 animate-pulse" />
        </div>

        <h3 className="mt-4 text-sm font-black text-slate-800">
          Loading Binary Tree
        </h3>

        <p className="mt-1 text-xs text-slate-400">
          Preparing your member network...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      {/* HEADER */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Network className="h-5 w-5" />
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-900 sm:text-base">
              Binary Network
            </h3>

            <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">
              Explore your left and right teams
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-[9px] font-bold text-emerald-700">
            <ShieldCheck className="h-3 w-3" />
            Active
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[9px] font-bold text-slate-600">
            <Circle className="h-3 w-3" />
            Inactive
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1.5 text-[9px] font-bold text-violet-700">
            <GitBranch className="h-3 w-3" />
            Binary Position
          </span>
        </div>
      </div>

      {/* MOBILE TREE INSTRUCTIONS */}

      <div className="rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-2.5 text-[10px] leading-4 text-violet-700 sm:hidden">
        <strong>Tip:</strong> Tap the arrow below a member to expand or
        collapse their team. Swipe horizontally to view wider branches.
      </div>

      {/* TREE CANVAS */}

      <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-violet-50/50 shadow-inner sm:rounded-3xl">
        <div
          className="flex w-max min-w-full justify-center px-2 py-5 sm:px-6 sm:py-8"
          style={{
            backgroundImage:
              "radial-gradient(rgba(139,92,246,0.09) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        >
          <TreeNode node={tree} isRoot />
        </div>
      </div>

      {/* LEGEND */}

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-4 sm:p-4">
        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600">
          <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-gradient-to-br from-violet-600 via-pink-500 to-orange-500" />
          You
        </div>

        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600">
          <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-violet-600" />
          Active Member
        </div>

        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600">
          <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-gradient-to-br from-slate-400 to-slate-500" />
          Inactive Member
        </div>

        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600">
          <span className="h-px w-5 shrink-0 bg-slate-400" />
          Connected Node
        </div>
      </div>

      {/* DESCRIPTION */}

      <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-3 text-center sm:rounded-2xl sm:px-4">
        <p className="text-[10px] leading-5 text-violet-700 sm:text-xs">
          Each circle represents one member. Connecting lines show the
          parent-to-child binary placement. Use the arrow buttons to
          navigate through your network.
        </p>
      </div>
    </div>
  );
}
