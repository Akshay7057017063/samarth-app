
import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    // =====================================================
    // USER REFERENCE
    // =====================================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    memberId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    // =====================================================
    // WALLET BALANCE
    // =====================================================

    currentBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // EARNINGS
    // =====================================================

    captchaEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },

    referralCommissions: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // WITHDRAWALS
    // =====================================================

    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // CAPTCHA DAILY TRACKING
    // =====================================================

    todayCaptchasSolved: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastCaptchaDate: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: true,
  }
);

// =========================================================
// MODEL
// =========================================================

export const Wallet = mongoose.model("Wallet", walletSchema);

