import crypto from "crypto";
import { UserDevice } from "../models/UserDevice.js";

// =====================================================
// DEVICE BINDING HELPERS
// =====================================================

const PROOF_MAX_AGE_MS = 2 * 60 * 1000; // 2 minutes

export const DEVICE_ERROR = {
  REQUIRED: "DEVICE_PROOF_REQUIRED",
  INVALID: "DEVICE_PROOF_INVALID",
  NOT_APPROVED: "DEVICE_NOT_APPROVED",
};

// Canonical string of the public key => stable deviceId
const canonicalKey = (jwk) =>
  JSON.stringify({
    crv: jwk.crv,
    kty: jwk.kty,
    x: jwk.x,
    y: jwk.y,
  });

export const deriveDeviceId = (jwk) =>
  crypto
    .createHash("sha256")
    .update(canonicalKey(jwk))
    .digest("hex");

const parseJwk = (raw) => {
  try {
    const jwk = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (
      !jwk ||
      jwk.kty !== "EC" ||
      jwk.crv !== "P-256" ||
      !jwk.x ||
      !jwk.y
    ) {
      return null;
    }
    return { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y };
  } catch {
    return null;
  }
};

// -----------------------------------------------------
// Verify the proof sent by the browser.
//
// proof = {
//   publicKey: JWK,
//   signature: base64 (ECDSA P-256 / SHA-256, IEEE-P1363),
//   timestamp: ms since epoch,
//   deviceLabel?: string
// }
// Signed message: `${purpose}|${identifier}|${timestamp}`
// -----------------------------------------------------
export const verifyDeviceProof = ({
  proof,
  purpose,
  identifier,
}) => {
  if (
    !proof ||
    !proof.publicKey ||
    !proof.signature ||
    !proof.timestamp
  ) {
    return { ok: false, code: DEVICE_ERROR.REQUIRED };
  }

  const jwk = parseJwk(proof.publicKey);
  if (!jwk) return { ok: false, code: DEVICE_ERROR.INVALID };

  const ts = Number(proof.timestamp);
  if (
    !Number.isFinite(ts) ||
    Math.abs(Date.now() - ts) > PROOF_MAX_AGE_MS
  ) {
    return { ok: false, code: DEVICE_ERROR.INVALID };
  }

  try {
    const key = crypto.createPublicKey({
      key: jwk,
      format: "jwk",
    });

    const valid = crypto.verify(
      "sha256",
      Buffer.from(`${purpose}|${identifier}|${ts}`),
      { key, dsaEncoding: "ieee-p1363" },
      Buffer.from(String(proof.signature), "base64")
    );

    if (!valid) return { ok: false, code: DEVICE_ERROR.INVALID };
  } catch {
    return { ok: false, code: DEVICE_ERROR.INVALID };
  }

  return {
    ok: true,
    deviceId: deriveDeviceId(jwk),
    publicKey: canonicalKey(jwk),
    deviceLabel: String(proof.deviceLabel || "")
      .trim()
      .slice(0, 120),
  };
};

export const getClientIp = (req) =>
  String(
    req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      ""
  )
    .split(",")[0]
    .trim();

export const getActiveDevice = (userId) =>
  UserDevice.findOne({ userId, status: "active" });

// -----------------------------------------------------
// Register the first device for a customer that has no
// active device. Returns the active device document.
// Safe against races (unique partial index).
// -----------------------------------------------------
export const registerFirstDevice = async ({
  user,
  proofResult,
  req,
  via,
}) => {
  try {
    return await UserDevice.findOneAndUpdate(
      { userId: user._id, deviceId: proofResult.deviceId },
      {
        $set: {
          memberId: user.memberId || user.userCode,
          publicKey: proofResult.publicKey,
          status: "active",
          deviceLabel: proofResult.deviceLabel,
          userAgent: String(req.headers["user-agent"] || "").slice(0, 300),
          lastIp: getClientIp(req),
          approvedAt: new Date(),
          activatedVia: via,
          lastLoginAt: new Date(),
        },
        $setOnInsert: { registeredAt: new Date() },
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    // Another request registered a different device first.
    if (error?.code === 11000) {
      return getActiveDevice(user._id);
    }
    throw error;
  }
};

// -----------------------------------------------------
// Create / refresh the pending request of a new device.
// Only ONE pending request per customer is kept.
// -----------------------------------------------------
export const createPendingRequest = async ({
  user,
  proofResult,
  req,
}) => {
  // Drop older pending requests from other devices
  await UserDevice.updateMany(
    {
      userId: user._id,
      status: "pending",
      deviceId: { $ne: proofResult.deviceId },
    },
    {
      $set: {
        status: "rejected",
        rejectedAt: new Date(),
        adminNote: "Superseded by a newer device request.",
      },
    }
  );

  return UserDevice.findOneAndUpdate(
    { userId: user._id, deviceId: proofResult.deviceId },
    {
      $set: {
        memberId: user.memberId || user.userCode,
        publicKey: proofResult.publicKey,
        status: "pending",
        deviceLabel: proofResult.deviceLabel,
        userAgent: String(req.headers["user-agent"] || "").slice(0, 300),
        lastIp: getClientIp(req),
        requestedAt: new Date(),
        rejectedAt: null,
        revokedAt: null,
      },
      $setOnInsert: { registeredAt: new Date() },
    },
    { upsert: true, new: true }
  );
};
