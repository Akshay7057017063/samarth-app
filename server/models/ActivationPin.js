import mongoose from "mongoose";

// =====================================================
// ACTIVATION PIN CONFIGURATION
// =====================================================

export const ACTIVATION_PIN_EXPIRY_HOURS = 24;

export const ACTIVATION_PIN_MAX_ATTEMPTS = 5;

// =====================================================
// ACTIVATION PIN SCHEMA
// =====================================================

const activationPinSchema = new mongoose.Schema(
  {
    // Customer/User reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Customer member ID
    memberId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // IMPORTANT:
    // Plain PIN is NEVER stored.
    // Only bcrypt hash is stored.
    pinHash: {
      type: String,
      required: true,
    },

    // Admin-selected activation type
    pinType: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
      required: true,
    },

    // PIN expiry time
    expiresAt: {
      type: Date,
      required: true,
    },

    // Whether PIN has already been successfully used
    used: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Successful activation time
    usedAt: {
      type: Date,
      default: null,
    },

    // Failed verification attempts
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Email sending time
    sentAt: {
      type: Date,
      default: null,
    },

    // Admin who generated the PIN
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// INDEXES
// =====================================================

// Find latest PIN for a customer quickly
activationPinSchema.index({
  userId: 1,
  used: 1,
  createdAt: -1,
});

// Find PIN records by member ID
activationPinSchema.index({
  memberId: 1,
  createdAt: -1,
});

// MongoDB automatically removes records 7 days after
// their actual PIN expiry time.
activationPinSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 7 * 24 * 60 * 60,
  }
);

// =====================================================
// INSTANCE METHODS
// =====================================================

// Check whether PIN has expired
activationPinSchema.methods.isExpired = function () {
  return this.expiresAt.getTime() <= Date.now();
};

// Check whether maximum attempts have been reached
activationPinSchema.methods.isLocked = function () {
  return this.attempts >= ACTIVATION_PIN_MAX_ATTEMPTS;
};

// Check whether PIN can currently be used
activationPinSchema.methods.isUsable = function () {
  return (
    !this.used &&
    !this.isExpired() &&
    !this.isLocked()
  );
};

// =====================================================
// MODEL
// =====================================================

const ActivationPin =
  mongoose.models.ActivationPin ||
  mongoose.model("ActivationPin", activationPinSchema);

export { ActivationPin };

export default ActivationPin;