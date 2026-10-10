import crypto from "crypto";
import express from "express";
import mongoose from "mongoose";

import { authenticateToken } from "../middleware/auth.js";

import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
import { Transaction } from "../models/Transaction.js";
import { CaptchaAttempt } from "../models/CaptchaAttempt.js";
import { SiteContent } from "../models/SiteContent.js";

import {
  generateCaptcha,
  verifyCaptchaToken,
  normalizeCaptchaSettings,
} from "../utils/captchaGenerator.js";

const router = express.Router();

// =====================================================
// CAPTCHA SECURITY
// =====================================================

// Minimum realistic solve time.
// This is NOT CAPTCHA expiry.
const MIN_RESPONSE_TIME_MS = 700;

// =====================================================
// SAFE SERVER LIMITS
// =====================================================

const LIMITS = {
  expirySeconds: {
    min: 1,
    max: 3600,
  },

  submitCooldownSeconds: {
    min: 0,
    max: 3600,
  },

  dailyLimit: {
    min: 0,
    max: 100000,
  },

  rewardAmount: {
    min: 0,
    max: 100000,
  },

  maxAttempts: {
    min: 1,
    max: 100,
  },
};

// =====================================================
// DEFAULT SETTINGS
// =====================================================

const DEFAULT_CAPTCHA_SETTINGS = {
  enabled: true,

  captchaType: "mixed",

  length: 6,

  includeLowercase: true,
  includeUppercase: true,
  includeNumbers: true,
  includeSymbols: false,

  symbols: "@#$%^&*",

  caseSensitive: true,

  expirySeconds: 10,

  submitCooldownSeconds: 10,

  dailyLimit: 50,

  rewardAmount: 0.5,

  maxAttempts: 5,

  refreshAfterSuccess: true,

  refreshAfterWrongAnswer: true,

  image: {
    width: 320,
    height: 100,
    fontSize: 34,
    noiseLevel: 2,
    lineCount: 2,
    distortionLevel: 2,
    letterSpacing: 8,
    backgroundStyle: "light",
  },
};

// =====================================================
// HELPERS
// =====================================================

// -----------------------------------------------------
// SAFE NUMBER
// -----------------------------------------------------

const toNumber = (
  value,
  fallback = 0
) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

// -----------------------------------------------------
// CLAMP INTEGER
// -----------------------------------------------------

const clampInteger = (
  value,
  min,
  max,
  fallback
) => {
  const number =
    Math.floor(
      toNumber(
        value,
        fallback
      )
    );

  return Math.min(
    max,
    Math.max(
      min,
      number
    )
  );
};

// -----------------------------------------------------
// CLAMP MONEY
// -----------------------------------------------------

const normalizeRewardAmount = (
  value
) => {
  const amount =
    toNumber(
      value,
      DEFAULT_CAPTCHA_SETTINGS.rewardAmount
    );

  return Number(
    Math.min(
      LIMITS.rewardAmount.max,
      Math.max(
        LIMITS.rewardAmount.min,
        amount
      )
    ).toFixed(2)
  );
};

// -----------------------------------------------------
// NORMALIZE BOOLEAN
// -----------------------------------------------------

const normalizeBoolean = (
  value,
  fallback
) => {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  return fallback;
};

// -----------------------------------------------------
// TODAY DATE KEY
// -----------------------------------------------------
//
// Keep the current behavior based on the server's local
// date so existing wallet/day calculations remain
// backward-compatible.
// -----------------------------------------------------

