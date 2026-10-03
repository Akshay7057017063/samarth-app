import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // =====================================================
    // BASIC ACCOUNT INFORMATION
    // =====================================================

    memberId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    userCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      index: true,
    },

    // =====================================================
    // REFERRAL / MLM INFORMATION
    // =====================================================

    // Sponsor / Referral tree
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    sponsorCode: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
      index: true,
    },

    sponsorMemberId: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
      index: true,
    },

    treePath: {
      type: String,
      default: "/",
      index: true,
    },

    level: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Existing referral position
    position: {
      type: String,
      enum: ["left", "right"],
      default: "left",
    },

    directReferralsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    teamCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // BINARY PLACEMENT TREE
    // =====================================================
    //
    // IMPORTANT:
    // sponsorId = Referral/Sponsor relationship
    //
    // binaryParentId = Binary placement parent
    // binaryPosition = left/right position under parent
    // binaryLeftId = left child
    // binaryRightId = right child
    //
    // Referral tree and Binary tree are kept separate.
    // =====================================================

    binaryParentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    binaryPosition: {
      type: String,
      enum: ["left", "right"],
      default: null,
    },

    binaryLeftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    binaryRightId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    binaryLevel: {
      type: Number,
      default: 1,
      min: 1,
    },

    binaryPath: {
      type: String,
      default: "/",
      index: true,
    },

    // =====================================================
    // USER / PACKAGE INFORMATION
    // =====================================================

    userType: {
      type: String,
      default: "UNPAID",
      trim: true,
    },

    activationDate: {
      type: Date,
      default: null,
    },

    joiningPackage: {
      type: String,
      default: "",
      trim: true,
    },

    rank: {
      type: String,
      default: "Distributor",
      trim: true,
    },

    // =====================================================
    // TEAM COUNTS
    // =====================================================

    leftCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    rightCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    leftBusiness: {
      type: Number,
      default: 0,
      min: 0,
    },

    rightBusiness: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // REFERRAL COUNTS
    // =====================================================

    totalReferral: {
      type: Number,
      default: 0,
      min: 0,
    },

    activeReferral: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // PV / POINTS
    // =====================================================

    leftPv: {
      type: Number,
      default: 0,
      min: 0,
    },

    rightPv: {
      type: Number,
      default: 0,
      min: 0,
    },

    leftCarryForwardPv: {
      type: Number,
      default: 0,
      min: 0,
    },

    rightCarryForwardPv: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // TEAM
    // =====================================================

    totalTeam: {
      type: Number,
      default: 0,
      min: 0,
    },

    activeTeam: {
      type: Number,
      default: 0,
      min: 0,
    },

    teamPercent: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // INCOME
    // =====================================================

    matchingIncome: {
      type: Number,
      default: 0,
      min: 0,
    },

    todayMatchingIncome: {
      type: Number,
      default: 0,
      min: 0,
    },

    franchiseReferralIncome: {
      type: Number,
      default: 0,
      min: 0,
    },

    franchiseMatchingIncome: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalIncome: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // KYC / PAN / TDS
    // =====================================================

    panNumber: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    panVerified: {
      type: Boolean,
      default: false,
    },

    bankDetails: {
      accountHolderName: {
        type: String,
        default: "",
        trim: true,
      },

      accountNumber: {
        type: String,
        default: "",
        trim: true,
      },

      ifscCode: {
        type: String,
        default: "",
        uppercase: true,
        trim: true,
      },

      bankName: {
        type: String,
        default: "",
        trim: true,
      },

      upiId: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // =====================================================
    // OPTIONAL ACCOUNT INFORMATION
    // =====================================================

    dateOfEntry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// =========================================================
// INDEXES
// =========================================================

userSchema.index({
  status: 1,
  role: 1,
});

// Binary tree lookup optimization
userSchema.index({
  binaryParentId: 1,
  binaryPosition: 1,
});

// Binary tree level lookup
userSchema.index({
  binaryLevel: 1,
});

// =========================================================
// MODEL
// =========================================================

export const User = mongoose.model("User", userSchema);