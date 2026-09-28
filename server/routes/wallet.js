
import express from "express";
import mongoose from "mongoose";

import { authenticateToken } from "../middleware/auth.js";

import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
import { Transaction } from "../models/Transaction.js";
import { SiteContent } from "../models/SiteContent.js";

const router = express.Router();

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
// GET SETTINGS
// -----------------------------------------------------

const getWalletSettings = async () => {
  try {
    const content =
      await SiteContent.findOne({
        key: "main",
      }).lean();

    const settings =
      content?.settings || {};

    return {
      tdsRateWithPan: Math.max(
        0,
        toNumber(
          settings.tdsRateWithPan,
          5
        )
      ),

      tdsRateNoPan: Math.max(
        0,
        toNumber(
          settings.tdsRateNoPan,
          20
        )
      ),

      adminFeeRate: Math.max(
        0,
        toNumber(
          settings.adminFeeRate,
          5
        )
      ),

      minWithdrawalAmount:
        Math.max(
          0,
          toNumber(
            settings.minWithdrawalAmount,
            200
          )
        ),
    };
  } catch (error) {
    console.error(
      "❌ WALLET SETTINGS ERROR:",
      error.message
    );

    return {
      tdsRateWithPan: 5,
      tdsRateNoPan: 20,
      adminFeeRate: 5,
      minWithdrawalAmount: 200,
    };
  }
};

// -----------------------------------------------------
// GET AUTHENTICATED USER
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

      return User.findById(userId).select(
        "-password"
      );
    } catch (error) {
      console.error(
        "❌ WALLET USER ERROR:",
        error.message
      );

      return null;
    }
  };

// =====================================================
// GET /api/wallet/summary
// =====================================================

router.get(
  "/summary",
  authenticateToken,
  async (req, res) => {
    try {
      // -------------------------------------------------
      // USER
      // -------------------------------------------------

      const user =
        await getUserFromRequest(req);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (
        user.status &&
        user.status !== "active"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account is inactive.",
        });
      }

      // -------------------------------------------------
      // MEMBER ID
      // -------------------------------------------------

      const memberId =
        user.memberId ||
        user.userCode;

      if (!memberId) {
        return res.status(500).json({
          success: false,
          message:
            "User account is missing member ID.",
        });
      }

      // -------------------------------------------------
      // FIND WALLET
      // -------------------------------------------------

      let wallet =
        await Wallet.findOne({
          userId: user._id,
        });

      // -------------------------------------------------
      // CREATE WALLET IF MISSING
      // -------------------------------------------------

      if (!wallet) {
        wallet =
          await Wallet.create({
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

      // -------------------------------------------------
      // SETTINGS
      // -------------------------------------------------

      const settings =
        await getWalletSettings();

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.status(200).json({
        success: true,

        wallet,

        user,

        settings,
      });
    } catch (error) {
      console.error(
        "❌ WALLET SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch wallet.",
      });
    }
  }
);

// =====================================================
// GET /api/wallet/transactions
// =====================================================

router.get(
  "/transactions",
  authenticateToken,
  async (req, res) => {
    try {
      // -------------------------------------------------
      // USER
      // -------------------------------------------------

      const user =
        await getUserFromRequest(req);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // -------------------------------------------------
      // TRANSACTIONS
      // -------------------------------------------------

      const transactions =
        await Transaction.find({
          userId: user._id,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
        success: true,

        transactions,
      });
    } catch (error) {
      console.error(
        "❌ WALLET TRANSACTIONS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch transactions.",
      });
    }
  }
);

// =====================================================
// POST /api/wallet/withdraw
// =====================================================

