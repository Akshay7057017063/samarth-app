import express from "express";
import mongoose from "mongoose";

import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
import { BankDetails } from "../models/BankDetails.js";

import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// =====================================================
// GET /api/admin/payment-report/customers
// =====================================================
//
// Used by PaymentReport.jsx ("Customer Balances" tab).
//
// For every customer returns:
// - basic info (member ID, name, phone, status)
// - wallet balance + income split (captcha / referral / binary)
// - bank details (from the BankDetails collection, with
//   fallback to the old data saved on the User document)
//
// Admin / superadmin only.
//
// =====================================================

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

router.get(
  "/customers",
  authenticateToken,
  async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          success: false,
          message: "Database is currently unavailable.",
        });
      }

      const role = String(req.user?.role || "").toLowerCase();

      if (!["admin", "superadmin"].includes(role)) {
        return res.status(403).json({
          success: false,
          message: "Admin access required.",
        });
      }

      const [users, wallets, banks] = await Promise.all([
        User.find({ role: "user" })
          .select(
            "memberId userCode name phone mobile email status userType panNumber panVerified bankDetails createdAt"
          )
          .lean(),
        Wallet.find({}).lean(),
        BankDetails.find({}).lean(),
      ]);

      const walletMap = new Map(
        wallets.map((wallet) => [String(wallet.userId), wallet])
      );

      const bankMap = new Map(
        banks.map((bank) => [String(bank.userId), bank])
      );

      const customers = users.map((user) => {
        const id = String(user._id);

        const wallet = walletMap.get(id) || {};
        const bankRecord = bankMap.get(id) || null;
        const legacyBank = user.bankDetails || {};

        const totalEarnings = toNumber(wallet.totalEarnings);
        const captchaEarnings = toNumber(wallet.captchaEarnings);
        const referralCommissions = toNumber(
          wallet.referralCommissions
        );

        // Binary / other income:
        // use a dedicated wallet field if it exists, otherwise
        // whatever is left of total earnings.
        const binaryEarnings = toNumber(
          wallet.binaryEarnings ??
            wallet.binaryIncome ??
            Math.max(
              0,
              totalEarnings - captchaEarnings - referralCommissions
            )
        );

        return {
          userId: id,
          memberId: user.memberId || user.userCode || "",
          name: user.name || "",
          phone: user.phone || user.mobile || "",
          email: user.email || "",
          status: String(user.status || "").toLowerCase(),
          userType: user.userType || "",

          wallet: {
            currentBalance: toNumber(wallet.currentBalance),
            totalEarnings,
            captchaEarnings,
            referralCommissions,
            binaryEarnings,
            totalWithdrawn: toNumber(wallet.totalWithdrawn),
          },

          bank: {
            panNumber: bankRecord
              ? bankRecord.panNumber || ""
              : user.panNumber || "",
            panVerified: bankRecord
              ? Boolean(bankRecord.panVerified)
              : Boolean(user.panVerified),
            accountHolderName: bankRecord
              ? bankRecord.accountHolderName || ""
              : legacyBank.accountHolderName || "",
            accountNumber: bankRecord
              ? bankRecord.accountNumber || ""
              : legacyBank.accountNumber || "",
            ifscCode: bankRecord
              ? bankRecord.ifscCode || ""
              : legacyBank.ifscCode || "",
            bankName: bankRecord
              ? bankRecord.bankName || ""
              : legacyBank.bankName || "",
            upiId: bankRecord
              ? bankRecord.upiId || ""
              : legacyBank.upiId || "",
          },
        };
      });

      return res.json({
        success: true,
        count: customers.length,
        customers,
      });
    } catch (error) {
      console.error("❌ Payment report customers error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to load customer payment data.",
      });
    }
  }
);

export default router;