import mongoose from "mongoose";

// =====================================================
// USER DEVICE (Device Binding / Trusted Device)
// =====================================================
//

//   active   -> the ONE trusted device of the customer
//   pending  -> new device waiting for admin approval
//   revoked  -> previously active device removed by admin
//   rejected -> pending request rejected by admin
//
// deviceId  = SHA-256 of the device public key (derived by the
//             server, never trusted from the client).
// publicKey = ECDSA P-256 public key (JWK, JSON string). The
//             private key is non-extractable and stays inside
//             the customer's browser (IndexedDB).
// =====================================================

export const DEVICE_STATUSES = [
  "active",
  "pending",
  "revoked",
  "rejected",
];

const userDeviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    memberId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    deviceId: {
      type: String,
      required: true,
      index: true,
    },

    publicKey: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: DEVICE_STATUSES,
      default: "pending",
      index: true,
    },

    // Informational only (never used for security decisions)
    deviceLabel: { type: String, default: "", trim: true },
    userAgent: { type: String, default: "" },
    lastIp: { type: String, default: "" },

    registeredAt: { type: Date, default: Date.now },
    requestedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },

    // How this device became active
    // first_login | activation | admin_approval
    activatedVia: { type: String, default: "" },

    // Admin audit trail
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Device that this device replaced (history)
    replacedDeviceId: { type: String, default: "" },

    adminNote: { type: String, default: "", trim: true },
    identityVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One device record per customer + key
userDeviceSchema.index(
  { userId: 1, deviceId: 1 },
  { unique: true }
);

// HARD GUARANTEE: only ONE active device per customer.
userDeviceSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
    name: "one_active_device_per_user",
  }
);

const UserDevice =
  mongoose.models.UserDevice ||
  mongoose.model("UserDevice", userDeviceSchema);

export { UserDevice };
export default UserDevice;
