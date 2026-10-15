import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  GitBranch,
  Minus,
  Network,
  Plus,
  Users,
  X,
  ArrowLeft,
  Crosshair,
} from "lucide-react";

// ============================================================
// HELPERS
// ============================================================

const getChildren = (node) => {
  if (!node?.children) return { left: null, right: null };
  if (Array.isArray(node.children)) {
    return { left: node.children[0] || null, right: node.children[1] || null };
  }
  if (typeof node.children === "object") {
    return { left: node.children.left || null, right: node.children.right || null };
  }
  return { left: null, right: null };
};

const getName = (n) =>
  n?.name || n?.fullName || n?.memberName || n?.username || "Member";

const getInitials = (name) => {
  const p = String(name || "M").trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "M";
  if (p.length === 1) return p[0][0].toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const getMemberId = (n) => n?.memberId || n?.userCode || n?.username || "";
const isActiveNode = (n) =>
  String(n?.status || "inactive").trim().toLowerCase() === "active";
const getLevel = (n) => Number(n?.binaryLevel ?? n?.level ?? 1);
const getDirect = (n) => Number(n?.directReferralsCount ?? n?.totalReferral ?? 0);
const getTeam = (n) => Number(n?.totalTeam ?? n?.teamCount ?? 0);
const getLeft = (n) => Number(n?.leftCount ?? 0);
const getRight = (n) => Number(n?.rightCount ?? 0);

// ============================================================
// SMALL NODE (what you see in the tree)
// ============================================================

function MemberNode({
  node,
  isRoot,
  expanded,
  hasChildren,
  onToggle,
  onSelect,
  selected,
}) {
  const name = getName(node);
  const active = isActiveNode(node);

  return (
    <div className="flex w-[68px] flex-col items-center">
      <button
        type="button"
        onClick={() => onSelect(node)}
        aria-label={`View details of ${name}`}
        className="group relative flex flex-col items-center focus:outline-none"
      >
        <span
          className={`relative flex h-10 w-10 items-center justify-center rounded-full text-[11px] font-bold text-white transition group-active:scale-95 group-focus-visible:ring-2 group-focus-visible:ring-violet-500 group-focus-visible:ring-offset-2 ${
            isRoot
              ? "bg-gradient-to-br from-violet-600 to-orange-500"
              : active
              ? "bg-emerald-600"
              : "bg-slate-400"
          } ${selected ? "ring-2 ring-violet-500 ring-offset-2" : ""}`}
        >
          {getInitials(name)}
          <span
            className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white ${
              active ? "bg-emerald-400" : "bg-slate-300"
            }`}
          />
        </span>

        <span className="mt-1 w-[64px] truncate text-center text-[10px] font-semibold leading-tight text-slate-800">
          {isRoot ? "You" : name}
        </span>
      </button>

      {hasChildren && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${name}'s team`}
          className="mt-0.5 inline-flex min-h-[22px] items-center gap-0.5 rounded-full border border-slate-200 bg-white px-1.5 text-[9px] font-semibold text-slate-600 active:bg-slate-100"
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {getTeam(node)}
        </button>
      )}
    </div>
  );
}

