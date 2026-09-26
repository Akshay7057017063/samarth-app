import React, { useState, useEffect } from 'react';
import { CheckCircle2, TrendingUp, Users, Award, X } from 'lucide-react';

const LIVE_EVENTS = [
  { text: "Ramesh K. from Jaipur just received ₹1,800 bank payout (TDS: ₹90)", icon: TrendingUp, color: "text-emerald-400" },
  { text: "Sanjay M. from Pune just solved 25 daily verification captchas", icon: CheckCircle2, color: "text-teal-400" },
  { text: "Pooja V. from Dausa invited 3 new direct distributors", icon: Users, color: "text-cyan-400" },
  { text: "Amit S. from Ahmedabad unlocked Level 2 Network Commission", icon: Award, color: "text-amber-400" },
  { text: "Bio-Magnetic Healthcare Mat dispatched to Lucknow", icon: CheckCircle2, color: "text-emerald-400" },
  { text: "Kavita R. from Bhopal verified PAN KYC for 5% TDS rate", icon: CheckCircle2, color: "text-teal-400" }
];

export default function LiveTicker() {
  const [currentEvent, setCurrentEvent] = useState(null);
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (closed) return;

    const interval = setInterval(() => {
      const randomEvent = LIVE_EVENTS[Math.floor(Math.random() * LIVE_EVENTS.length)];
      setCurrentEvent(randomEvent);
      setVisible(true);

      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 5000);

      return () => clearTimeout(hideTimer);
    }, 9000);

    return () => clearInterval(interval);
  }, [closed]);

  if (!currentEvent || !visible || closed) return null;

  const Icon = currentEvent.icon;

  return (
    <div className="fixed bottom-6 left-6 z-40 max-w-sm animate-bounce-in transition-all">
      <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 p-3 rounded-xl shadow-2xl shadow-emerald-500/10 flex items-center gap-3 text-xs">
        <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0">
          <Icon className={`w-4 h-4 ${currentEvent.color}`} />
        </div>
        <div className="flex-1 pr-2">
          <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            Live Activity
          </div>
          <div className="text-slate-200 mt-0.5 font-medium leading-snug">
            {currentEvent.text}
          </div>
        </div>
        <button 
          onClick={() => setClosed(true)} 
          className="text-slate-500 hover:text-slate-300 p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
