import mongoose from "mongoose";

import { User } from "../../models/User.js";
import { Wallet } from "../../models/Wallet.js";
import { Transaction } from "../../models/Transaction.js";

import {
  customerFilter,
  getAdminId,
  getSafeTransaction,
  toNumber,
} from "../../utils/adminHelpers.js";

// =====================================================
// GET WITHDRAWALS
// =====================================================

export const getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Transaction.find({ type: "withdrawal" })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: withdrawals.length,
      withdrawals,
    });
  } catch (error) {
    console.error("❌ Get withdrawals error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch withdrawals.",
    });
  }
};

// =====================================================
// WITHDRAWAL ACTION (approve / reject / complete)
// =====================================================

export const withdrawalAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remark, reason } = req.body;

    if (!["approve", "reject", "complete"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal action.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal ID.",
      });
    }

    const session = await mongoose.startSession();

    let updatedWithdrawal;

    try {
      await session.withTransaction(async () => {
        const withdrawal = await Transaction.findOne({
          _id: id,
          type: "withdrawal",
        }).session(session);

        if (!withdrawal) {
          throw new Error("WITHDRAWAL_NOT_FOUND");
        }

        // ---------------- STATE VALIDATION ----------------

        if (
          (action === "approve" || action === "reject") &&
          withdrawal.status !== "pending"
        ) {
          throw new Error("WITHDRAWAL_NOT_PENDING");
        }

        if (action === "complete" && withdrawal.status !== "approved") {
          throw new Error("WITHDRAWAL_NOT_APPROVED");
        }

        // ---------------- APPROVE ----------------

        if (action === "approve") {
          withdrawal.status = "approved";
        }

        // ---------------- COMPLETE ----------------

        if (action === "complete") {
          withdrawal.status = "completed";
        }

        // ---------------- REJECT + REFUND ----------------

        if (action === "reject") {
          const wallet = await Wallet.findOne({
            userId: withdrawal.userId,
          }).session(session);

          if (!wallet) {
            throw new Error("WALLET_NOT_FOUND");
          }

          const currentBalance = toNumber(wallet.currentBalance);
          const refundAmount = toNumber(
            withdrawal.grossAmount || withdrawal.amount
          );

          wallet.currentBalance = Number(
            (currentBalance + refundAmount).toFixed(2)
          );

          await wallet.save({ session });

          withdrawal.status = "rejected";
          withdrawal.balanceAfter = wallet.currentBalance;

          await Transaction.create(
            [
              {
                userId: withdrawal.userId,
                memberId: withdrawal.memberId,
                type: "credit",
                category: "wallet_adjustment",
                amount: refundAmount,
                grossAmount: refundAmount,
                netAmount: refundAmount,
                balanceAfter: wallet.currentBalance,
                status: "completed",
                description: "Withdrawal rejected - amount refunded",
                reason: remark || reason || "Withdrawal rejected",
                createdBy: getAdminId(req),
                timestamp: new Date(),
              },
            ],
            { session }
          );
        }

        withdrawal.reason = remark || reason || withdrawal.reason || "";
        withdrawal.updatedAt = new Date();
        withdrawal.processedBy = getAdminId(req);

        await withdrawal.save({ session });

        updatedWithdrawal = withdrawal;
      });
    } catch (error) {
      const knownErrors = {
        WITHDRAWAL_NOT_FOUND: [404, "Withdrawal not found."],
        WITHDRAWAL_NOT_PENDING: [
          400,
          "Only pending withdrawals can be approved or rejected.",
        ],
        WITHDRAWAL_NOT_APPROVED: [
          400,
          "Only approved withdrawals can be completed.",
        ],
        WALLET_NOT_FOUND: [400, "Customer wallet not found."],
      };

      const known = knownErrors[error.message];

      if (known) {
        return res.status(known[0]).json({
          success: false,
          message: known[1],
        });
      }

      throw error;
    } finally {
      await session.endSession();
    }

    return res.json({
      success: true,
      message: "Withdrawal updated successfully.",
      withdrawal: getSafeTransaction(updatedWithdrawal),
    });
  } catch (error) {
    console.error("❌ Withdrawal action error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update withdrawal.",
    });
  }
};

// =====================================================
// TDS REPORT
// =====================================================

export const getTdsReport = async (req, res) => {
  try {
    const users = await User.find(customerFilter)
      .select(
        "_id memberId userCode name email panNumber panVerified totalIncome"
      )
      .sort({ createdAt: -1 })
      .lean();

    const userIds = users.map((user) => user._id);

    const tdsResults = await Transaction.aggregate([
      {
        $match: {
          userId: { $in: userIds },
          type: "withdrawal",
          status: { $in: ["approved", "completed"] },
        },
      },
      {
        $group: {
          _id: "$userId",
          totalTds: { $sum: "$tdsAmount" },
          totalGrossWithdrawal: { $sum: "$grossAmount" },
          totalNetWithdrawal: { $sum: "$netAmount" },
        },
      },
    ]);

    const tdsMap = new Map(tdsResults.map((item) => [String(item._id), item]));

    const report = users.map((user) => {
      const tdsData = tdsMap.get(String(user._id));

      return {
        _id: user._id,
        memberId: user.memberId || user.userCode || "-",
        name: user.name,
        email: user.email,
        panNumber: user.panNumber || "-",
        panVerified: Boolean(user.panVerified),
        totalIncome: toNumber(user.totalIncome),
        tds: toNumber(tdsData?.totalTds),
        totalGrossWithdrawal: toNumber(tdsData?.totalGrossWithdrawal),
        totalNetWithdrawal: toNumber(tdsData?.totalNetWithdrawal),
      };
    });

    return res.json({ success: true, count: report.length, report });
  } catch (error) {
    console.error("❌ Get TDS report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate TDS report.",
    });
  }
};