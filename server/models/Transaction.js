import mongoose from "mongoose";

/* =====================================================
   TRANSACTION SCHEMA
===================================================== */

const transactionSchema = new mongoose.Schema(
  {
    /* -----------------------------------------------
       USER REFERENCE
    ------------------------------------------------ */

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    memberId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    /* -----------------------------------------------
       TRANSACTION TYPE

       credit          = wallet credit
       debit           = wallet debit/reversal
       captcha_reward  = CAPTCHA reward
       referral_bonus  = direct referral bonus
       binary_income   = binary pair income
       withdrawal      = withdrawal transaction

       Debit transaction amounts remain positive.
       The type field identifies the transaction direction.
    ------------------------------------------------ */

    type: {
      type: String,
      enum: [
        "credit",
        "debit",
        "captcha_reward",
        "referral_bonus",
        "binary_income",
        "withdrawal",
      ],
      required: true,
      index: true,
    },

    /* -----------------------------------------------
       TRANSACTION CATEGORY
    ------------------------------------------------ */

    category: {
      type: String,
      enum: [
        "captcha",
        "referral",
        "wallet_adjustment",
        "package",
        "withdrawal",
        "other",
      ],
      default: "other",
      index: true,
    },

    /* -----------------------------------------------
       UNIQUE TRANSACTION REFERENCE

       Example:
       BINARY_PAIR:<parentId>:<pairNumber>

       Referral bonus example:
       DIRECT_REFERRAL:<sponsorId>:<customerId>

       Reversal example:
       DELETE_REVERSAL:DIRECT_REFERRAL:<sponsorId>:<customerId>

       Missing references are allowed for legacy
       transactions. Non-empty references remain unique.
    ------------------------------------------------ */

    referenceKey: {
      type: String,
      trim: true,
      default: undefined,

      set: (value) => {
        if (value === null || value === undefined) {
          return undefined;
        }

        const cleanValue = String(value).trim();

        return cleanValue.length > 0
          ? cleanValue
          : undefined;
      },

      unique: true,
      sparse: true,
    },

    /* -----------------------------------------------
       TRANSACTION AMOUNTS

       Debit amounts are stored as positive values.
       Do not store debit amounts as negative numbers.
    ------------------------------------------------ */

    amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    grossAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    tdsPercentage: {
      type: Number,
      default: 0,
      min: 0,
    },

    tdsAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    adminFeePercentage: {
      type: Number,
      default: 0,
      min: 0,
    },

    adminFeeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    netAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* -----------------------------------------------
       BALANCE INFORMATION
    ------------------------------------------------ */

    balanceBefore: {
      type: Number,
      default: 0,
      min: 0,
    },

    balanceAfter: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* -----------------------------------------------
       TRANSACTION STATUS
    ------------------------------------------------ */

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "completed",
      ],
      default: "completed",
      index: true,
    },

    /* -----------------------------------------------
       WITHDRAWAL / PAYOUT
    ------------------------------------------------ */

    payoutMethod: {
      type: String,
      enum: [
        "UPI",
        "BANK",
        "WALLET_CREDIT",
      ],
      default: "WALLET_CREDIT",
    },

    payoutDetails: {
      type: String,
      default: "",
      trim: true,
    },

    panNumber: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    utrNumber: {
      type: String,
      default: "",
      trim: true,
    },

    /* -----------------------------------------------
       DESCRIPTION / ADMIN REASON
    ------------------------------------------------ */

    description: {
      type: String,
      default: "",
      trim: true,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
    },

    /* -----------------------------------------------
       ADMIN REFERENCE
    ------------------------------------------------ */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* -----------------------------------------------
       LEGACY COMPATIBILITY
    ------------------------------------------------ */

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/* =====================================================
   DATABASE INDEXES
===================================================== */

/*
 * referenceKey already declares its unique sparse index
 * in the field definition above. Do not declare the same
 * single-field unique index a second time here.
 */

// User transaction history
transactionSchema.index({
  userId: 1,
  createdAt: -1,
});

// Member transaction history
transactionSchema.index({
  memberId: 1,
  createdAt: -1,
});

// Filter transactions by type and status
transactionSchema.index({
  type: 1,
  status: 1,
});

// Filter transactions by category and date
transactionSchema.index({
  category: 1,
  createdAt: -1,
});

/* =====================================================
   MODEL EXPORTS
===================================================== */

// Reuse the model if it is already registered.
// This prevents OverwriteModelError during reloads.
export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

export default Transaction;