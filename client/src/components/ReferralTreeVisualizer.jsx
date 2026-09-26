import React, { useState } from 'react';
import { Network, Users, ChevronDown, ChevronRight, UserCheck, Shield, Copy, Check, Sparkles } from 'lucide-react';

// Recursive Tree Node Component
function TreeNode({ node, isRoot = false }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div 
        className={`relative z-10 w-64 p-4 rounded-2xl border transition-all duration-300 shadow-xl ${
          isRoot 
            ? 'bg-gradient-to-b from-emerald-900/90 to-slate-900 border-emerald-400/80 shadow-emerald-500/20' 
            : 'bg-slate-900/90 border-slate-700 hover:border-teal-400/60 shadow-slate-950/60'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isRoot ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-teal-300'
          }`}>
            {isRoot ? 'You (Upline Root)' : `Tier Level ${node.level}`}
          </span>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            {node.memberId}
          </span>
        </div>

        <div className="mt-2.5">
          <div className="text-sm font-bold text-white truncate">{node.name}</div>
          <div className="text-[11px] text-slate-400 truncate">{node.email}</div>
        </div>

        {/* Stats Row */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">Directs</div>
            <div className="font-bold text-teal-400">{node.directReferralsCount || 0}</div>
          </div>
          <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">Total Team</div>
            <div className="font-bold text-emerald-400">{node.teamCount || 0}</div>
          </div>
        </div>

        {/* Expand/Collapse Toggle if has children */}
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-3 py-1 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <span>{expanded ? 'Collapse Downline' : `View ${node.children.length} Downline`}</span>
          </button>
        )}
      </div>

      {/* Children branches */}
      {hasChildren && expanded && (
        <div className="flex flex-col items-center">
          {/* Vertical connecting line down */}
          <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-500 to-teal-500"></div>

          {/* Children container with horizontal connector */}
          <div className="relative flex justify-center gap-8 pt-6">
            {/* Horizontal line across children */}
            {node.children.length > 1 && (
              <div 
                className="absolute top-0 h-0.5 bg-slate-700"
                style={{
                  left: '15%',
                  right: '15%'
                }}
              ></div>
            )}

            {node.children.map((child, idx) => (
              <div key={idx} className="relative flex flex-col items-center">
                {/* Branch line into child */}
                <div className="w-0.5 h-6 bg-slate-700 absolute -top-6"></div>
                <TreeNode node={child} isRoot={false} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReferralTreeVisualizer({ tree, userMemberId }) {
  const [copied, setCopied] = useState(false);
  const referralLink = `${window.location.origin}/register?ref=${userMemberId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!tree) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl">
        <Users className="w-8 h-8 text-slate-500 mx-auto mb-2 animate-bounce" />
        <p className="text-sm text-slate-400">Loading downline genealogy tree...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Referral Link Card */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Your Personal Referral Invite Link</span>
          </div>
          <div className="text-xs text-slate-300 mt-1 font-mono break-all">
            {referralLink}
          </div>
        </div>

        <button
          onClick={handleCopyLink}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
        </button>
      </div>

      {/* Genealogy Tree Visual Canvas */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 overflow-x-auto min-h-[500px] flex justify-center items-start shadow-inner">
        <div className="min-w-fit py-4">
          <TreeNode node={tree} isRoot={true} />
        </div>
      </div>

    </div>
  );
}
