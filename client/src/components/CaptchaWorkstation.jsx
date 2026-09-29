import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "../context/AuthContext";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Coins,
  Clock3,
  TrendingUp,
  ImageIcon,
} from "lucide-react";
import confetti from "canvas-confetti";

const CAPTCHA_TIMEOUT_SECONDS = 10;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://api.bull-mark.com/api";

export default function CaptchaWorkstation() {
  const { token, updateWalletLocally } = useAuth();

  const [captchaSvg, setCaptchaSvg] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [userInput, setUserInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const [message, setMessage] = useState({
    text: "",
    type: "",
  });

  const [todaySolved, setTodaySolved] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(50);
  const [rewardRate, setRewardRate] = useState(0.5);

  const [cooldown, setCooldown] = useState(0);

  const [timeLeft, setTimeLeft] = useState(
    CAPTCHA_TIMEOUT_SECONDS
  );

  // ==========================================================
  // LOAD NEW CAPTCHA
  // ==========================================================

  const loadNewCaptcha = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setCaptchaLoading(true);

      setCaptchaSvg("");
      setCaptchaToken("");
      setUserInput("");
      setTimeLeft(0);

      const res = await fetch(
        `${API_BASE_URL}/captcha/new`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load CAPTCHA."
        );
      }

      setCaptchaSvg(data.svg || "");
      setCaptchaToken(data.token || "");

      setTimeLeft(
        Number(
          data.expiresInSeconds ||
            CAPTCHA_TIMEOUT_SECONDS
        )
      );
    } catch (error) {
      console.error(
        "LOAD CAPTCHA ERROR:",
        error
      );

      setCaptchaSvg("");
      setCaptchaToken("");
      setUserInput("");
      setTimeLeft(0);

      setMessage({
        text:
          error.message ||
          "Failed to load CAPTCHA. Check server connection.",
        type: "error",
      });
    } finally {
      setCaptchaLoading(false);
    }
  }, [token]);

  // ==========================================================
  // LOAD CUSTOMER WALLET / CAPTCHA PROGRESS
  // ==========================================================

  const loadCaptchaProgress = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/wallet/summary`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        return;
      }

      if (data.wallet) {
        setTodaySolved(
          Number(
            data.wallet.todayCaptchasSolved || 0
          )
        );
      }

      if (data.settings) {
        setRewardRate(
          Number(
            data.settings.captchaReward ?? 0.5
          )
        );

        setDailyLimit(
          Number(
            data.settings.dailyCaptchaLimit ?? 50
          )
        );
      }
    } catch (error) {
      console.error(
        "LOAD CAPTCHA PROGRESS ERROR:",
        error
      );
    }
  }, [token]);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    loadNewCaptcha();
    loadCaptchaProgress();
  }, [
    token,
    loadNewCaptcha,
    loadCaptchaProgress,
  ]);

  // ==========================================================
  // COOLDOWN TIMER
  // ==========================================================

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setCooldown((previous) =>
        Math.max(0, previous - 1)
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  // ==========================================================
  // CAPTCHA 10 SECOND EXPIRY TIMER
  // ==========================================================

  useEffect(() => {
    if (!captchaToken) {
      return;
    }

    if (captchaLoading) {
      return;
    }

    if (loading) {
      return;
    }

    if (todaySolved >= dailyLimit) {
      return;
    }

    if (timeLeft <= 0) {
      setUserInput("");

      setMessage({
        text:
          "This CAPTCHA expired after 10 seconds. Loading a new CAPTCHA...",
        type: "error",
      });

      loadNewCaptcha();

      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((previous) =>
        Math.max(0, previous - 1)
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    captchaToken,
    timeLeft,
    captchaLoading,
    loading,
    todaySolved,
    dailyLimit,
    loadNewCaptcha,
  ]);

  // ==========================================================
  // HANDLE CAPTCHA SUBMIT
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedInput = userInput.trim();

    if (!trimmedInput) {
      setMessage({
        text:
          "Please enter the characters shown in the image.",
        type: "error",
      });

      return;
    }

    if (!captchaToken) {
      setMessage({
        text:
          "CAPTCHA is not ready. Please refresh and try again.",
        type: "error",
      });

      return;
    }

    if (timeLeft <= 0) {
      setMessage({
        text:
          "This CAPTCHA has expired. Please wait for the new CAPTCHA.",
        type: "error",
      });

      setUserInput("");

      await loadNewCaptcha();

      return;
    }

    if (cooldown > 0) {
      setMessage({
        text: `Please wait ${cooldown}s before submitting the next CAPTCHA.`,
        type: "error",
      });

      return;
    }

    if (todaySolved >= dailyLimit) {
      setMessage({
        text:
          "Your daily CAPTCHA limit has been reached.",
        type: "error",
      });

      return;
    }

    setLoading(true);

    setMessage({
      text: "",
      type: "",
    });

    try {
      const res = await fetch(
        `${API_BASE_URL}/captcha/solve`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            token: captchaToken,
            answer: trimmedInput,
          }),
        }
      );

      const data = await res.json();

      // ======================================================
      // SUCCESS
      // ======================================================

      if (data.success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: {
            y: 0.7,
          },
        });

        const solved = Number(
          data.todayCaptchasSolved ??
            todaySolved + 1
        );

        const reward = Number(
          data.reward ?? rewardRate
        );

        setTodaySolved(solved);

        if (
          data.dailyCaptchaLimit !== undefined
        ) {
          setDailyLimit(
            Number(data.dailyCaptchaLimit)
          );
        }

        if (
          data.currentBalance !== undefined
        ) {
          updateWalletLocally(
            Number(data.currentBalance),
            solved
          );
        } else {
          updateWalletLocally(
            undefined,
            solved
          );
        }

        setMessage({
          text:
            data.message ||
            `CAPTCHA solved successfully. ₹${reward.toFixed(
              2
            )} added to your wallet.`,
          type: "success",
        });

        setUserInput("");
        setTimeLeft(0);

        setCooldown(3);

        await loadNewCaptcha();

        return;
      }

      // ======================================================
      // DAILY LIMIT
      // ======================================================

      if (
        res.status === 429 ||
        data.result === "limit"
      ) {
        setTodaySolved(
          Number(
            data.todayCaptchasSolved ??
              dailyLimit
          )
        );

        setMessage({
          text:
            data.message ||
            `Daily CAPTCHA limit of ${dailyLimit} reached.`,
          type: "error",
        });

        setUserInput("");
        setCaptchaSvg("");
        setCaptchaToken("");
        setTimeLeft(0);

        return;
      }

      // ======================================================
      // INVALID / EXPIRED / TAMPERED CAPTCHA
      // ======================================================

      if (data.counted === false) {
        setMessage({
          text:
            data.message ||
            data.reason ||
            "This CAPTCHA is invalid or expired. Please try a new one.",
          type: "error",
        });

        setUserInput("");
        setTimeLeft(0);

        await loadNewCaptcha();

        return;
      }

      // ======================================================
      // WRONG ANSWER
      // ======================================================

      if (
        data.result === "wrong" &&
        data.counted === true
      ) {
        setMessage({
          text:
            data.message ||
            "Incorrect CAPTCHA. Please try again.",
          type: "error",
        });

        setUserInput("");
        setTimeLeft(0);

        await loadNewCaptcha();

        return;
      }

      // ======================================================
      // GENERIC BACKEND ERROR
      // ======================================================

      setMessage({
        text:
          data.message ||
          data.reason ||
          "Unable to verify CAPTCHA.",
        type: "error",
      });

      setUserInput("");
      setTimeLeft(0);

      await loadNewCaptcha();
    } catch (error) {
      console.error(
        "CAPTCHA SUBMIT ERROR:",
        error
      );

      setMessage({
        text:
          "Network error. Please check the server connection and try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // MANUAL REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    if (loading || captchaLoading) {
      return;
    }

    setMessage({
      text: "",
      type: "",
    });

    await loadNewCaptcha();
  };

  // ==========================================================
  // PROGRESS
  // ==========================================================

  const safeDailyLimit =
    dailyLimit > 0 ? dailyLimit : 50;

  const progressPercent = Math.min(
    100,
    Math.round(
      (todaySolved / safeDailyLimit) * 100
    )
  );

  const limitReached =
    todaySolved >= safeDailyLimit;

  const countdownPercent = Math.max(
    0,
    Math.min(
      100,
      (timeLeft /
        CAPTCHA_TIMEOUT_SECONDS) *
        100
    )
  );

  const isExpiringSoon =
    timeLeft <= 3 &&
    timeLeft > 0;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">

      {/* AMBIENT BACKGROUND */}

      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl" />

      <div className="pointer-events-none absolute -right-20 top-20 h-56 w-56 rounded-full bg-pink-400/10 blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-orange-400/10 blur-3xl" />

      {/* HEADER */}

      <div className="relative flex flex-col justify-between gap-5 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center">

        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-gradient-to-r from-violet-50 via-pink-50 to-orange-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-700">
            <Sparkles className="h-3.5 w-3.5 text-pink-500" />

            <span>
              Digital Micro-Task Workstation
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            Solve & Earn{" "}
            <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              Instant Rewards
            </span>
          </h2>

          <p className="mt-1.5 text-sm text-slate-500">
            Complete valid CAPTCHA tasks and receive
            wallet rewards instantly.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-orange-50 px-4 py-3 shadow-sm">

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Reward Per Task
            </div>

            <div className="mt-0.5 bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 bg-clip-text text-lg font-black text-transparent">
              ₹{rewardRate.toFixed(2)}
            </div>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-pink-500 to-orange-500 text-white shadow-lg shadow-violet-500/20">
            <Coins className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* STATS STRIP */}

      <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

        <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-700">
            <TrendingUp className="h-4 w-4" />

            <span>
              Today Solved
            </span>
          </div>

          <div className="mt-1 text-2xl font-black text-slate-900">
            {todaySolved}
          </div>
        </div>

        <div className="rounded-2xl border border-pink-100 bg-pink-50/70 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-pink-700">
            <ImageIcon className="h-4 w-4" />

            <span>
              Daily Limit
            </span>
          </div>

          <div className="mt-1 text-2xl font-black text-slate-900">
            {safeDailyLimit}
          </div>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-700">
            <Clock3 className="h-4 w-4" />

            <span>
              Daily Progress
            </span>
          </div>

          <div className="mt-1 text-2xl font-black text-slate-900">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* DAILY PROGRESS */}

      <div className="relative my-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">

        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold">

          <span className="text-slate-600">
            Daily Task Completion
          </span>

          <span className="font-bold text-violet-600">
            {todaySolved} / {safeDailyLimit} Solved
          </span>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>
      </div>

      {/* CAPTCHA AREA */}

      <form
        onSubmit={handleSubmit}
        className="relative space-y-6"
      >

        <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/70 via-white to-orange-50/70 p-5 sm:p-6">

          <div className="mb-4 flex items-center justify-center gap-2 text-center text-xs font-semibold text-slate-500">

            <ShieldCheck className="h-4 w-4 shrink-0 text-violet-600" />

            <span>
              Type the characters exactly as shown
            </span>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">

            <div className="relative flex min-h-[82px] min-w-[230px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">

              <div
                className="flex items-center justify-center"
                dangerouslySetInnerHTML={{
                  __html:
                    captchaSvg ||
                    '<div class="flex h-[75px] w-[220px] items-center justify-center text-xs text-slate-400">Loading CAPTCHA...</div>',
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={
                loading ||
                captchaLoading
              }
              title="Refresh CAPTCHA"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-200 bg-white text-violet-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-5 w-5 ${
                  captchaLoading
                    ? "animate-spin"
                    : ""
                }`}
              />
            </button>
          </div>

          {/* 10 SECOND COUNTDOWN */}

          <div className="mx-auto mt-5 max-w-xl">

            <div className="mb-2 flex items-center justify-between gap-3">

              <div
                className={`flex items-center gap-2 text-[11px] font-bold ${
                  isExpiringSoon
                    ? "text-red-600"
                    : "text-slate-500"
                }`}
              >
                <Clock3
                  className={`h-4 w-4 ${
                    isExpiringSoon
                      ? "animate-pulse"
                      : ""
                  }`}
                />

                <span>
                  CAPTCHA expires in
                </span>
              </div>

              <span
                className={`text-sm font-black ${
                  isExpiringSoon
                    ? "text-red-600"
                    : "text-violet-600"
                }`}
              >
                {captchaToken
                  ? `${timeLeft}s`
                  : "--"}
              </span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isExpiringSoon
                    ? "bg-gradient-to-r from-red-500 to-orange-500"
                    : "bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500"
                }`}
                style={{
                  width: `${
                    captchaToken
                      ? countdownPercent
                      : 0
                  }%`,
                }}
              />
            </div>

            <p className="mt-2 text-center text-[10px] text-slate-400">
              A new CAPTCHA will load automatically after 10 seconds.
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">

            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />

            <span>
              CAPTCHA is case-sensitive. Enter uppercase
              and lowercase characters exactly as shown.
            </span>
          </div>
        </div>

        {/* INPUT */}

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Enter Verification Code
          </label>

          <input
            type="text"
            value={userInput}
            onChange={(e) =>
              setUserInput(e.target.value)
            }
            placeholder="Type characters exactly as shown..."
            maxLength={10}
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={
              loading ||
              captchaLoading ||
              limitReached ||
              !captchaToken
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center font-mono text-lg tracking-[0.3em] text-slate-800 shadow-sm transition-all placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>

        {/* FEEDBACK */}

        {message.text && (
          <div
            className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            )}

            <span>
              {message.text}
            </span>
          </div>
        )}

        {/* SUBMIT */}

        <button
          type="submit"
          disabled={
            loading ||
            captchaLoading ||
            cooldown > 0 ||
            limitReached ||
            !captchaToken ||
            timeLeft <= 0
          }
          className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-500 to-orange-500 py-4 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
        >

          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />

              <span>
                Verifying Solution...
              </span>
            </>
          ) : captchaLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />

              <span>
                Loading CAPTCHA...
              </span>
            </>
          ) : cooldown > 0 ? (
            <>
              <Clock3 className="h-4 w-4" />

              <span>
                Please wait {cooldown}s...
              </span>
            </>
          ) : limitReached ? (
            <>
              <CheckCircle2 className="h-4 w-4" />

              <span>
                Daily Limit Reached — Come Back Tomorrow
              </span>
            </>
          ) : timeLeft <= 0 ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />

              <span>
                Loading New CAPTCHA...
              </span>
            </>
          ) : (
            <>
              <Coins className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />

              <span>
                Verify & Claim ₹
                {rewardRate.toFixed(2)}
              </span>
            </>
          )}
        </button>
      </form>

      {/* BOTTOM INFORMATION */}

      <div className="relative mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 text-xs sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-start gap-2 text-slate-500">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" />

          <span>
            Submit the CAPTCHA within the 10-second timer.
            Expired tasks are automatically replaced.
          </span>
        </div>

        <div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />

          <span>
            Instant Wallet Credit
          </span>
        </div>
      </div>
    </div>
  );
}