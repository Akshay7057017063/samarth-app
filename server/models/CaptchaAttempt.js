
import mongoose from "mongoose";

const captchaAttemptSchema = new mongoose.Schema(
  {
    // USER REFERENCE
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

    // CAPTCHA RESULT
    result: {
      type: String,
      enum: ["correct", "wrong"],
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
      index: true,
    },

    // REWARD
    reward: {
      type: Number,
      default: 0,
      min: 0,
    },

    // RESPONSE / TIMING INFORMATION
    responseTimeMs: {
      type: Number,
      default: 0,
      min: 0,
    },

    // DAILY TRACKING
    attemptDate: {
      type: String,
      required: true,
      index: true,
    },

    // OPTIONAL IP / USER AGENT FOR SECURITY AUDIT
    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },

    userAgent: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Fast user history queries
captchaAttemptSchema.index({
  userId: 1,
  createdAt: -1,
});

// Fast member history queries
captchaAttemptSchema.index({
  memberId: 1,
  createdAt: -1,
});

// Fast daily statistics
captchaAttemptSchema.index({
  userId: 1,
  attemptDate: 1,
});

// Fast admin statistics
captchaAttemptSchema.index({
  result: 1,
  createdAt: -1,
});

export const CaptchaAttempt = mongoose.model(
  "CaptchaAttempt",
  captchaAttemptSchema
);