function EmptySlot({ side }) {
  return (
    <div className="flex w-[68px] flex-col items-center">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed text-[9px] font-semibold ${
          side === "left"
            ? "border-violet-200 text-violet-300"
            : "border-orange-200 text-orange-300"
        }`}
      >
        {side === "left" ? "L" : "R"}
      </span>
      <span className="mt-1 text-[9px] text-slate-400">Empty</span>
    </div>
  );
}

// ============================================================
// RECURSIVE TREE
// ============================================================

// Wraps one child cell and draws the connector lines above it.
function ChildCell({ side, both, muted, children }) {
  const color = muted
    ? "bg-slate-200"
    : side === "left"
    ? "bg-violet-300"
    : "bg-orange-300";

  return (
    <div className="relative px-1 pt-4">
      {/* vertical drop to child */}
      <span className={`absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 ${color}`} />
      {/* horizontal arm toward the sibling */}
      {both && side === "left" && (
        <span className={`absolute left-1/2 right-0 top-0 h-px ${color}`} />
      )}
      {both && side === "right" && (
        <span className={`absolute left-0 right-1/2 top-0 h-px ${color}`} />
      )}
      {children}
    </div>
  );
}

function TreeNode({ node, isRoot = false, depth = 0, selectedKey, onSelect }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const { left, right } = useMemo(() => getChildren(node), [node]);
  const hasChildren = Boolean(left || right);
  const key = getMemberId(node) || getName(node);

  return (
    <div className="flex flex-col items-center">
      <MemberNode
        node={node}
        isRoot={isRoot}
        expanded={expanded}
        hasChildren={hasChildren}
        onToggle={() => setExpanded((v) => !v)}
        onSelect={onSelect}
        selected={selectedKey === key}
      />

      {hasChildren && expanded && (
        <div className="relative flex">
          <span className="absolute left-1/2 top-0 h-0 w-px" />
          <ChildCell side="left" both muted={!left}>
            {left ? (
              <TreeNode
                node={left}
                depth={depth + 1}
                selectedKey={selectedKey}
                onSelect={onSelect}
              />
            ) : (
              <EmptySlot side="left" />
            )}
          </ChildCell>
          <ChildCell side="right" both muted={!right}>
            {right ? (
              <TreeNode
                node={right}
                depth={depth + 1}
                selectedKey={selectedKey}
                onSelect={onSelect}
              />
            ) : (
              <EmptySlot side="right" />
            )}
          </ChildCell>
        </div>
      )}
    </div>
  );
}

// ============================================================
// DETAIL SHEET (opens when a member is tapped)
// ============================================================

function Stat({ label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-800",
    violet: "bg-violet-50 text-violet-700",
    orange: "bg-orange-50 text-orange-700",
  };
  return (
    <div className={`rounded-xl px-3 py-2.5 ${tones[tone]}`}>
      <div className="text-lg font-bold leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-medium opacity-70">{label}</div>
    </div>
  );
}

function Row({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="truncate text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

function DetailSheet({ node, canFocus, onFocus, onClose }) {
  useEffect(() => {
    if (!node) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [node, onClose]);

  if (!node) return null;

  const name = getName(node);
  const active = isActiveNode(node);
  const { left, right } = getChildren(node);
  const hasChildren = Boolean(left || right);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${name} details`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-sm sm:rounded-3xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />

        <div className="flex items-start gap-3">
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${
              active ? "bg-emerald-600" : "bg-slate-400"
            }`}
          >
            {getInitials(name)}
          </span>

          <div className="min-w-0 flex-1">
            <h4 className="truncate text-base font-bold text-slate-900">{name}</h4>
            <p className="truncate font-mono text-xs text-slate-500">
              {getMemberId(node) || "No ID"}
            </p>
            <span
              className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {active ? "Active" : "Inactive"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="Total team" value={getTeam(node)} />
          <Stat label="Direct referrals" value={getDirect(node)} />
          <Stat label="Left team" value={getLeft(node)} tone="violet" />
          <Stat label="Right team" value={getRight(node)} tone="orange" />
        </div>

        <div className="mt-3">
          <Row label="Level" value={`L${getLevel(node)}`} />
          <Row label="Placement" value={node.position || node.side} />
          <Row label="Sponsor" value={node.sponsorName || node.sponsorId} />
          <Row label="Phone" value={node.phone || node.mobile} />
          <Row label="Email" value={node.email} />
          <Row label="Joined" value={node.joinedAt || node.createdAt} />
        </div>

        {canFocus && hasChildren && (
          <button
            type="button"
            onClick={() => onFocus(node)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white active:bg-violet-700"
          >
            <Crosshair className="h-4 w-4" />
            View {name.split(" ")[0]}'s tree
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ReferralTreeVisualizer({ tree, userMemberId }) {
  void userMemberId;

  const [selected, setSelected] = useState(null);
  const [focusStack, setFocusStack] = useState([]); // drill-down history
  const [zoom, setZoom] = useState(1);

  if (!tree) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center">
        <Network className="mx-auto h-7 w-7 animate-pulse text-violet-500" />
        <h3 className="mt-3 text-sm font-bold text-slate-800">Loading binary tree</h3>
        <p className="mt-1 text-xs text-slate-400">Preparing your network...</p>
      </div>
    );
  }

  const currentRoot = focusStack.length ? focusStack[focusStack.length - 1] : tree;
  const isTopRoot = focusStack.length === 0;
  const selectedKey = selected ? getMemberId(selected) || getName(selected) : null;

  const handleFocus = (node) => {
    setFocusStack((s) => [...s, node]);
    setSelected(null);
  };

  const clamp = (v) => Math.min(1.3, Math.max(0.6, Math.round(v * 10) / 10));

  return (
    <div className="w-full min-w-0 space-y-3">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Network className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900">Binary network</h3>
            <p className="truncate text-[11px] text-slate-500">
              Tap a member to see details
            </p>
          </div>
        </div>

        {/* ZOOM */}
        <div className="flex shrink-0 items-center rounded-full border border-slate-200 bg-white">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => clamp(z - 0.1))}
            className="flex h-8 w-8 items-center justify-center text-slate-600 active:bg-slate-100"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-9 text-center text-[11px] font-semibold text-slate-600">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => clamp(z + 0.1))}
            className="flex h-8 w-8 items-center justify-center text-slate-600 active:bg-slate-100"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* BACK BAR when drilled into a member */}
      {!isTopRoot && (
        <button
          type="button"
          onClick={() => setFocusStack((s) => s.slice(0, -1))}
          className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 active:bg-violet-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back · viewing {getName(currentRoot)}
        </button>
      )}

      {/* TREE CANVAS */}
      <div className="w-full min-w-0 overflow-auto overscroll-contain rounded-2xl border border-slate-200 bg-slate-50/60">
        <div
          className="flex w-max min-w-full justify-center px-3 py-4"
          style={{ zoom }}
        >
          <TreeNode
            key={getMemberId(currentRoot) || getName(currentRoot)}
            node={currentRoot}
            isRoot={isTopRoot}
            selectedKey={selectedKey}
            onSelect={setSelected}
          />
        </div>
      </div>

      {/* LEGEND */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Inactive
        </span>
        <span className="flex items-center gap-1.5">
          <GitBranch className="h-3 w-3 text-violet-500" /> Left
          <span className="h-px w-3 bg-violet-300" />
          <span className="h-px w-3 bg-orange-300" /> Right
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3 w-3" /> Number = team size
        </span>
      </div>

      {/* DETAIL SHEET */}
      <DetailSheet
        node={selected}
        canFocus={selected !== currentRoot}
        onFocus={handleFocus}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}