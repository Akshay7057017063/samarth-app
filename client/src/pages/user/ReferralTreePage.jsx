import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import ReferralTreeVisualizer from '../../components/ReferralTreeVisualizer';
import { Network, Users, UserCheck, Shield, Sparkles } from 'lucide-react';

export default function ReferralTreePage() {
  const { user, token } = useAuth();
  const [treeData, setTreeData] = useState(null);
  const [directs, setDirects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Fetch Tree Hierarchy
      fetch('/api/referral/tree', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTreeData(data.tree);
        }
      })
      .catch(console.error);

      // Fetch Direct Referrals List
      fetch('/api/referral/directs', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDirects(data.directs);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    }
  }, [token]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
            <Network className="w-4 h-4" />
            <span>Genealogy Network Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            My Referral Chain Tree
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Interactive visual genealogy hierarchy showing your direct recruits and downline network expansion.
          </p>
        </div>

        <div className="flex gap-3 text-center">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Direct Recruits</div>
            <div className="text-lg font-black text-teal-400">{directs.length}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Downline</div>
            <div className="text-lg font-black text-emerald-400">{user?.teamCount || 0}</div>
          </div>
        </div>
      </div>

      {/* Visualizer */}
      <ReferralTreeVisualizer tree={treeData} userMemberId={user?.memberId} />

      {/* Direct Referrals Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">
              Direct Referral Members ({directs.length})
            </h3>
          </div>
        </div>

        {directs.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            You don't have any direct referrals yet. Copy your invite link above and share it with friends to start building your network!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/80">
                  <th className="pb-3">Member ID</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Mobile Phone</th>
                  <th className="pb-3">Directs</th>
                  <th className="pb-3">Team Size</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Joined On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {directs.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-3 font-mono font-bold text-emerald-400">{d.memberId}</td>
                    <td className="py-3 font-semibold text-white">{d.name}</td>
                    <td className="py-3 text-slate-400">{d.phone}</td>
                    <td className="py-3 font-bold text-teal-400">{d.directReferralsCount || 0}</td>
                    <td className="py-3 font-bold text-emerald-400">{d.teamCount || 0}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