const getTodayDateKey = () => {
  const date =
    new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// -----------------------------------------------------
// CAPTCHA ID
// -----------------------------------------------------
//
// Derived only from the encrypted token.
//
// This allows:
// - maxAttempts per CAPTCHA
// - replay protection
// - audit history
//
// The plaintext CAPTCHA answer is never used as ID.
// -----------------------------------------------------

const getCaptchaIdFromToken = (
  token
) => {
  return crypto
    .createHash("sha256")
    .update(String(token))
    .digest("hex");
};

// =====================================================
// GET CAPTCHA SETTINGS
// =====================================================
//
// New settings are preferred.
// Legacy fields are used as fallback.
// =====================================================

const getCaptchaSettings =
  async () => {
    try {
      const content =
        await SiteContent.findOne({
          key: "main",
        }).lean();

      const storedSettings =
        content?.settings || {};

      const normalized =
        normalizeCaptchaSettings({
          ...DEFAULT_CAPTCHA_SETTINGS,

          ...storedSettings,

          // ---------------------------------------------
          // Legacy length fallback
          // ---------------------------------------------

          length:
            storedSettings.length ??
            storedSettings.captchaLength ??
            DEFAULT_CAPTCHA_SETTINGS.length,
        });

      // -------------------------------------------------
      // ENABLED
      // -------------------------------------------------

      const enabled =
        normalizeBoolean(
          storedSettings.enabled,
          DEFAULT_CAPTCHA_SETTINGS.enabled
        );

      // -------------------------------------------------
      // REWARD
      // -------------------------------------------------

      const rewardAmount =
        normalizeRewardAmount(
          storedSettings.rewardAmount ??
            storedSettings.captchaReward ??
            DEFAULT_CAPTCHA_SETTINGS.rewardAmount
        );

      // -------------------------------------------------
      // DAILY LIMIT
      // -------------------------------------------------

      const dailyLimit =
        clampInteger(
          storedSettings.dailyLimit ??
            storedSettings.dailyCaptchaLimit,
          LIMITS.dailyLimit.min,
          LIMITS.dailyLimit.max,
          DEFAULT_CAPTCHA_SETTINGS.dailyLimit
        );

      // -------------------------------------------------
      // MAX ATTEMPTS
      // -------------------------------------------------

      const maxAttempts =
        clampInteger(
          storedSettings.maxAttempts,
          LIMITS.maxAttempts.min,
          LIMITS.maxAttempts.max,
          DEFAULT_CAPTCHA_SETTINGS.maxAttempts
        );

      // -------------------------------------------------
      // EXPIRY
      // -------------------------------------------------

      const expirySeconds =
        clampInteger(
          storedSettings.expirySeconds,
          LIMITS.expirySeconds.min,
          LIMITS.expirySeconds.max,
          DEFAULT_CAPTCHA_SETTINGS.expirySeconds
        );

      // -------------------------------------------------
      // COOLDOWN
      // -------------------------------------------------

      const submitCooldownSeconds =
        clampInteger(
          storedSettings.submitCooldownSeconds,
          LIMITS.submitCooldownSeconds.min,
          LIMITS.submitCooldownSeconds.max,
          DEFAULT_CAPTCHA_SETTINGS.submitCooldownSeconds
        );

      // -------------------------------------------------
      // REFRESH FLAGS
      // -------------------------------------------------

      const refreshAfterSuccess =
        normalizeBoolean(
          storedSettings.refreshAfterSuccess,
          DEFAULT_CAPTCHA_SETTINGS.refreshAfterSuccess
        );

      const refreshAfterWrongAnswer =
        normalizeBoolean(
          storedSettings.refreshAfterWrongAnswer,
          DEFAULT_CAPTCHA_SETTINGS.refreshAfterWrongAnswer
        );

      return {
        ...normalized,

        enabled,

        rewardAmount,

        dailyLimit,

        maxAttempts,

        expirySeconds,

        submitCooldownSeconds,

        refreshAfterSuccess,

        refreshAfterWrongAnswer,
      };
    } catch (error) {
      console.error(
        "❌ CAPTCHA SETTINGS ERROR:",
        error
      );

      return {
        ...DEFAULT_CAPTCHA_SETTINGS,
      };
    }
  };

// =====================================================
// GET USER FROM JWT
// =====================================================

const getUserFromRequest =
  async (req) => {
    try {
      const userId =
        req.user?.id ||
        req.user?._id ||
        req.user?.userId ||
        null;

      if (!userId) {
        return null;
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return null;
      }

      return User.findById(
        userId
      );
    } catch (error) {
      console.error(
        "❌ GET CAPTCHA USER ERROR:",
        error
      );

      return null;
    }
  };

// =====================================================
// CHECK ACTIVE CUSTOMER
// =====================================================

const checkActiveUser =
  async (
    req,
    res
  ) => {
    const user =
      await getUserFromRequest(
        req
      );

    if (!user) {
      res.status(401).json({
        success: false,
        message:
          "User not found.",
      });

      return null;
    }

    const role =
      String(
        user.role || "user"
      )
        .trim()
        .toLowerCase();

    if (
      role === "admin" ||
      role === "superadmin"
    ) {
      res.status(403).json({
        success: false,
        message:
          "Administrator accounts cannot use the customer CAPTCHA workstation.",
      });

      return null;
    }

    const status =
      String(
        user.status || ""
      )
        .trim()
        .toLowerCase();

    if (
      status !== "active"
    ) {
      res.status(403).json({
        success: false,
        message:
          "Your account is inactive.",
      });

      return null;
    }

    return user;
  };

/**
 * Require an active customer activated with a PAID PIN.
 * Keep the check on the backend to prevent direct API access.
 */
/**
 * Require an active customer activated with a PAID PIN.
 * This backend check prevents direct API access by UNPAID users.
 */
const checkPaidActiveUser = async (req, res) => {
  // First verify the account exists, is active, and is not an admin.
  const user = await checkActiveUser(req, res);

  if (!user) {
    return null;
  }

  const userType = String(user.userType || "")
    .trim()
    .toUpperCase();

  if (userType !== "PAID") {
    res.status(403).json({
      success: false,
      result: "paid_activation_required",
      message:
        "CAPTCHA work is available only to customers activated with a PAID PIN.",
    });

    return null;
  }

  return user;
};

// =====================================================
// CHECK CAPTCHA ENABLED
// =====================================================

const requireCaptchaEnabled =
  async (
    req,
    res
  ) => {
    const settings =
      await getCaptchaSettings();

    if (
      !settings.enabled
    ) {
      res.status(403).json({
        success: false,

        message:
          "CAPTCHA work is currently disabled by the administrator.",
      });

      return null;
    }

    return settings;
  };

// =====================================================
// GET LAST SUBMISSION
// =====================================================

const getLastSubmission =
  async (
    userId
  ) => {
    return CaptchaAttempt.findOne({
      userId,
    })
      .sort({
        submittedAt: -1,
        createdAt: -1,
      })
      .lean();
  };

// =====================================================
// GET DAILY SUCCESS COUNT
// =====================================================

const getTodaySuccessCount =
  async (
    userId
  ) => {
    return CaptchaAttempt.countDocuments({
      userId,

      attemptDate:
        getTodayDateKey(),

      result:
        "correct",

      status:
        "success",
    });
  };

// =====================================================
// GET CAPTCHA ATTEMPT COUNT
// =====================================================

const getCaptchaAttemptCount =
  async (
    userId,
    captchaId
  ) => {
    if (!captchaId) {
      return 0;
    }

    return CaptchaAttempt.countDocuments({
      userId,

      captchaId,
    });
  };

// =====================================================
// GET REMAINING ATTEMPTS
// =====================================================

const getRemainingAttempts = (
  attempts,
  maxAttempts
) => {
  return Math.max(
    0,
    maxAttempts - attempts
  );
};

// =====================================================
// GET /api/captcha/new
// =====================================================

router.get(
  "/new",
  authenticateToken,
  async (req, res) => {
    try {
      // -------------------------------------------------
      // USER
      // -------------------------------------------------

      const user = await checkPaidActiveUser(req, res);

      if (!user) {
        return;
      }

      // -------------------------------------------------
      // SETTINGS
      // -------------------------------------------------

      const settings =
        await requireCaptchaEnabled(
          req,
          res
        );

      if (!settings) {
        return;
      }

      // -------------------------------------------------
      // DAILY LIMIT
      // -------------------------------------------------

      const todaySolved =
        await getTodaySuccessCount(
          user._id
        );

      if (
        settings.dailyLimit <= 0 ||
        todaySolved >=
          settings.dailyLimit
      ) {
        return res.status(429).json({
          success: false,

          result:
            "limit",

          message:
            settings.dailyLimit <= 0
              ? "Daily CAPTCHA work is currently unavailable."
              : `Daily CAPTCHA limit of ${settings.dailyLimit} reached.`,

          todayCaptchasSolved:
            todaySolved,

          dailyCaptchaLimit:
            settings.dailyLimit,
        });
      }

      // -------------------------------------------------
      // GENERATE
      // -------------------------------------------------

      const captcha =
        generateCaptcha(
          settings
        );

      const captchaId =
        getCaptchaIdFromToken(
          captcha.token
        );

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------
      //
      // CAPTCHA answer is NOT returned.
      // -------------------------------------------------

      return res.status(200).json({
        success: true,

        svg:
          captcha.svg,

        token:
          captcha.token,

        captchaId,

        length:
          captcha.length,

        captchaType:
          captcha.captchaType,

        caseSensitive:
          settings.caseSensitive,

        expiresAt:
          captcha.expiresAt,

        expiresInSeconds:
          captcha.expiresInSeconds,

        submitCooldownSeconds:
          settings.submitCooldownSeconds,

        maxAttempts:
          settings.maxAttempts,

        dailyCaptchaLimit:
          settings.dailyLimit,

        todayCaptchasSolved:
          todaySolved,

        remainingToday:
          Math.max(
            0,
            settings.dailyLimit -
              todaySolved
          ),

        refreshAfterSuccess:
          settings.refreshAfterSuccess,

        refreshAfterWrongAnswer:
          settings.refreshAfterWrongAnswer,
      });
    } catch (error) {
      console.error(
        "❌ CAPTCHA GENERATION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to generate CAPTCHA.",
      });
    }
  }
);

