import { User } from "../../models/User.js";
import { Wallet } from "../../models/Wallet.js";
import { Transaction } from "../../models/Transaction.js";
import { CaptchaAttempt } from "../../models/CaptchaAttempt.js";

import { customerFilter, toNumber } from "../../utils/adminHelpers.js";

// =====================================================
// ADMIN STATS
// =====================================================

export const getAdminStats = async (req, res) => {
  try {
    // ---------------- CUSTOMER COUNTS ----------------

    const [totalUsers, activeUsers, inactiveUsers, paidUsers, unpaidUsers] =
      await Promise.all([
        User.countDocuments(customerFilter),
        User.countDocuments({ ...customerFilter, status: "active" }),
        User.countDocuments({
          ...customerFilter,
          status: { $in: ["inactive", "suspended"] },
        }),
        User.countDocuments({ ...customerFilter, userType: "PAID" }),
        User.countDocuments({ ...customerFilter, userType: { $ne: "PAID" } }),
      ]);

    // ---------------- CUSTOMER IDS ----------------

    const customers = await User.find(customerFilter).select("_id").lean();
    const customerIds = customers.map((customer) => customer._id);

    // ---------------- WALLET STATISTICS ----------------

    const walletResult = await Wallet.aggregate([
      { $match: { userId: { $in: customerIds } } },
      {
        $group: {
          _id: null,
          totalCurrentBalance: { $sum: "$currentBalance" },
          totalCaptchaPaid: { $sum: "$captchaEarnings" },
          totalReferralPaid: { $sum: "$referralCommissions" },
          totalWithdrawnFromWallet: { $sum: "$totalWithdrawn" },
        },
      },
    ]);

    const walletStats = walletResult[0] || {};

    // ---------------- SALES STATISTICS ----------------

    const salesResult = await Transaction.aggregate([
      { $match: { userId: { $in: customerIds }, category: "package" } },
      {
        $group: {
          _id: null,
          totalSalesCount: { $sum: 1 },
          totalSalesVolume: { $sum: "$amount" },
        },
      },
    ]);

    const salesStats = salesResult[0] || {};

    // ---------------- PENDING WITHDRAWALS ----------------

    const pendingWithdrawalResult = await Transaction.aggregate([
      {
        $match: {
          userId: { $in: customerIds },
          type: "withdrawal",
          status: "pending",
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          pendingNet: { $sum: { $ifNull: ["$netAmount", "$amount"] } },
        },
      },
    ]);

    const pendingStats = pendingWithdrawalResult[0] || {};

    // ---------------- COMPLETED WITHDRAWALS ----------------

    const completedWithdrawalResult = await Transaction.aggregate([
      {
        $match: {
          userId: { $in: customerIds },
          type: "withdrawal",
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalWithdrawnPaid: { $sum: { $ifNull: ["$netAmount", "$amount"] } },
          totalTdsDeducted: { $sum: { $ifNull: ["$tdsAmount", 0] } },
          totalAdminFee: { $sum: { $ifNull: ["$adminFee", 0] } },
        },
      },
    ]);

    const completedStats = completedWithdrawalResult[0] || {};

    // ---------------- CAPTCHA STATISTICS ----------------

    const captchaResult = await CaptchaAttempt.aggregate([
      {
        $match: {
          userId: { $in: customerIds },
          result: "correct",
          status: "success",
        },
      },
      { $group: { _id: null, totalCorrect: { $sum: 1 } } },
    ]);

    const captchaStats = captchaResult[0] || {};

    // ---------------- FINAL RESPONSE ----------------

    return res.json({
      success: true,

      stats: {
        // CUSTOMERS
        totalUsers,
        activeUsers,
        inactiveUsers,
        paidUsers,
        unpaidUsers,

        // WALLET
        totalCurrentBalance: toNumber(walletStats.totalCurrentBalance),
        totalCaptchaPaid: toNumber(walletStats.totalCaptchaPaid),
        totalReferralPaid: toNumber(walletStats.totalReferralPaid),
        totalWithdrawnFromWallet: toNumber(walletStats.totalWithdrawnFromWallet),

        // CAPTCHA
        totalCaptchaCorrect: toNumber(captchaStats.totalCorrect),

        // SALES
        totalSalesCount: toNumber(salesStats.totalSalesCount),
        totalSalesVolume: toNumber(salesStats.totalSalesVolume),

        // WITHDRAWALS
        pendingWithdrawalsCount: toNumber(pendingStats.count),
        pendingWithdrawalsNet: toNumber(pendingStats.pendingNet),
        totalWithdrawnPaid: toNumber(completedStats.totalWithdrawnPaid),

        // FINANCIAL
        totalTdsDeducted: toNumber(completedStats.totalTdsDeducted),
        totalAdminFee: toNumber(completedStats.totalAdminFee),

        // BACKWARD COMPATIBILITY
        totalCustomers: totalUsers,
        activeCustomers: activeUsers,
        inactiveCustomers: inactiveUsers,
        totalWalletBalance: toNumber(walletStats.totalCurrentBalance),
        totalSales: toNumber(salesStats.totalSalesCount),
        totalSalesAmount: toNumber(salesStats.totalSalesVolume),
        pendingWithdrawals: toNumber(pendingStats.count),
        completedWithdrawals: toNumber(completedStats.totalWithdrawnPaid),
      },
    });
  } catch (error) {
    console.error("❌ Get admin stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin statistics.",
    });
  }
};