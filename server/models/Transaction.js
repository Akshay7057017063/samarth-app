import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    // =====================================================
    // USER REFERENCE
    // =====================================================

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

    // =====================================================
    // TRANSACTION TYPE
    // =====================================================

    type: {
      type: String,
      enum: [
        "credit",
        "debit",
        "captcha_reward",
        "referral_bonus",

        // Binary pair completed income
        "binary_income",

        "withdrawal",
      ],
      required: true,
      index: true,
    },

    // =====================================================
    // TRANSACTION CATEGORY
    // =====================================================

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

    // =====================================================
    // UNIQUE TRANSACTION REFERENCE
    // =====================================================
    //
    // Used for idempotency / duplicate protection.
    //
    // Binary pair example:
    //
    // BINARY_PAIR:<parentId>:<pairNumber>
    //
    // Example:
    //
    // BINARY_PAIR:68abc123...:1
    // BINARY_PAIR:68abc123...:2
    //
    // sparse + unique means:
    // - old transactions without referenceKey remain valid
    // - same referenceKey cannot be inserted twice
    //
    // =====================================================

    referenceKey: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    // =====================================================
    // AMOUNTS
    // =====================================================

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

    // =====================================================
    // BALANCE INFORMATION
    // =====================================================

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

    // =====================================================
    // TRANSACTION STATUS
    // =====================================================

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

    // =====================================================
    // WITHDRAWAL / PAYOUT
    // =====================================================

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

    // =====================================================
    // DESCRIPTION / ADMIN REASON
    // =====================================================

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

    // =====================================================
    // ADMIN WHO CREATED THE TRANSACTION
    // =====================================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // =====================================================
    // LEGACY / FRONTEND COMPATIBILITY
    // =====================================================

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// =========================================================
// INDEXES
// =========================================================

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

// Transaction type + status
transactionSchema.index({
  type: 1,
  status: 1,
});

// Transaction category + date
transactionSchema.index({
  category: 1,
  createdAt: -1,
});

// =========================================================
// MODEL
// =========================================================

export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model(
    "Transaction",
    transactionSchema
  );

export default Transaction;