// =====================================================
// POST /api/captcha/solve
// =====================================================

router.post(
  "/solve",
  authenticateToken,
  async (req, res) => {
    try {
      // -------------------------------------------------
      // USER
      // -------------------------------------------------

      const user =
        await checkActiveUser(
          req,
          res
        );

      if (!user) {
        return;
      }

      // -------------------------------------------------
      // CURRENT SERVER SETTINGS
      // -------------------------------------------------

      const settings =
        await requireCaptchaEnabled(
          req,
          res
        );

      if (!settings) {
        return;
      }

      // -------------------------------------------------
      // REQUEST
      // -------------------------------------------------

      const {
        token,
        answer,
      } =
        req.body || {};

      if (
        typeof token !==
          "string" ||
        !token.trim()
      ) {
        return res.status(400).json({
          success: false,

          counted: false,

          reason:
            "CAPTCHA token is required.",
        });
      }

      if (
        typeof answer !==
          "string" ||
        !answer.trim()
      ) {
        return res.status(400).json({
          success: false,

          counted: false,

          reason:
            "CAPTCHA answer is required.",
        });
      }

      const normalizedToken =
        token.trim();

      const submittedAnswer =
        answer.trim();

      // -------------------------------------------------
      // CAPTCHA ID
      // -------------------------------------------------

      const captchaId =
        getCaptchaIdFromToken(
          normalizedToken
        );

      // -------------------------------------------------
      // VERIFY ENCRYPTED TOKEN
      // -------------------------------------------------

      const verification =
        verifyCaptchaToken(
          normalizedToken
        );

      if (
        !verification ||
        !verification.valid
      ) {
        return res.status(400).json({
          success: false,

          counted: false,

          result:
            "expired",

          reason:
            verification?.reason ||
            "CAPTCHA has expired or is invalid.",
        });
      }

      // -------------------------------------------------
      // TOKEN TIMESTAMP
      // -------------------------------------------------

      const generatedAt =
        Number(
          verification.timestamp
        );

      if (
        !Number.isFinite(
          generatedAt
        ) ||
        generatedAt <= 0
      ) {
        return res.status(400).json({
          success: false,

          counted: false,

          result:
            "expired",

          reason:
            "CAPTCHA timestamp is invalid.",
        });
      }

      // -------------------------------------------------
      // RESPONSE TIME
      // -------------------------------------------------

      const responseTimeMs =
        Math.max(
          0,
          Date.now() -
            generatedAt
        );

      if (
        responseTimeMs <
        MIN_RESPONSE_TIME_MS
      ) {
        return res.status(400).json({
          success: false,

          counted: false,

          result:
            "too_fast",

          message:
            "CAPTCHA submitted too quickly. Please try again.",
        });
      }

      // =================================================
      // TOKEN-SNAPSHOT SETTINGS
      // =================================================
      //
      // Important:
      // The user is solving the CAPTCHA that was actually
      // generated and displayed.
      //
      // Therefore answer comparison must use the token's
      // caseSensitive value, not a newer admin setting.
      // =================================================

      const caseSensitive =
        verification.caseSensitive !==
        false;

      const actualSolution =
        String(
          verification.text || ""
        );

      if (
        !actualSolution
      ) {
        return res.status(400).json({
          success: false,

          counted: false,

          reason:
            "Invalid CAPTCHA data.",
        });
      }

      // -------------------------------------------------
      // MEMBER ID
      // -------------------------------------------------

      const memberId =
        user.memberId ||
        user.userCode ||
        "";

      if (!memberId) {
        console.error(
          "❌ CAPTCHA USER HAS NO MEMBER ID:",
          user._id
        );

        return res.status(500).json({
          success: false,

          counted: false,

          message:
            "User account is missing member ID.",
        });
      }

      // =================================================
      // COOLDOWN
      // =================================================

      const lastSubmission =
        await getLastSubmission(
          user._id
        );

      if (
        lastSubmission?.submittedAt
      ) {
        const lastSubmittedAt =
          new Date(
            lastSubmission.submittedAt
          ).getTime();

        if (
          Number.isFinite(
            lastSubmittedAt
          )
        ) {
          const elapsed =
            Date.now() -
            lastSubmittedAt;

          const cooldownMs =
            settings.submitCooldownSeconds *
            1000;

          if (
            cooldownMs > 0 &&
            elapsed <
              cooldownMs
          ) {
            const remainingSeconds =
              Math.ceil(
                (
                  cooldownMs -
                  elapsed
                ) / 1000
              );

            return res.status(429).json({
              success: false,

              counted: false,

              result:
                "cooldown",

              message:
                `Please wait ${remainingSeconds} second(s) before submitting again.`,

              cooldownSeconds:
                settings.submitCooldownSeconds,

              remainingCooldownSeconds:
                remainingSeconds,
            });
          }
        }
      }

      // =================================================
      // EXISTING ATTEMPTS FOR THIS CAPTCHA
      // =================================================

      const currentAttempts =
        await getCaptchaAttemptCount(
          user._id,
          captchaId
        );

      // =================================================
      // REPLAY PROTECTION
      // =================================================

      const alreadySolved =
        await CaptchaAttempt.exists({
          userId:
            user._id,

          captchaId,

          result:
            "correct",

          status:
            "success",
        });

      if (
        alreadySolved
      ) {
        return res.status(409).json({
          success: false,

          counted: false,

          result:
            "already_solved",

          message:
            "This CAPTCHA has already been solved. Please use a new CAPTCHA.",
        });
      }

      // =================================================
      // MAX ATTEMPTS
      // =================================================

      if (
        currentAttempts >=
        settings.maxAttempts
      ) {
        return res.status(429).json({
          success: false,

          counted: false,

          result:
            "max_attempts",

          message:
            `Maximum ${settings.maxAttempts} attempts reached for this CAPTCHA. Please refresh.`,

          maxAttempts:
            settings.maxAttempts,

          attemptsUsed:
            currentAttempts,

          attemptsRemaining:
            0,

          refreshAfterWrongAnswer:
            settings.refreshAfterWrongAnswer,
        });
      }

      // =================================================
      // DAILY LIMIT
      // =================================================

      const todayDate =
        getTodayDateKey();

      const todayCorrectCount =
        await getTodaySuccessCount(
          user._id
        );

      if (
        settings.dailyLimit <= 0 ||
        todayCorrectCount >=
          settings.dailyLimit
      ) {
        return res.status(429).json({
          success: false,

          counted: false,

          result:
            "limit",

          message:
            settings.dailyLimit <= 0
              ? "Daily CAPTCHA work is currently unavailable."
              : `Daily CAPTCHA limit of ${settings.dailyLimit} reached.`,

          todayCaptchasSolved:
            todayCorrectCount,

          dailyCaptchaLimit:
            settings.dailyLimit,
        });
      }

      // =================================================
      // ANSWER CHECK
      // =================================================

      const isCorrect =
        caseSensitive
          ? submittedAnswer ===
            actualSolution
          : submittedAnswer.toLowerCase() ===
            actualSolution.toLowerCase();

      // =================================================
      // WRONG ANSWER
      // =================================================

      if (!isCorrect) {
        const attemptsUsed =
          currentAttempts + 1;

        const attemptsRemaining =
          getRemainingAttempts(
            attemptsUsed,
            settings.maxAttempts
          );

        await CaptchaAttempt.create({
          userId:
            user._id,

          memberId,

          captchaId,

          captchaType:
            verification.captchaType ||
            settings.captchaType,

          result:
            "wrong",

          status:
            "failed",

          reward:
            0,

          responseTimeMs,

          attemptDate:
            todayDate,

          submittedAt:
            new Date(),

          captchaExpiresAt:
            verification.expiresAt
              ? new Date(
                  verification.expiresAt
                )
              : null,

          caseSensitive,

          ipAddress:
            req.ip || "",

          userAgent:
            req.get(
              "user-agent"
            ) || "",
        });

        return res.status(200).json({
          success: false,

          counted: true,

          result:
            "wrong",

          message:
            attemptsRemaining > 0
              ? "Incorrect CAPTCHA. Please try again."
              : `Incorrect CAPTCHA. Maximum ${settings.maxAttempts} attempts reached. Please refresh.`,

          attemptsUsed,

          attemptsRemaining,

          maxAttempts:
            settings.maxAttempts,

          refreshAfterWrongAnswer:
            settings.refreshAfterWrongAnswer,
        });
      }

      // =================================================
      // SUCCESS TRANSACTION
      // =================================================

      const session =
        await mongoose.startSession();

      let walletAfterSave =
        null;

      try {
        await session.withTransaction(
          async () => {
            // -------------------------------------------
            // DUPLICATE SUCCESS RECHECK
            // -------------------------------------------

            const duplicateSuccess =
              await CaptchaAttempt.exists({
                userId:
                  user._id,

                captchaId,

                result:
                  "correct",

                status:
                  "success",
              }).session(
                session
              );

            if (
              duplicateSuccess
            ) {
              throw new Error(
                "CAPTCHA_ALREADY_SOLVED"
              );
            }

            // -------------------------------------------
            // DAILY LIMIT RECHECK
            // -------------------------------------------

            const successfulToday =
              await CaptchaAttempt.countDocuments(
                {
                  userId:
                    user._id,

                  attemptDate:
                    todayDate,

                  result:
                    "correct",

                  status:
                    "success",
                }
              ).session(
                session
              );

            if (
              settings.dailyLimit <=
                0 ||
              successfulToday >=
                settings.dailyLimit
            ) {
              throw new Error(
                "DAILY_CAPTCHA_LIMIT_REACHED"
              );
            }

            // -------------------------------------------
            // FIND / CREATE WALLET
            // -------------------------------------------

            let wallet =
              await Wallet.findOne({
                userId:
                  user._id,
              }).session(
                session
              );

            if (!wallet) {
              wallet =
                new Wallet({
                  userId:
                    user._id,

                  memberId,

                  currentBalance:
                    0,

                  totalEarnings:
                    0,

                  captchaEarnings:
                    0,

                  referralCommissions:
                    0,

                  totalWithdrawn:
                    0,

                  todayCaptchasSolved:
                    0,

                  lastCaptchaDate:
                    new Date(),
                });
            }

            // -------------------------------------------
            // DAILY WALLET COUNTER RESET
            // -------------------------------------------

            const now =
              new Date();

            const lastCaptchaDate =
              wallet.lastCaptchaDate
                ? new Date(
                    wallet.lastCaptchaDate
                  )
                : null;

            let sameWalletDay =
              false;

            if (
              lastCaptchaDate &&
              !Number.isNaN(
                lastCaptchaDate.getTime()
              )
            ) {
              sameWalletDay =
                lastCaptchaDate.getFullYear() ===
                  now.getFullYear() &&
                lastCaptchaDate.getMonth() ===
                  now.getMonth() &&
                lastCaptchaDate.getDate() ===
                  now.getDate();
            }

            if (
              !sameWalletDay
            ) {
              wallet.todayCaptchasSolved =
                0;
            }

            // -------------------------------------------
            // NORMALIZE WALLET NUMBERS
            // -------------------------------------------

            wallet.currentBalance =
              toNumber(
                wallet.currentBalance,
                0
              );

            wallet.totalEarnings =
              toNumber(
                wallet.totalEarnings,
                0
              );

            wallet.captchaEarnings =
              toNumber(
                wallet.captchaEarnings,
                0
              );

            wallet.todayCaptchasSolved =
              toNumber(
                wallet.todayCaptchasSolved,
                0
              );

            // -------------------------------------------
            // WALLET DAILY LIMIT RECHECK
            // -------------------------------------------

            if (
              settings.dailyLimit <=
                0 ||
              wallet.todayCaptchasSolved >=
                settings.dailyLimit
            ) {
              throw new Error(
                "DAILY_CAPTCHA_LIMIT_REACHED"
              );
            }

            // -------------------------------------------
            // BALANCE BEFORE
            // -------------------------------------------

            const balanceBefore =
              Number(
                wallet.currentBalance.toFixed(
                  2
                )
              );

            // -------------------------------------------
            // REWARD
            // -------------------------------------------

            const rewardAmount =
              normalizeRewardAmount(
                settings.rewardAmount
              );

            wallet.todayCaptchasSolved +=
              1;

            wallet.currentBalance =
              Number(
                (
                  wallet.currentBalance +
                  rewardAmount
                ).toFixed(2)
              );

            wallet.totalEarnings =
              Number(
                (
                  wallet.totalEarnings +
                  rewardAmount
                ).toFixed(2)
              );

            wallet.captchaEarnings =
              Number(
                (
                  wallet.captchaEarnings +
                  rewardAmount
                ).toFixed(2)
              );

            wallet.lastCaptchaDate =
              now;

            wallet.memberId =
              memberId;

            // -------------------------------------------
            // SAVE WALLET
            // -------------------------------------------

            await wallet.save({
              session,
            });

            // -------------------------------------------
            // CAPTCHA SUCCESS ATTEMPT
            // -------------------------------------------

            await CaptchaAttempt.create(
              [
                {
                  userId:
                    user._id,

                  memberId,

                  captchaId,

                  captchaType:
                    verification.captchaType ||
                    settings.captchaType,

                  result:
                    "correct",

                  status:
                    "success",

                  reward:
                    rewardAmount,

                  responseTimeMs,

                  attemptDate:
                    todayDate,

                  submittedAt:
                    now,

                  captchaExpiresAt:
                    verification.expiresAt
                      ? new Date(
                          verification.expiresAt
                        )
                      : null,

                  caseSensitive,

                  ipAddress:
                    req.ip || "",

                  userAgent:
                    req.get(
                      "user-agent"
                    ) || "",
                },
              ],
              {
                session,
              }
            );

            // -------------------------------------------
            // WALLET TRANSACTION
            // -------------------------------------------

            await Transaction.create(
              [
                {
                  userId:
                    user._id,

                  memberId,

                  type:
                    "captcha_reward",

                  category:
                    "captcha",

                  amount:
                    rewardAmount,

                  grossAmount:
                    rewardAmount,

                  netAmount:
                    rewardAmount,

                  balanceBefore,

                  balanceAfter:
                    wallet.currentBalance,

                  status:
                    "completed",

                  description:
                    "CAPTCHA solved successfully",

                  reason:
                    `CAPTCHA reward for ${captchaId}`,

                  referenceKey:
                    `CAPTCHA_REWARD:${user._id}:${captchaId}`,

                  createdBy:
                    user._id,

                  timestamp:
                    now,
                },
              ],
              {
                session,
              }
            );

            walletAfterSave =
              wallet;
          }
        );
      } catch (error) {
        // ---------------------------------------------
        // DUPLICATE CAPTCHA
        // ---------------------------------------------

        if (
          error.message ===
          "CAPTCHA_ALREADY_SOLVED"
        ) {
          return res.status(409).json({
            success: false,

            counted: false,

            result:
              "already_solved",

            message:
              "This CAPTCHA has already been solved. Please use a new CAPTCHA.",
          });
        }

        // ---------------------------------------------
        // DAILY LIMIT
        // ---------------------------------------------

        if (
          error.message ===
          "DAILY_CAPTCHA_LIMIT_REACHED"
        ) {
          return res.status(429).json({
            success: false,

            counted: false,

            result:
              "limit",

            message:
              `Daily CAPTCHA limit of ${settings.dailyLimit} reached.`,

            todayCaptchasSolved:
              settings.dailyLimit,

            dailyCaptchaLimit:
              settings.dailyLimit,
          });
        }

        // ---------------------------------------------
        // UNIQUE REFERENCE KEY
        // ---------------------------------------------

        if (
          error?.code === 11000
        ) {
          return res.status(409).json({
            success: false,

            counted: false,

            result:
              "already_solved",

            message:
              "This CAPTCHA reward has already been processed.",
          });
        }

        throw error;
      } finally {
        await session.endSession();
      }

      // =================================================
      // SUCCESS RESPONSE
      // =================================================

      const rewardAmount =
        normalizeRewardAmount(
          settings.rewardAmount
        );

      const solvedToday =
        walletAfterSave
          ?.todayCaptchasSolved ??
        todayCorrectCount + 1;

      const remainingToday =
        Math.max(
          0,
          settings.dailyLimit -
            solvedToday
        );

      return res.status(200).json({
        success: true,

        counted: true,

        result:
          "correct",

        message:
          `CAPTCHA solved successfully. ₹${rewardAmount.toFixed(
            2
          )} added to your wallet.`,

        reward:
          rewardAmount,

        todayCaptchasSolved:
          solvedToday,

        dailyCaptchaLimit:
          settings.dailyLimit,

        remainingToday,

        currentBalance:
          walletAfterSave
            ?.currentBalance ??
          0,

        captchaEarnings:
          walletAfterSave
            ?.captchaEarnings ??
          0,

        responseTimeMs,

        // Use the CAPTCHA that was actually solved.
        captchaType:
          verification.captchaType,

        caseSensitive,

        refreshAfterSuccess:
          settings.refreshAfterSuccess,

        submitCooldownSeconds:
          settings.submitCooldownSeconds,
      });
    } catch (error) {
      console.error(
        "❌ CAPTCHA SOLVE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        counted: false,

        message:
          "Unable to process CAPTCHA.",
      });
    }
  }
);

