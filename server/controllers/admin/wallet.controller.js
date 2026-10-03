import mongoose from "mongoose";

import { Wallet } from "../../models/Wallet.js";
import { Transaction } from "../../models/Transaction.js";

import {
  findCustomerByIdentifier,
  getAdminId,
  toNumber,
} from "../../utils/adminHelpers.js";

// =====================================================
// ADJUST WALLET
// =====================================================

export const adjustWallet = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, reason } = req.body;

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet amount.",
      });
    }

    const user = await findCustomerByIdentifier(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const adjustmentType = type === "debit" ? "debit" : "credit";
    const amountToApply = Number(Math.abs(numericAmount).toFixed(2));

    const session = await mongoose.startSession();

    let updatedWallet;

    try {
      await session.withTransaction(async () => {
        let wallet = await Wallet.findOne({ userId: user._id }).session(session);

        if (!wallet) {
          wallet = new Wallet({
            userId: user._id,
            memberId: user.memberId,
            currentBalance: 0,
            totalEarnings: 0,
            captchaEarnings: 0,
            referralCommissions: 0,
            totalWithdrawn: 0,
            todayCaptchasSolved: 0,
            lastCaptchaDate: new Date().toISOString(),
          });
        }

        const currentBalance = toNumber(wallet.currentBalance);

        let newBalance;

        if (adjustmentType === "debit") {
          if (currentBalance < amountToApply) {
            throw new Error("INSUFFICIENT_BALANCE");
          }

          newBalance = Number((currentBalance - amountToApply).toFixed(2));
        } else {
          newBalance = Number((currentBalance + amountToApply).toFixed(2));
        }

        wallet.currentBalance = newBalance;
        wallet.memberId = user.memberId;

        await wallet.save({ session });

        const transaction = new Transaction({
          userId: user._id,
          memberId: user.memberId,
          type: adjustmentType,
          category: "wallet_adjustment",
          amount: amountToApply,
          grossAmount: amountToApply,
          netAmount: amountToApply,
          balanceAfter: newBalance,
          status: "completed",
          description: reason || "Admin wallet adjustment",
          reason: reason || "Admin wallet adjustment",
          createdBy: getAdminId(req),
          timestamp: new Date(),
        });

        await transaction.save({ session });

        updatedWallet = wallet;
      });
    } catch (error) {
      if (error.message === "INSUFFICIENT_BALANCE") {
        return res.status(400).json({
          success: false,
          message: "Insufficient wallet balance.",
        });
      }

      throw error;
    } finally {
      await session.endSession();
    }

    return res.json({
      success: true,
      message: "Wallet updated successfully.",
      wallet: updatedWallet,
    });
  } catch (error) {
    console.error("❌ Adjust wallet error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to adjust wallet.",
    });
  }
};