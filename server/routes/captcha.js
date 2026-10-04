
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
} from "../utils/captchaGenerator.js";

const router = express.Router();

// =====================================================
// CAPTCHA SECURITY SETTINGS
// =====================================================

// IMPORTANT:
// 10-second solve-time expiry has been REMOVED.
//
// CAPTCHA token validity is controlled by
// captchaGenerator.js, which currently has a
// 5-minute token expiry.

// Minimum realistic response time.
const MIN_RESPONSE_TIME_MS = 700;


// =====================================================
// HELPERS
// =====================================================

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};


// -----------------------------------------------------
// GET CAPTCHA SETTINGS FROM MONGODB
// -----------------------------------------------------

const getCaptchaSettings = async () => {
  try {
    const content =
      await SiteContent.findOne({
        key: "main",
      }).lean();

    const settings =
      content?.settings || {};

    const captchaLength = Math.min(
      10,
      Math.max(
        4,
        Math.floor(
          toNumber(
            settings.captchaLength,
            6
          )
        )
      )
    );

    const captchaReward = Math.max(
      0,
      toNumber(
        settings.captchaReward,
        0.5
      )
    );

    const dailyCaptchaLimit =
      Math.max(
        1,
        Math.floor(
          toNumber(
            settings.dailyCaptchaLimit,
            50
          )
        )
      );

    return {
      captchaLength,
      captchaReward,
      dailyCaptchaLimit,
    };
  } catch (error) {
    console.error(
      "❌ CAPTCHA SETTINGS ERROR:",
      error.message
    );

    return {
      captchaLength: 6,
      captchaReward: 0.5,
      dailyCaptchaLimit: 50,
    };
  }
};


// -----------------------------------------------------
// GET TODAY DATE KEY
// -----------------------------------------------------

const getTodayDateKey = () => {
  const date = new Date();

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


// -----------------------------------------------------
// GET USER FROM JWT
// -----------------------------------------------------

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

      return User.findById(userId);
    } catch (error) {
      console.error(
        "❌ GET CAPTCHA USER ERROR:",
        error.message
      );

      return null;
    }
  };


// -----------------------------------------------------
// CHECK ACTIVE USER
// -----------------------------------------------------

const checkActiveUser =
  async (req, res) => {
    const user =
      await getUserFromRequest(
        req
      );

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found.",
      });

      return null;
    }

    if (
      user.status &&
      String(user.status).toLowerCase() !==
        "active"
    ) {
      res.status(403).json({
        success: false,
        message:
          "Your account is inactive.",
      });

      return null;
    }

    // Customer route only.
    const role = String(
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

    return user;
  };


// =====================================================
// GET /api/captcha/new
// =====================================================
//
// Generate a new CAPTCHA.
// =====================================================