// =====================================================
// GET /api/captcha/my-stats
// =====================================================

router.get(
  "/my-stats",
  authenticateToken,
  async (req, res) => {
    try {
      const user =
        await checkActiveUser(
          req,
          res
        );

      if (!user) {
        return;
      }

      const settings =
        await getCaptchaSettings();

      const todayDate =
        getTodayDateKey();

      const [
        total,
        correct,
        wrong,
        todayAttempts,
        todayCorrect,
        todayWrong,
        wallet,
      ] =
        await Promise.all([
          // ---------------------------------------------
          // TOTAL
          // ---------------------------------------------

          CaptchaAttempt.countDocuments({
            userId:
              user._id,
          }),

          // ---------------------------------------------
          // TOTAL CORRECT
          // ---------------------------------------------

          CaptchaAttempt.countDocuments({
            userId:
              user._id,

            result:
              "correct",

            status:
              "success",
          }),

          // ---------------------------------------------
          // TOTAL WRONG
          // ---------------------------------------------

          CaptchaAttempt.countDocuments({
            userId:
              user._id,

            result:
              "wrong",

            status:
              "failed",
          }),

          // ---------------------------------------------
          // TODAY ALL ATTEMPTS
          // ---------------------------------------------

          CaptchaAttempt.countDocuments({
            userId:
              user._id,

            attemptDate:
              todayDate,
          }),

          // ---------------------------------------------
          // TODAY CORRECT
          // ---------------------------------------------

          CaptchaAttempt.countDocuments({
            userId:
              user._id,

            attemptDate:
              todayDate,

            result:
              "correct",

            status:
              "success",
          }),

          // ---------------------------------------------
          // TODAY WRONG
          // ---------------------------------------------

          CaptchaAttempt.countDocuments({
            userId:
              user._id,

            attemptDate:
              todayDate,

            result:
              "wrong",

            status:
              "failed",
          }),

          // ---------------------------------------------
          // WALLET
          // ---------------------------------------------

          Wallet.findOne({
            userId:
              user._id,
          }).lean(),
        ]);

      // -------------------------------------------------
      // ACCURACY
      // -------------------------------------------------

      const accuracy =
        total > 0
          ? Number(
              (
                (correct /
                  total) *
                100
              ).toFixed(2)
            )
          : 0;

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.status(200).json({
        success: true,

        enabled:
          settings.enabled,

        settings: {
          captchaType:
            settings.captchaType,

          length:
            settings.length,

          caseSensitive:
            settings.caseSensitive,

          expirySeconds:
            settings.expirySeconds,

          submitCooldownSeconds:
            settings.submitCooldownSeconds,

          dailyLimit:
            settings.dailyLimit,

          rewardAmount:
            settings.rewardAmount,

          maxAttempts:
            settings.maxAttempts,

          refreshAfterSuccess:
            settings.refreshAfterSuccess,

          refreshAfterWrongAnswer:
            settings.refreshAfterWrongAnswer,
        },

        stats: {
          totalAttempts:
            total,

          correct,

          wrong,

          accuracy,

          todayAttempts,

          todayCorrect,

          todayWrong,

          todayLimit:
            settings.dailyLimit,

          remainingToday:
            Math.max(
              0,
              settings.dailyLimit -
                todayCorrect
            ),

          captchaReward:
            settings.rewardAmount,

          captchaEarnings:
            toNumber(
              wallet?.captchaEarnings,
              0
            ),

          currentBalance:
            toNumber(
              wallet?.currentBalance,
              0
            ),
        },
      });
    } catch (error) {
      console.error(
        "❌ MY CAPTCHA STATS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load CAPTCHA statistics.",
      });
    }
  }
);

// =====================================================
// EXPORT
// =====================================================

export default router;