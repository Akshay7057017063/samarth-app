import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, CheckCircle2, AlertCircle, Sparkles, Shield, Coins, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CaptchaWorkstation() {
  const { token, updateWalletLocally } = useAuth();
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [todaySolved, setTodaySolved] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(50);
  const [rewardRate, setRewardRate] = useState(0.50);
  const [cooldown, setCooldown] = useState(0);

  // Load new captcha
  const loadNewCaptcha = async () => {
    try {
      setUserInput('');
      const res = await fetch('/api/captcha/new', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCaptchaSvg(data.svg);
        setCaptchaToken(data.token);
      }
    } catch (err) {
      setMessage({ text: 'Failed to load captcha. Check server connection.', type: 'error' });
    }
  };

  // Initial load
  useEffect(() => {
    if (token) {
      loadNewCaptcha();
      // Fetch user's current progress
      fetch('/api/wallet/summary', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.wallet) {
          setTodaySolved(data.wallet.todayCaptchasSolved || 0);
          setRewardRate(data.settings?.captchaReward || 0.50);
          setDailyLimit(data.settings?.dailyCaptchaLimit || 50);
        }
      })
      .catch(console.error);
    }
  }, [token]);

  // Handle Cooldown Timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) {
      setMessage({ text: 'Please enter the characters shown in the image.', type: 'error' });
      return;
    }

    if (cooldown > 0) {
      setMessage({ text: `Please wait ${cooldown}s before submitting next captcha.`, type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/captcha/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          token: captchaToken,
          answer: userInput.trim()
        })
      });

      const data = await res.json();

      if (data.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });

        setMessage({ text: data.message, type: 'success' });
        setTodaySolved(data.todayCaptchasSolved);
        updateWalletLocally(data.currentBalance, data.todayCaptchasSolved);
        
        // 3-second cooldown to discourage automated spamming
        setCooldown(3);
        loadNewCaptcha();
      } else {
        setMessage({ text: data.message || 'Incorrect captcha. Try again.', type: 'error' });
        loadNewCaptcha();
      }
    } catch (err) {
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = Math.min(100, Math.round((todaySolved / dailyLimit) * 100));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Coins className="w-4 h-4" />
            <span>Digital Micro-Task Workstation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Solve & Earn Instant Rewards
          </h2>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Reward Per Task</div>
            <div className="text-base font-black text-emerald-400">₹{rewardRate.toFixed(2)}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Daily Quota Progress Bar */}
      <div className="my-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-slate-300">Daily Task Completion</span>
          <span className="text-emerald-400 font-bold">{todaySolved} / {dailyLimit} Solved ({progressPercent}%)</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Captcha Box Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Captcha Image Container */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-950/70 border border-slate-800 rounded-2xl">
          <div className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <span>Type the distorted letters and digits below</span>
          </div>

          <div className="flex items-center gap-3">
            <div 
              className="rounded-xl overflow-hidden shadow-inner border border-slate-700 bg-white"
              dangerouslySetInnerHTML={{ __html: captchaSvg || '<div class="w-[220px] h-[75px] flex items-center justify-center text-xs text-slate-400">Loading Captcha...</div>' }}
            />
            <button
              type="button"
              onClick={loadNewCaptcha}
              disabled={loading}
              title="Refresh Captcha"
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* User Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Enter Verification Code
          </label>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type characters here..."
            maxLength={10}
            autoFocus
            disabled={loading || todaySolved >= dailyLimit}
            className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600 uppercase"
          />
        </div>

        {/* Feedback Message */}
        {message.text && (
          <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
              : 'bg-red-950/60 border border-red-500/40 text-red-300'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Submit Action */}
        <button
          type="submit"
          disabled={loading || cooldown > 0 || todaySolved >= dailyLimit}
          className="w-full py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <span>Verifying Solution...</span>
          ) : cooldown > 0 ? (
            <span>Please wait {cooldown}s...</span>
          ) : todaySolved >= dailyLimit ? (
            <span>Daily Limit Reached (Come back tomorrow)</span>
          ) : (
            <>
              <Coins className="w-4 h-4" />
              <span>Verify & Claim ₹{rewardRate.toFixed(2)}</span>
            </>
          )}
        </button>

      </form>

      {/* Network Synergy Note */}
      <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>10% Sponsor Bonus automatically shared with your direct inviter.</span>
        <span className="text-emerald-400 font-semibold">Instant Wallet Credit</span>
      </div>

    </div>
  );
}
