import mongoose from "mongoose";

// =====================================================
// CAPTCHA ATTEMPT SCHEMA
// =====================================================
//
// Stores every customer CAPTCHA submission.
//
// Supports:
// - per-user statistics
// - per-CAPTCHA attempt counting
// - cooldown enforcement
// - daily limit tracking
// - security / audit history
// - admin reporting
// - backward compatibility with existing records
// =====================================================

const captchaAttemptSchema =
  new mongoose.Schema(
    {
      // -------------------------------------------------
      // USER REFERENCE
      // -------------------------------------------------

      userId: {
        type:
          mongoose.Schema.Types.ObjectId,

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

      // -------------------------------------------------
      // CAPTCHA IDENTIFIER
      // -------------------------------------------------
      //
      // SHA-256 derived ID of the encrypted CAPTCHA token.
      //
      // Multiple attempts for the same CAPTCHA are
      // intentionally allowed.
      // -------------------------------------------------

      captchaId: {
        type: String,

        default: "",

        trim: true,

        index: true,
      },

      // -------------------------------------------------
      // CAPTCHA TYPE
      // -------------------------------------------------

      captchaType: {
        type: String,

        enum: [
          "text",
          "mixed",
          "image",
          "",
        ],

        default: "",

        index: true,
      },

      // -------------------------------------------------
      // CAPTCHA RESULT
      // -------------------------------------------------

      result: {
        type: String,

        enum: [
          "correct",
          "wrong",
        ],

        required: true,

        index: true,
      },

      // -------------------------------------------------
      // ATTEMPT STATUS
      // -------------------------------------------------

      status: {
        type: String,

        enum: [
          "success",
          "failed",
        ],

        required: true,

        index: true,
      },

      // -------------------------------------------------
      // REWARD
      // -------------------------------------------------

      reward: {
        type: Number,

        default: 0,

        min: 0,
      },

      // -------------------------------------------------
      // RESPONSE TIME
      // -------------------------------------------------

      responseTimeMs: {
        type: Number,

        default: 0,

        min: 0,
      },

      // -------------------------------------------------
      // DAILY TRACKING KEY
      // -------------------------------------------------
      //
      // Format:
      // YYYY-MM-DD
      //
      // The route uses this for customer daily limits
      // and statistics.
      // -------------------------------------------------

      attemptDate: {
        type: String,

        required: true,

        index: true,
      },

      // -------------------------------------------------
      // SERVER SUBMISSION TIMESTAMP
      // -------------------------------------------------
      //
      // Explicit field used by cooldown enforcement.
      // createdAt remains available through timestamps.
      // -------------------------------------------------

      submittedAt: {
        type: Date,

        default: Date.now,

        index: true,
      },

      // -------------------------------------------------
      // CAPTCHA EXPIRY AUDIT
      // -------------------------------------------------
      //
      // Stores the expiry timestamp embedded in the
      // generated CAPTCHA token.
      // -------------------------------------------------

      captchaExpiresAt: {
        type: Date,

        default: null,
      },

      // -------------------------------------------------
      // CASE SENSITIVITY AUDIT
      // -------------------------------------------------

      caseSensitive: {
        type: Boolean,

        default: true,
      },

      // -------------------------------------------------
      // OPTIONAL SECURITY AUDIT DATA
      // -------------------------------------------------

      ipAddress: {
        type: String,

        default: "",

        trim: true,

        maxlength: 100,
      },

      userAgent: {
        type: String,

        default: "",

        trim: true,

        maxlength: 1000,
      },
    },
    {
      timestamps: true,
    }
  );

// =====================================================
// INDEXES
// =====================================================

// -----------------------------------------------------
// User history
// -----------------------------------------------------

captchaAttemptSchema.index({
  userId: 1,
  createdAt: -1,
});

// -----------------------------------------------------
// Member history
// -----------------------------------------------------

captchaAttemptSchema.index({
  memberId: 1,
  createdAt: -1,
});

// -----------------------------------------------------
// Daily attempts
// -----------------------------------------------------
//
// Used for:
//
// - todayAttempts
// - todayCorrect
// - todayWrong
// - daily reporting
// -----------------------------------------------------

captchaAttemptSchema.index({
  userId: 1,
  attemptDate: 1,
});

// -----------------------------------------------------
// Daily success lookup
// -----------------------------------------------------
//
// Optimized for:
//
// {
//   userId,
//   attemptDate,
//   result: "correct",
//   status: "success"
// }
// -----------------------------------------------------

captchaAttemptSchema.index({
  userId: 1,
  attemptDate: 1,
  result: 1,
  status: 1,
});

// -----------------------------------------------------
// Per-CAPTCHA attempt counting
// -----------------------------------------------------
//
// Used by maxAttempts:
//
// {
//   userId,
//   captchaId
// }
// -----------------------------------------------------

captchaAttemptSchema.index({
  userId: 1,
  captchaId: 1,
  createdAt: 1,
});

// -----------------------------------------------------
// Per-CAPTCHA successful solve lookup
// -----------------------------------------------------
//
// Used for replay protection:
//
// {
//   userId,
//   captchaId,
//   result: "correct",
//   status: "success"
// }
// -----------------------------------------------------

captchaAttemptSchema.index({
  userId: 1,
  captchaId: 1,
  result: 1,
  status: 1,
});

// -----------------------------------------------------
// Cooldown lookup
// -----------------------------------------------------
//
// Used to get the latest submission quickly.
// -----------------------------------------------------

captchaAttemptSchema.index({
  userId: 1,
  submittedAt: -1,
});

// -----------------------------------------------------
// Admin result statistics
// -----------------------------------------------------

captchaAttemptSchema.index({
  result: 1,
  createdAt: -1,
});

// -----------------------------------------------------
// User success / failure statistics
// -----------------------------------------------------

captchaAttemptSchema.index({
  userId: 1,
  result: 1,
  status: 1,
  createdAt: -1,
});

// -----------------------------------------------------
// Admin CAPTCHA-type statistics
// -----------------------------------------------------

captchaAttemptSchema.index({
  captchaType: 1,
  result: 1,
  createdAt: -1,
});

// =====================================================
// MODEL
// =====================================================
//
// Prevents OverwriteModelError during hot reloads,
// tests, or repeated imports.
// =====================================================

const CaptchaAttempt =
  mongoose.models.CaptchaAttempt ||
  mongoose.model(
    "CaptchaAttempt",
    captchaAttemptSchema
  );

export {
  CaptchaAttempt,
};

export default CaptchaAttempt;