import mongoose from "mongoose";

const loginCodeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    codeHash: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: [
        "password_reset",
        "login_code",
      ],
      required: true,
      default: "password_reset",
      index: true,
    },

    // TTL index is defined below.
    // Do not add index: true here.
    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    used: {
      type: Boolean,
      default: false,
      index: true,
    },

    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* =====================================================
   TTL INDEX

   MongoDB automatically removes documents after
   expiresAt has passed. Deletion may not be immediate.
===================================================== */

loginCodeSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

/* =====================================================
   FIND LATEST CODE FOR A USER
===================================================== */

loginCodeSchema.index({
  userId: 1,
  purpose: 1,
  used: 1,
  createdAt: -1,
});

/* =====================================================
   MODEL
===================================================== */

export const LoginCode =
  mongoose.models.LoginCode ||
  mongoose.model("LoginCode", loginCodeSchema);

export default LoginCode;