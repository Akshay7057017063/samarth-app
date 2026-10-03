import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
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

// ============================================================
// CONFIG
// ============================================================

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

// ============================================================
// COMPONENT
// ============================================================

export default function CaptchaWorkstation() {
  const { token, updateWalletLocally } = useAuth();

  // ==========================================================
  // REFS
  // ==========================================================

  const taskAreaRef = useRef(null);
  const captchaAndInputRef = useRef(null);
  const inputRef = useRef(null);

  // Used to avoid too many scroll calculations
  const scrollFrameRef = useRef(null);

  // ==========================================================
  // STATES
  // ==========================================================

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

  const [inputFocused, setInputFocused] = useState(false);

  // ==========================================================
  // MOBILE KEYBOARD / VIEWPORT HANDLING
  // ==========================================================

  const scrollCaptchaAndInputIntoView = useCallback(
    (behavior = "auto") => {
      const wrapper = captchaAndInputRef.current;

      if (!wrapper || typeof window === "undefined") {
        return;
      }

      const visualViewport = window.visualViewport;

      const currentScrollY =
        window.scrollY ||
        document.documentElement.scrollTop ||
        0;

      const wrapperRect = wrapper.getBoundingClientRect();

      let visibleTop = 8;
      let visibleHeight = window.innerHeight;

      if (visualViewport) {
        visibleTop = Math.max(
          8,
          visualViewport.offsetTop + 8
        );

        visibleHeight = visualViewport.height;
      }

      const visibleBottom =
        visibleTop + visibleHeight - 8;

      const wrapperTop =
        currentScrollY + wrapperRect.top;

      const wrapperHeight = wrapperRect.height;

      if (
        wrapperRect.top < visibleTop ||
        wrapperRect.bottom > visibleBottom
      ) {
        let targetTop = wrapperTop - visibleTop;

        if (wrapperHeight < visibleHeight - 20) {
          targetTop =
            wrapperTop -
            visibleTop -
            Math.max(
              0,
              (visibleHeight - wrapperHeight) * 0.16
            );
        }

        const maxScroll = Math.max(
          0,
          document.documentElement.scrollHeight -
            window.innerHeight
        );

        targetTop = Math.max(
          0,
          Math.min(targetTop, maxScroll)
        );

        window.scrollTo({
          top: targetTop,
          behavior,
        });
      }

      // Extra safety: if input is still hidden behind keyboard
      requestAnimationFrame(() => {
        const input = inputRef.current;

        if (!input) {
          return;
        }

        const inputRect = input.getBoundingClientRect();

        const latestViewport = window.visualViewport;

        const latestTop = latestViewport
          ? latestViewport.offsetTop + 8
          : 8;

        const latestHeight = latestViewport
          ? latestViewport.height
          : window.innerHeight;

        const latestBottom =
          latestTop + latestHeight - 12;

        if (
          inputRect.bottom > latestBottom ||
          inputRect.top < latestTop
        ) {
          const inputAbsoluteTop =
            (window.scrollY || 0) + inputRect.top;

          const desiredScroll =
            inputAbsoluteTop -
            latestTop -
            Math.max(
              20,
              Math.min(100, latestHeight * 0.12)
            );

          const maxScroll = Math.max(
            0,
            document.documentElement.scrollHeight -
              window.innerHeight
          );

          window.scrollTo({
            top: Math.max(
              0,
              Math.min(desiredScroll, maxScroll)
            ),
            behavior,
          });
        }
      });
    },
    []
  );

  const scheduleMobileViewportAdjustment =
    useCallback(() => {
      if (typeof window === "undefined") {
        return;
      }

      if (window.innerWidth >= 640) {
        return;
      }

      if (!inputFocused) {
        return;
      }

      if (scrollFrameRef.current) {
        cancelAnimationFrame(scrollFrameRef.current);
      }

      scrollFrameRef.current = requestAnimationFrame(
        () => {
          scrollCaptchaAndInputIntoView("auto");
        }
      );
    }, [inputFocused, scrollCaptchaAndInputIntoView]);

  const handleInputFocus = () => {
    setInputFocused(true);

    setTimeout(() => {
      scrollCaptchaAndInputIntoView("auto");
    }, 80);

    setTimeout(() => {
      scrollCaptchaAndInputIntoView("auto");
    }, 250);

    setTimeout(() => {
      scrollCaptchaAndInputIntoView("auto");
    }, 450);

    setTimeout(() => {
      scrollCaptchaAndInputIntoView("auto");
    }, 700);
  };

  const handleInputBlur = () => {
    setInputFocused(false);
  };

  // ==========================================================
  // VISUAL VIEWPORT LISTENERS
  // ==========================================================

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const viewport = window.visualViewport;

    if (!viewport) {
      return;
    }

    const handleViewportChange = () => {
      scheduleMobileViewportAdjustment();
    };

    viewport.addEventListener(
      "resize",
      handleViewportChange
    );

    viewport.addEventListener(
      "scroll",
      handleViewportChange
    );

    window.addEventListener(
      "resize",
      handleViewportChange
    );

    return () => {
      viewport.removeEventListener(
        "resize",
        handleViewportChange
      );

      viewport.removeEventListener(
        "scroll",
        handleViewportChange
      );

      window.removeEventListener(
        "resize",
        handleViewportChange
      );

      if (scrollFrameRef.current) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, [scheduleMobileViewportAdjustment]);

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

      const res = await fetch(
        `${API_BASE_URL}/captcha/new`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const contentType =
        res.headers.get("content-type") || "";

      const data = contentType.includes(
        "application/json"
      )
        ? await res.json()
        : {};

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load CAPTCHA."
        );
      }

      setCaptchaSvg(data.svg || "");
      setCaptchaToken(data.token || "");

      setMessage({
        text: "",
        type: "",
      });
    } catch (error) {
      console.error("LOAD CAPTCHA ERROR:", error);

      setCaptchaSvg("");
      setCaptchaToken("");
      setUserInput("");

      setMessage({
        text:
          error?.message ||
          "Failed to load CAPTCHA. Check server connection.",
        type: "error",
      });
    } finally {
      setCaptchaLoading(false);
    }
  }, [token]);

  // ==========================================================
  // LOAD WALLET / PROGRESS
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
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const contentType =
        res.headers.get("content-type") || "";

      const data = contentType.includes(
        "application/json"
      )
        ? await res.json()
        : {};

      if (!res.ok || !data.success) {
        return;
      }

      if (data.wallet) {
        setTodaySolved(
          Number(data.wallet.todayCaptchasSolved || 0)
        );
      }

      if (data.settings) {
        setRewardRate(
          Number(data.settings.captchaReward ?? 0.5)
        );

        setDailyLimit(
          Number(data.settings.dailyCaptchaLimit ?? 50)
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
  }, [token, loadNewCaptcha, loadCaptchaProgress]);

  // ==========================================================
  // COOLDOWN TIMER (delay between submissions)
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
  // SUBMIT CAPTCHA
  // ==========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedInput = userInput.trim();

    if (!trimmedInput) {
      setMessage({
        text: "Please enter the characters shown in the image.",
        type: "error",
      });

      inputRef.current?.focus();
      return;
    }

    if (!captchaToken) {
      setMessage({
        text: "CAPTCHA is not ready. Please refresh and try again.",
        type: "error",
      });

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
        text: "Your daily CAPTCHA limit has been reached.",
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
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            token: captchaToken,
            answer: trimmedInput,
          }),
        }
      );

      const contentType =
        res.headers.get("content-type") || "";

      const data = contentType.includes(
        "application/json"
      )
        ? await res.json()
        : {};

      // ======================================================
      // SUCCESS
      // ======================================================

      if (data.success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });

        const solved = Number(
          data.todayCaptchasSolved ?? todaySolved + 1
        );

        const reward = Number(
          data.reward ?? rewardRate
        );

        setTodaySolved(solved);

        if (data.dailyCaptchaLimit !== undefined) {
          setDailyLimit(Number(data.dailyCaptchaLimit));
        }

        if (data.currentBalance !== undefined) {
          updateWalletLocally(
            Number(data.currentBalance),
            solved
          );
        } else {
          updateWalletLocally(undefined, solved);
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
        setCooldown(3);

        await loadNewCaptcha();
        return;
      }

      // ======================================================
      // DAILY LIMIT
      // ======================================================

      if (res.status === 429 || data.result === "limit") {
        setTodaySolved(
          Number(data.todayCaptchasSolved ?? dailyLimit)
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

        return;
      }

      // ======================================================
      // INVALID / EXPIRED / TAMPERED
      // ======================================================

      if (data.counted === false) {
        setMessage({
          text:
            data.message ||
            data.reason ||
            "This CAPTCHA is invalid. Please try a new one.",
          type: "error",
        });

        setUserInput("");

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

        await loadNewCaptcha();
        return;
      }

      // ======================================================
      // GENERIC ERROR
      // ======================================================

      setMessage({
        text:
          data.message ||
          data.reason ||
          "Unable to verify CAPTCHA.",
        type: "error",
      });

      setUserInput("");

      await loadNewCaptcha();
    } catch (error) {
      console.error("CAPTCHA SUBMIT ERROR:", error);

      setMessage({
        text: "Network error. Please check the server connection and try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // REFRESH
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

    setTimeout(() => {
      if (inputFocused) {
        scrollCaptchaAndInputIntoView("auto");
      }
    }, 100);
  };

  // ==========================================================
  // PROGRESS
  // ==========================================================

  const safeDailyLimit =
    dailyLimit > 0 ? dailyLimit : 50;

  const progressPercent = Math.min(
    100,
    Math.round((todaySolved / safeDailyLimit) * 100)
  );

  const limitReached = todaySolved >= safeDailyLimit;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="
        relative isolate flex w-full max-w-full flex-col
        overflow-visible rounded-3xl border border-slate-200/80
        bg-white/90 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)]
        backdrop-blur-xl sm:p-8
      "
    >
      {/* AMBIENT BACKGROUND */}

      <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl" />

      <div className="pointer-events-none absolute -right-20 top-20 h-56 w-56 rounded-full bg-pink-400/10 blur-3xl" />

      <div className="pointer-events-none absolute bottom-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-orange-400/10 blur-3xl" />

      {/* HEADER */}

      <div
        className="
          relative order-2 mt-5 border-t
          border-slate-200/80 pt-5
          sm:order-1 sm:mt-0 sm:border-t-0
          sm:border-b sm:pt-0 sm:pb-6
        "
      >
        <div className="sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div className="min-w-0">
            <div
              className="
                mb-2 inline-flex max-w-full items-center
                gap-2 rounded-full border border-violet-200
                bg-gradient-to-r from-violet-50 via-pink-50 to-orange-50
                px-3 py-1.5 text-[9px] font-bold uppercase
                tracking-[0.12em] text-violet-700 sm:text-[11px]
              "
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-pink-500" />

              <span className="truncate">
                Digital Micro-Task Workstation
              </span>
            </div>

            <h2
              className="
                text-lg font-black leading-tight
                tracking-tight text-slate-900 sm:text-2xl
              "
            >
              Solve & Earn{" "}
              <span
                className="
                  bg-gradient-to-r from-violet-600
                  via-pink-500 to-orange-500
                  bg-clip-text text-transparent
                "
              >
                Instant Rewards
              </span>
            </h2>

            <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:text-sm">
              Complete valid CAPTCHA tasks and receive
              wallet rewards instantly.
            </p>
          </div>

          <div
            className="
              mt-3 flex w-full items-center justify-between
              rounded-2xl border border-violet-100
              bg-gradient-to-br from-violet-50 via-white to-orange-50
              px-4 py-2.5 shadow-sm
              sm:mt-0 sm:w-auto sm:shrink-0
              sm:px-4 sm:py-3
            "
          >
            <div>
              <div
                className="
                  text-[9px] font-bold uppercase
                  tracking-wide text-slate-500 sm:text-[10px]
                "
              >
                Reward Per Task
              </div>

              <div
                className="
                  mt-0.5 bg-gradient-to-r from-violet-600
                  via-pink-500 to-orange-500 bg-clip-text
                  text-base font-black text-transparent sm:text-lg
                "
              >
                ₹{rewardRate.toFixed(2)}
              </div>
            </div>

            <div
              className="
                ml-4 flex h-9 w-9 shrink-0 items-center
                justify-center rounded-xl
                bg-gradient-to-br from-violet-600
                via-pink-500 to-orange-500 text-white
                shadow-lg shadow-violet-500/20
                sm:h-10 sm:w-10
              "
            >
              <Coins className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TASK AREA */}

      <form
        ref={taskAreaRef}
        onSubmit={handleSubmit}
        className="relative order-1 z-10 w-full"
      >
        {/* CAPTCHA + INPUT MOBILE TASK WRAPPER */}

        <div
          ref={captchaAndInputRef}
          className="w-full scroll-mt-2"
        >
          {/* CAPTCHA BOX */}

          <div
            className="
              relative rounded-2xl border border-violet-100
              bg-gradient-to-br from-violet-50/70 via-white to-orange-50/70
              p-2 sm:rounded-3xl sm:p-6
            "
          >
            <div
              className="
                mb-1.5 flex items-center justify-center
                gap-2 text-center text-[10px] font-semibold
                text-slate-500 sm:mb-4 sm:text-xs
              "
            >
              <ShieldCheck className="h-4 w-4 shrink-0 text-violet-600" />

              <span>Type the characters shown</span>
            </div>

            {/* CAPTCHA IMAGE */}

            <div
              className="
                relative mx-auto flex min-h-[64px]
                w-full max-w-[290px] items-center
                justify-center overflow-hidden rounded-2xl
                border border-slate-200 bg-white p-1.5
                shadow-sm sm:min-h-[90px]
                sm:max-w-[360px] sm:p-2
              "
            >
              <div
                className="
                  flex min-w-0 max-w-full
                  items-center justify-center
                  [&>svg]:block
                  [&>svg]:h-auto
                  [&>svg]:max-h-[58px]
                  [&>svg]:max-w-full
                  [&>svg]:w-auto
                  sm:[&>svg]:max-h-[82px]
                "
                dangerouslySetInnerHTML={{
                  __html:
                    captchaSvg ||
                    '<div class="flex min-h-[50px] w-full items-center justify-center text-center text-xs text-slate-400">Loading CAPTCHA...</div>',
                }}
              />

              {/* REFRESH BUTTON */}

              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading || captchaLoading}
                title="Refresh CAPTCHA"
                aria-label="Refresh CAPTCHA"
                className="
                  absolute right-1.5 top-1.5
                  flex h-7 w-7 items-center justify-center
                  rounded-lg border border-violet-200
                  bg-white/95 text-violet-600 shadow-md
                  backdrop-blur transition-all
                  hover:bg-violet-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  sm:right-2 sm:top-2
                  sm:h-10 sm:w-10 sm:rounded-xl
                "
              >
                <RefreshCw
                  className={`
                    h-3.5 w-3.5 sm:h-5 sm:w-5
                    ${captchaLoading ? "animate-spin" : ""}
                  `}
                />
              </button>
            </div>
          </div>

          {/* INPUT BOX */}

          <div className="mt-2 sm:mt-4">
            <label
              htmlFor="captcha-answer"
              className="
                mb-1 block text-xs font-bold
                text-slate-700 sm:text-sm
              "
            >
              Enter Verification Code
            </label>

            <input
              ref={inputRef}
              id="captcha-answer"
              type="text"
              value={userInput}
              onChange={(e) =>
                setUserInput(e.target.value)
              }
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Enter CAPTCHA"
              maxLength={10}
              inputMode="text"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              disabled={
                loading ||
                captchaLoading ||
                limitReached ||
                !captchaToken
              }
              className="
                block w-full min-h-[48px]
                rounded-2xl border border-slate-200
                bg-white px-3 py-2
                text-center font-mono text-base
                font-bold tracking-[0.2em]
                text-slate-800 shadow-sm outline-none
                transition-all
                placeholder:font-sans
                placeholder:text-sm
                placeholder:font-normal
                placeholder:tracking-normal
                placeholder:text-slate-400
                focus:border-violet-400
                focus:ring-4
                focus:ring-violet-500/10
                disabled:cursor-not-allowed
                disabled:bg-slate-50
                sm:min-h-[54px]
                sm:px-4
                sm:py-3.5
                sm:text-lg
                sm:tracking-[0.3em]
              "
            />
          </div>
        </div>

        {/* FEEDBACK */}

        {message.text && (
          <div
            className={`
              mt-2 flex items-start gap-2
              rounded-2xl border p-2.5
              text-xs leading-4
              sm:mt-4 sm:gap-3
              sm:p-4 sm:text-sm sm:leading-5
              ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }
            `}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 sm:h-5 sm:w-5" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 sm:h-5 sm:w-5" />
            )}

            <span>{message.text}</span>
          </div>
        )}

        {/* SUBMIT BUTTON */}

        <button
          type="submit"
          disabled={
            loading ||
            captchaLoading ||
            cooldown > 0 ||
            limitReached ||
            !captchaToken
          }
          className="
            mt-2.5 flex min-h-[48px]
            w-full items-center justify-center
            gap-2 rounded-2xl
            bg-gradient-to-r from-violet-600
            via-pink-500 to-orange-500
            px-4 py-3 text-sm font-black
            text-white shadow-lg
            shadow-violet-500/20
            transition-all duration-300
            active:scale-[0.99]
            disabled:cursor-not-allowed
            disabled:opacity-50
            sm:mt-4 sm:min-h-[54px]
            sm:py-4
          "
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Verifying Solution...</span>
            </>
          ) : captchaLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading CAPTCHA...</span>
            </>
          ) : cooldown > 0 ? (
            <>
              <Clock3 className="h-4 w-4" />
              <span>Please wait {cooldown}s...</span>
            </>
          ) : limitReached ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Daily Limit Reached</span>
            </>
          ) : (
            <>
              <Coins className="h-4 w-4" />
              <span>
                Verify & Claim ₹{rewardRate.toFixed(2)}
              </span>
            </>
          )}
        </button>

        {/* MOBILE HELPER */}

        <p
          className="
            mt-2 text-center
            text-[9px] leading-4
            text-slate-400 sm:hidden
          "
        >
          Enter the CAPTCHA and tap Done on
          your keyboard or press Verify & Claim.
        </p>
      </form>

      {/* DAILY STATS */}

      <div
        className="
          relative order-3 mt-4
          grid grid-cols-3 gap-2
          sm:mt-6 sm:gap-3
        "
      >
        <div
          className="
            min-w-0 rounded-2xl
            border border-violet-100
            bg-violet-50/70 p-3 sm:p-4
          "
        >
          <div
            className="
              flex items-center gap-1.5
              text-[9px] font-semibold
              text-violet-700 sm:gap-2
              sm:text-xs
            "
          >
            <TrendingUp className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />

            <span className="truncate">Today</span>
          </div>

          <div className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
            {todaySolved}
          </div>
        </div>

        <div
          className="
            min-w-0 rounded-2xl
            border border-pink-100
            bg-pink-50/70 p-3 sm:p-4
          "
        >
          <div
            className="
              flex items-center gap-1.5
              text-[9px] font-semibold
              text-pink-700 sm:gap-2
              sm:text-xs
            "
          >
            <ImageIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />

            <span className="truncate">Limit</span>
          </div>

          <div className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
            {safeDailyLimit}
          </div>
        </div>

        <div
          className="
            min-w-0 rounded-2xl
            border border-orange-100
            bg-orange-50/70 p-3 sm:p-4
          "
        >
          <div
            className="
              flex items-center gap-1.5
              text-[9px] font-semibold
              text-orange-700 sm:gap-2
              sm:text-xs
            "
          >
            <Clock3 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />

            <span className="truncate">Progress</span>
          </div>

          <div className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* DAILY PROGRESS */}

      <div
        className="
          relative order-4 mt-3
          rounded-2xl border border-slate-200
          bg-slate-50/80 p-3.5
          sm:mt-4 sm:p-4
        "
      >
        <div
          className="
            mb-2 flex items-center
            justify-between gap-3
            text-[10px] font-semibold
            sm:text-xs
          "
        >
          <span className="text-slate-600">
            Daily Task Completion
          </span>

          <span className="shrink-0 font-bold text-violet-600">
            {todaySolved} / {safeDailyLimit}
          </span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 sm:h-3">
          <div
            className="
              h-full rounded-full
              bg-gradient-to-r from-violet-600
              via-pink-500 to-orange-500
              transition-all duration-500
            "
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>
      </div>

      {/* INFO */}

      <div
        className="
          relative order-5 mt-4
          flex flex-col gap-3
          border-t border-slate-200
          pt-4 text-[10px]
          sm:mt-6 sm:flex-row
          sm:items-center sm:justify-between
          sm:pt-5 sm:text-xs
        "
      >
        <div className="flex items-start gap-2 text-slate-500">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" />

          <span className="leading-5">
            Type the characters shown in the image and
            submit. Tap refresh anytime to get a new
            CAPTCHA.
          </span>
        </div>

        <div
          className="
            flex w-fit items-center gap-2
            whitespace-nowrap rounded-full
            border border-emerald-200
            bg-emerald-50 px-3 py-1.5
            font-bold text-emerald-700
          "
        >
          <CheckCircle2 className="h-3.5 w-3.5" />

          <span>Instant Wallet Credit</span>
        </div>
      </div>
    </div>
  );
}