router.get(
  "/new",
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

      const {
        captchaLength,
      } = await getCaptchaSettings();

      const captcha =
        generateCaptcha(
          captchaLength
        );

      return res.status(200).json({
        success: true,

        svg: captcha.svg,

        token: captcha.token,

        length: captcha.length,
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
//
// Verify and process CAPTCHA.
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
      // REQUEST DATA
      // -------------------------------------------------

      const {
        token,
        answer,
      } = req.body || {};


      if (!token) {
        return res.status(400).json({
          success: false,
          counted: false,
          reason:
            "CAPTCHA token is required.",
        });
      }


      if (
        typeof answer !== "string" ||
        answer.trim().length === 0
      ) {
        return res.status(400).json({
          success: false,
          counted: false,
          reason:
            "CAPTCHA answer is required.",
        });
      }


      // -------------------------------------------------
      // VERIFY SIGNED CAPTCHA TOKEN
      // -------------------------------------------------

      const verification =
        verifyCaptchaToken(token);


      if (
        !verification ||
        !verification.valid
      ) {
        return res.status(400).json({
          success: false,
          counted: false,
          result: "expired",
          reason:
            verification?.reason ||
            "CAPTCHA has expired or is invalid.",
        });
      }


      // -------------------------------------------------
      // CAPTCHA TIMESTAMP
      // -------------------------------------------------
      //
      // Timestamp is used only to calculate the
      // response time for logging / anti-bot purposes.
      //
      // IMPORTANT:
      // There is NO 10-second expiry check.
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
          result: "expired",
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


      // -------------------------------------------------
      // IMPORTANT
      // -------------------------------------------------
      //
      // 10-second expiry has been REMOVED.
      //
      // The CAPTCHA can now be solved at any time
      // while the signed token is valid.
      //
      // captchaGenerator.js controls the actual
      // token expiry (currently 5 minutes).
      // -------------------------------------------------


      // -------------------------------------------------
      // SUSPICIOUSLY FAST SUBMISSION
      // -------------------------------------------------

      if (
        responseTimeMs <
        MIN_RESPONSE_TIME_MS
      ) {
        return res.status(400).json({
          success: false,
          counted: false,

          message:
            "CAPTCHA submitted too quickly. Please try again.",
        });
      }


      // -------------------------------------------------
      // ACTUAL CAPTCHA ANSWER
      // -------------------------------------------------

      const actualSolution =
        verification.text ||
        verification.answer ||
        verification.captchaText;


      if (
        typeof actualSolution !==
          "string" ||
        actualSolution.length === 0
      ) {
        return res.status(400).json({
          success: false,
          counted: false,
          reason:
            "Invalid CAPTCHA data.",
        });
      }


      // -------------------------------------------------
      // EXACT CASE-SENSITIVE COMPARISON
      // -------------------------------------------------

      const submittedAnswer =
        answer.trim();

      const isCorrect =
        submittedAnswer ===
        actualSolution;


      // -------------------------------------------------
      // SETTINGS
      // -------------------------------------------------

      const {
        captchaReward,
        dailyCaptchaLimit,
      } =
        await getCaptchaSettings();


      const memberId =
        user.memberId ||
        user.userCode;


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
      // WRONG CAPTCHA
      // =================================================

      if (!isCorrect) {
        await CaptchaAttempt.create({
          userId:
            user._id,

          memberId,

          result:
            "wrong",

          status:
            "failed",

          reward: 0,

          responseTimeMs,

          attemptDate:
            getTodayDateKey(),

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
            "Incorrect CAPTCHA. Please try again.",
        });
      }


      // =================================================
      // DAILY SUCCESS LIMIT
      // =================================================

      const todayDate =
        getTodayDateKey();


      const todayCorrectCount =
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
        );


      if (
        todayCorrectCount >=
        dailyCaptchaLimit
      ) {
        return res.status(429).json({
          success: false,

          counted: false,

          result: "limit",

          message:
            `Daily CAPTCHA limit of ${dailyCaptchaLimit} reached.`,

          todayCaptchasSolved:
            todayCorrectCount,

          dailyCaptchaLimit,
        });
      }


      // =================================================
      // MONGODB TRANSACTION
      // =================================================

      const session =
        await mongoose.startSession();

      let walletAfterSave;


      try {
        await session.withTransaction(
          async () => {

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
                    new Date().toISOString(),
                });
            }


            // -------------------------------------------
            // RESET DAILY WALLET COUNTER
            // -------------------------------------------

            const lastCaptchaDate =
              wallet.lastCaptchaDate;


            if (
              lastCaptchaDate
            ) {
              const lastDate =
                new Date(
                  lastCaptchaDate
                );


              if (
                !Number.isNaN(
                  lastDate.getTime()
                )
              ) {
                const lastYear =
                  lastDate.getFullYear();

                const lastMonth =
                  lastDate.getMonth();

                const lastDay =
                  lastDate.getDate();

                const now =
                  new Date();


                const sameDay =
                  lastYear ===
                    now.getFullYear() &&
                  lastMonth ===
                    now.getMonth() &&
                  lastDay ===
                    now.getDate();


                if (!sameDay) {
                  wallet.todayCaptchasSolved = 0;
                }
              }
            }


            // -------------------------------------------
            // NORMALIZE WALLET
            // -------------------------------------------

            wallet.currentBalance =
              toNumber(
                wallet.currentBalance
              );


            wallet.totalEarnings =
              toNumber(
                wallet.totalEarnings
              );


            wallet.captchaEarnings =
              toNumber(
                wallet.captchaEarnings
              );


            wallet.todayCaptchasSolved =
              toNumber(
                wallet.todayCaptchasSolved
              );


            // -------------------------------------------
            // SECOND DAILY LIMIT CHECK
            // -------------------------------------------

            if (
              wallet.todayCaptchasSolved >=
              dailyCaptchaLimit
            ) {
              throw new Error(
                "DAILY_CAPTCHA_LIMIT_REACHED"
              );
            }


            // -------------------------------------------
            // ADD CAPTCHA REWARD
            // -------------------------------------------

            wallet.todayCaptchasSolved +=
              1;


            wallet.currentBalance =
              Number(
                (
                  wallet.currentBalance +
                  captchaReward
                ).toFixed(2)
              );


            wallet.totalEarnings =
              Number(
                (
                  wallet.totalEarnings +
                  captchaReward
                ).toFixed(2)
              );


            wallet.captchaEarnings =
              Number(
                (
                  wallet.captchaEarnings +
                  captchaReward
                ).toFixed(2)
              );


            wallet.lastCaptchaDate =
              new Date().toISOString();


            wallet.memberId =
              memberId;


            // -------------------------------------------
            // SAVE WALLET
            // -------------------------------------------

            await wallet.save({
              session,
            });


            // -------------------------------------------
            // CREATE CAPTCHA ATTEMPT
            // -------------------------------------------

            await CaptchaAttempt.create(
              [
                {
                  userId:
                    user._id,

                  memberId,

                  result:
                    "correct",

                  status:
                    "success",

                  reward:
                    captchaReward,

                  responseTimeMs,

                  attemptDate:
                    todayDate,

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
            // CREATE WALLET TRANSACTION
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
                    captchaReward,

                  grossAmount:
                    captchaReward,

                  netAmount:
                    captchaReward,

                  balanceAfter:
                    wallet.currentBalance,

                  status:
                    "completed",

                  description:
                    "CAPTCHA solved successfully",

                  createdBy:
                    user._id,

                  timestamp:
                    new Date(),
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

        if (
          error.message ===
          "DAILY_CAPTCHA_LIMIT_REACHED"
        ) {
          return res.status(429).json({
            success: false,

            counted: false,

            result: "limit",

            message:
              `Daily CAPTCHA limit of ${dailyCaptchaLimit} reached.`,

            todayCaptchasSolved:
              dailyCaptchaLimit,

            dailyCaptchaLimit,
          });
        }

        throw error;

      } finally {
        await session.endSession();
      }


      // =================================================
      // SUCCESS RESPONSE
      // =================================================

      return res.status(200).json({
        success: true,

        counted: true,

        result:
          "correct",

        message:
          "CAPTCHA solved successfully.",

        reward:
          captchaReward,

        todayCaptchasSolved:
          walletAfterSave
            ?.todayCaptchasSolved ??
          todayCorrectCount + 1,

        dailyCaptchaLimit,

        currentBalance:
          walletAfterSave
            ?.currentBalance ??
          0,

        captchaEarnings:
          walletAfterSave
            ?.captchaEarnings ??
          0,

        responseTimeMs,
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
      // SETTINGS
      // -------------------------------------------------

      const {
        captchaReward,
        dailyCaptchaLimit,
      } =
        await getCaptchaSettings();


      // -------------------------------------------------
      // TODAY
      // -------------------------------------------------

      const todayDate =
        getTodayDateKey();


      // -------------------------------------------------
      // TOTAL ATTEMPTS
      // -------------------------------------------------

      const total =
        await CaptchaAttempt.countDocuments(
          {
            userId:
              user._id,
          }
        );


      // -------------------------------------------------
      // CORRECT
      // -------------------------------------------------

      const correct =
        await CaptchaAttempt.countDocuments(
          {
            userId:
              user._id,

            result:
              "correct",

            status:
              "success",
          }
        );


      // -------------------------------------------------
      // WRONG
      // -------------------------------------------------

      const wrong =
        await CaptchaAttempt.countDocuments(
          {
            userId:
              user._id,

            result:
              "wrong",

            status:
              "failed",
          }
        );


      // -------------------------------------------------
      // TODAY CORRECT
      // -------------------------------------------------

      const todayCorrect =
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
        );


      // -------------------------------------------------
      // TODAY WRONG
      // -------------------------------------------------

      const todayWrong =
        await CaptchaAttempt.countDocuments(
          {
            userId:
              user._id,

            attemptDate:
              todayDate,

            result:
              "wrong",

            status:
              "failed",
          }
        );


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
      // WALLET
      // -------------------------------------------------

      const wallet =
        await Wallet.findOne({
          userId:
            user._id,
        }).lean();


      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.status(200).json({
        success: true,

        stats: {
          totalAttempts:
            total,

          correct,

          wrong,

          accuracy,

          todayAttempts:
            todayCorrect +
            todayWrong,

          todayCorrect,

          todayWrong,

          todayLimit:
            dailyCaptchaLimit,

          remainingToday:
            Math.max(
              0,
              dailyCaptchaLimit -
                todayCorrect
            ),

          captchaReward,

          captchaEarnings:
            toNumber(
              wallet?.captchaEarnings
            ),

          currentBalance:
            toNumber(
              wallet?.currentBalance
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


export default router;