router.post(
  "/withdraw",
  authenticateToken,
  async (req, res) => {
    try {
      // -------------------------------------------------
      // USER
      // -------------------------------------------------

      const user =
        await getUserFromRequest(req);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (
        user.status &&
        user.status !== "active"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account is inactive.",
        });
      }

      // -------------------------------------------------
      // MEMBER ID
      // -------------------------------------------------

      const memberId =
        user.memberId ||
        user.userCode;

      if (!memberId) {
        return res.status(500).json({
          success: false,
          message:
            "User account is missing member ID.",
        });
      }

      // -------------------------------------------------
      // REQUEST DATA
      // -------------------------------------------------

      const {
        amount,
        payoutMethod,
        payoutDetails,
      } = req.body || {};

      const grossAmount =
        Number(amount);

      // -------------------------------------------------
      // VALIDATE AMOUNT
      // -------------------------------------------------

      if (
        !Number.isFinite(
          grossAmount
        ) ||
        grossAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid withdrawal amount.",
        });
      }

      const roundedGrossAmount =
        Number(
          grossAmount.toFixed(2)
        );

      // -------------------------------------------------
      // SETTINGS
      // -------------------------------------------------

      const settings =
        await getWalletSettings();

      // -------------------------------------------------
      // MINIMUM WITHDRAWAL
      // -------------------------------------------------

      if (
        roundedGrossAmount <
        settings.minWithdrawalAmount
      ) {
        return res.status(400).json({
          success: false,

          message:
            `Minimum withdrawal amount is ₹${settings.minWithdrawalAmount}.`,
        });
      }

      // -------------------------------------------------
      // VALIDATE PAYOUT METHOD
      // -------------------------------------------------

      const normalizedPayoutMethod =
        String(
          payoutMethod ||
            "UPI"
        )
          .trim()
          .toUpperCase();

      const allowedPayoutMethods = [
        "UPI",
        "BANK",
        "WALLET_CREDIT",
      ];

      if (
        !allowedPayoutMethods.includes(
          normalizedPayoutMethod
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payout method.",
        });
      }

      // -------------------------------------------------
      // PAYOUT DETAILS
      // -------------------------------------------------

      const resolvedPayoutDetails =
        String(
          payoutDetails ||
            user?.bankDetails?.upiId ||
            user?.bankDetails?.accountNumber ||
            ""
        ).trim();

      if (
        !resolvedPayoutDetails
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payout details are required.",
        });
      }

      // -------------------------------------------------
      // PAN / TDS
      // -------------------------------------------------

      const hasPan =
        Boolean(
          user.panVerified &&
            user.panNumber &&
            String(
              user.panNumber
            ).trim().length >= 10
        );

      const tdsPercentage =
        hasPan
          ? settings.tdsRateWithPan
          : settings.tdsRateNoPan;

      const adminFeePercentage =
        settings.adminFeeRate;

      // -------------------------------------------------
      // CALCULATE DEDUCTIONS
      // -------------------------------------------------

      const tdsAmount =
        Number(
          (
            (roundedGrossAmount *
              tdsPercentage) /
            100
          ).toFixed(2)
        );

      const adminFeeAmount =
        Number(
          (
            (roundedGrossAmount *
              adminFeePercentage) /
            100
          ).toFixed(2)
        );

      const netAmount =
        Number(
          (
            roundedGrossAmount -
            tdsAmount -
            adminFeeAmount
          ).toFixed(2)
        );

      if (
        netAmount < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Withdrawal deductions exceed the withdrawal amount.",
        });
      }

      // =================================================
      // MONGODB TRANSACTION
      // =================================================

      const session =
        await mongoose.startSession();

      let createdTransaction;
      let newBalance = 0;

      try {
        await session.withTransaction(
          async () => {
            // -------------------------------------------
            // FIND WALLET
            // -------------------------------------------

            const wallet =
              await Wallet.findOne({
                userId:
                  user._id,
              }).session(
                session
              );

            if (!wallet) {
              throw new Error(
                "Wallet not found."
              );
            }

            // -------------------------------------------
            // NORMALIZE BALANCE
            // -------------------------------------------

            const currentBalance =
              Number(
                wallet.currentBalance || 0
              );

            // -------------------------------------------
            // BALANCE CHECK
            // -------------------------------------------

            if (
              currentBalance <
              roundedGrossAmount
            ) {
              throw new Error(
                "Insufficient wallet balance."
              );
            }

            // -------------------------------------------
            // DEDUCT GROSS AMOUNT
            // -------------------------------------------

            newBalance =
              Number(
                (
                  currentBalance -
                  roundedGrossAmount
                ).toFixed(2)
              );

            wallet.currentBalance =
              newBalance;

            // -------------------------------------------
            // TOTAL WITHDRAWN
            // -------------------------------------------

            wallet.totalWithdrawn =
              Number(
                (
                  Number(
                    wallet.totalWithdrawn ||
                      0
                  ) +
                  roundedGrossAmount
                ).toFixed(2)
              );

            // -------------------------------------------
            // KEEP MEMBER ID IN SYNC
            // -------------------------------------------

            wallet.memberId =
              memberId;

            // -------------------------------------------
            // SAVE WALLET
            // -------------------------------------------

            await wallet.save({
              session,
            });

            // -------------------------------------------
            // CREATE WITHDRAWAL TRANSACTION
            // -------------------------------------------

            const transaction =
              await Transaction.create(
                [
                  {
                    userId:
                      user._id,

                    memberId,

                    type:
                      "withdrawal",

                    category:
                      "withdrawal",

                    amount:
                      roundedGrossAmount,

                    grossAmount:
                      roundedGrossAmount,

                    tdsPercentage,

                    tdsAmount,

                    adminFeePercentage,

                    adminFeeAmount,

                    netAmount,

                    balanceAfter:
                      newBalance,

                    status:
                      "pending",

                    payoutMethod:
                      normalizedPayoutMethod,

                    payoutDetails:
                      resolvedPayoutDetails,

                    panNumber:
                      user.panNumber ||
                      "",

                    utrNumber:
                      "",

                    description:
                      `Payout request (Gross: ₹${roundedGrossAmount}, TDS ${tdsPercentage}%: -₹${tdsAmount}, Admin ${adminFeePercentage}%: -₹${adminFeeAmount}, Net: ₹${netAmount})`,

                    reason:
                      "Customer withdrawal request",

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

            createdTransaction =
              transaction[0];
          }
        );
      } catch (error) {
        // -----------------------------------------------
        // HANDLE KNOWN BUSINESS ERROR
        // -----------------------------------------------

        if (
          error.message ===
          "Insufficient wallet balance."
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Insufficient wallet balance.",
          });
        }

        if (
          error.message ===
          "Wallet not found."
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Wallet not found. Please contact support.",
          });
        }

        throw error;
      } finally {
        await session.endSession();
      }

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(201).json({
        success: true,

        message:
          "Withdrawal submitted successfully with TDS deduction! Awaiting admin approval.",

        transaction:
          createdTransaction,

        newBalance,
      });
    } catch (error) {
      console.error(
        "❌ WALLET WITHDRAW ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to process withdrawal.",
      });
    }
  }
);

export default router;

