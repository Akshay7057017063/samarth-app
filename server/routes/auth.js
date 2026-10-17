import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import crypto from "crypto";

import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
import { LoginCode } from "../models/LoginCode.js";
import { UserDevice } from "../models/UserDevice.js";
import {
  DEVICE_ERROR,
  verifyDeviceProof,
  getActiveDevice,
  registerFirstDevice,
  createPendingRequest,
} from "../utils/deviceBinding.js";
import {
  ActivationPin,
  ACTIVATION_PIN_MAX_ATTEMPTS,
} from "../models/ActivationPin.js";

import { authenticateToken } from "../middleware/auth.js";

import { sendPasswordResetCodeEmail } from "../utils/mailer.js";

import {
  processCompletedBinaryPairIncome,
  processDirectReferralIncome,
} from "../utils/binaryIncome.js";
import { BankDetails } from "../models/BankDetails.js";

const router = express.Router();

// =====================================================
// JWT SECRET
// =====================================================

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn("⚠️ JWT_SECRET is not defined in .env.");
}

// =====================================================
// PASSWORD RESET SETTINGS
// =====================================================

const PASSWORD_RESET_CODE_EXPIRY_MINUTES = 10;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;

// =====================================================
// KYC SETTINGS
// =====================================================
//
// These rules are the same ones used by the frontend
// (ProfileKycPage.jsx). Keep both in sync.
//
// PAN is marked "verified" automatically ONLY if you set
// PAN_AUTO_VERIFY=true in .env. Default is false: an admin
// (or a PAN verification service) must verify it.
//
// KYC data is stored in the BankDetails collection
// (one record per user). For backward compatibility the
// same values are also mirrored on the User document, so
// existing admin / withdrawal code keeps working.
//
// =====================================================

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_REGEX = /^\d{6,18}$/;
const UPI_REGEX = /^[a-z0-9._-]{2,256}@[a-z][a-z0-9]{1,63}$/;
const KYC_TEXT_MAX_LENGTH = 100;

const PAN_AUTO_VERIFY = process.env.PAN_AUTO_VERIFY === "true";

// =====================================================
// HELPER: CHECK MONGODB
// =====================================================

const isMongoActive = () => {
  return mongoose.connection.readyState === 1;
};

// =====================================================
// HELPER: CREATE JWT
// =====================================================

const createToken = (user, deviceId = "") => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: String(user._id),
      memberId: user.memberId || user.userCode || "",
      userCode: user.userCode || user.memberId || "",
      role: user.role || "user",
      name: user.name || "",
      // Device binding claims (customers only)
      ...(deviceId
        ? { did: deviceId, sv: Number(user.sessionVersion || 0) }
        : {}),
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// =====================================================
// HELPER: USER RESPONSE
// =====================================================

const formatUserResponse = (user) => {
  if (!user) {
    return null;
  }

  const userObject =
    typeof user.toObject === "function"
      ? user.toObject()
      : { ...user };

  delete userObject.password;

  return userObject;
};

// =====================================================
// HELPER: KYC (BankDetails collection)
// =====================================================

// Returns the user's KYC as one plain object.
// BankDetails record is the source of truth. If it does not
// exist yet (older members), values saved on the User
// document are used as a fallback.
const getKycForUser = async (user) => {
  const record = await BankDetails.findOne({
    userId: user._id,
  }).lean();

  if (record) {
    return {
      panNumber: record.panNumber || "",
      panVerified: Boolean(record.panVerified),
      bankDetails: {
        accountHolderName: record.accountHolderName || "",
        accountNumber: record.accountNumber || "",
        ifscCode: record.ifscCode || "",
        bankName: record.bankName || "",
        upiId: record.upiId || "",
      },
    };
  }

  const legacy = user.bankDetails || {};

  return {
    panNumber: user.panNumber || "",
    panVerified: Boolean(user.panVerified),
    bankDetails: {
      accountHolderName: legacy.accountHolderName || "",
      accountNumber: legacy.accountNumber || "",
      ifscCode: legacy.ifscCode || "",
      bankName: legacy.bankName || "",
      upiId: legacy.upiId || "",
    },
  };
};

// Puts KYC values on the user response object so the
// frontend can keep reading user.panNumber / user.bankDetails.
const withKyc = (userResponse, kyc) => {
  if (!userResponse) {
    return userResponse;
  }

  return {
    ...userResponse,
    panNumber: kyc.panNumber,
    panVerified: kyc.panVerified,
    bankDetails: kyc.bankDetails,
  };
};

// =====================================================
// HELPER: FIND USER BY LOGIN ID
// =====================================================

const findUserByLoginId = async (loginId) => {
  const cleanId = String(loginId || "").trim();

  if (!cleanId) {
    return null;
  }

  // ---------------------------------------------------
  // EMAIL
  // ---------------------------------------------------

  if (cleanId.includes("@")) {
    const user = await User.findOne({
      email: cleanId.toLowerCase(),
    });

    if (user) {
      return user;
    }
  }

  // ---------------------------------------------------
  // MEMBER ID / USER CODE
  // ---------------------------------------------------

  const upperId = cleanId.toUpperCase();

  const user = await User.findOne({
    $or: [
      {
        memberId: upperId,
      },
      {
        userCode: upperId,
      },
    ],
  });

  if (user) {
    return user;
  }

  // ---------------------------------------------------
  // MONGODB ACCOUNT ID
  // ---------------------------------------------------

  if (mongoose.Types.ObjectId.isValid(cleanId)) {
    return User.findById(cleanId);
  }

  return null;
};

// =====================================================
// HELPER: GENERATE 6 DIGIT RESET CODE
// =====================================================

const generatePasswordResetCode = () => {
  return String(crypto.randomInt(100000, 1000000));
};

// =====================================================
// HELPER: PROCESS BINARY INCOME FOR ALL ANCESTORS
// =====================================================
//
// When a new member becomes ACTIVE:
//
// New member may complete a pair for:
// - direct binary parent
// - grandparent
// - great-grandparent
// - etc.
//
// Therefore we walk upward through binaryParentId.
//
// Only ACTIVE ancestors are processed.
// Inactive members do not receive binary income.
//
// =====================================================

const processBinaryIncomeForAncestors = async (activatedUser) => {
  if (!activatedUser?._id) {
    return {
      processedAncestors: [],
      totalPaid: 0,
    };
  }

  let ancestorId = activatedUser.binaryParentId || null;

  const visited = new Set();

  const processedAncestors = [];
  let totalPaid = 0;

  while (ancestorId) {
    const ancestorIdString = String(ancestorId);

    if (visited.has(ancestorIdString)) {
      console.warn(
        `⚠️ Binary ancestor loop detected for user ${activatedUser._id}`
      );
      break;
    }

    visited.add(ancestorIdString);

    const ancestor = await User.findById(ancestorId).select(
      "_id memberId name status binaryParentId"
    );

    if (!ancestor) {
      break;
    }

    if (
      String(ancestor.status || "").toLowerCase() ===
      "active"
    ) {
      try {
        const result =
          await processCompletedBinaryPairIncome({
            parentId: ancestor._id,
          });

        processedAncestors.push({
          userId: ancestor._id,
          memberId: ancestor.memberId,
          leftActiveCount:
            Number(result.leftActiveCount || 0),
          rightActiveCount:
            Number(result.rightActiveCount || 0),
          totalActiveDownline:
            Number(result.totalActiveDownline || 0),
          eligiblePairCount:
            Number(result.eligiblePairCount || 0),
          totalPaid:
            Number(result.totalPaid || 0),
        });

        totalPaid += Number(result.totalPaid || 0);
      } catch (incomeError) {
        console.error(
          `❌ Binary income processing failed for ancestor ${ancestor._id}:`,
          incomeError
        );

        // Do not fail the customer's activation because of
        // a secondary binary-income processing error.
        //
        // The activation itself has already succeeded.
      }
    }

    ancestorId = ancestor.binaryParentId || null;
  }

  return {
    processedAncestors,
    totalPaid,
  };
};

// =====================================================
// POST /api/auth/login
// =====================================================

router.post("/login", async (req, res) => {
  try {
    if (!isMongoActive()) {
      return res.status(503).json({
        success: false,
        message:
          "Database is currently unavailable. Please try again later.",
      });
    }

    const { loginId, password } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide Account ID / User Code / Email and Password.",
      });
    }

    const cleanId = String(loginId).trim();
    const cleanPassword = String(password);

    if (!cleanId || !cleanPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide Account ID / User Code / Email and Password.",
      });
    }

    // -------------------------------------------------
    // FIND USER
    // -------------------------------------------------

    const user = await findUserByLoginId(cleanId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Account ID, User Code or Email not found.",
      });
    }

    // -------------------------------------------------
    // CHECK ACCOUNT STATUS
    // -------------------------------------------------

    if (
      String(user.status || "active").toLowerCase() !==
      "active"
    ) {
      const notYetActivated =
        String(user.status || "").toLowerCase() ===
          "inactive" &&
        !user.activationDate;

      return res.status(403).json({
        success: false,
        message: notYetActivated
          ? "Your account is not activated yet. Please activate it with the PIN sent by admin, or contact admin."
          : "Your account is inactive. Please contact admin.",
      });
    }

    // -------------------------------------------------
    // CHECK PASSWORD
    // -------------------------------------------------

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message:
          "Password is not configured for this account.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      cleanPassword,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password.",
      });
    }

    // -------------------------------------------------
    // DEVICE BINDING (customers only)
    // -------------------------------------------------

    let boundDeviceId = "";

    if (user.role === "user") {
      const proofResult = verifyDeviceProof({
        proof: req.body?.deviceProof,
        purpose: "login",
        identifier: cleanId,
      });

      if (!proofResult.ok) {
        return res.status(400).json({
          success: false,
          code: proofResult.code,
          message:
            "Secure device verification failed. Please use the latest app version in your browser and try again.",
        });
      }

      const activeDevice = await getActiveDevice(user._id);

      if (!activeDevice) {
        // First trusted device for this customer.
        const registered = await registerFirstDevice({
          user,
          proofResult,
          req,
          via: "first_login",
        });

        if (
          !registered ||
          registered.deviceId !== proofResult.deviceId
        ) {
          // Lost a race to another device.
          const pending = await createPendingRequest({
            user,
            proofResult,
            req,
          });

          return res.status(403).json({
            success: false,
            code: DEVICE_ERROR.NOT_APPROVED,
            requestId: String(pending._id),
            message:
              "This device is not approved for your account. A request has been sent to admin. Please contact admin for approval.",
          });
        }

        boundDeviceId = registered.deviceId;
      } else if (activeDevice.deviceId === proofResult.deviceId) {
        activeDevice.lastLoginAt = new Date();
        activeDevice.lastIp = String(
          req.headers["x-forwarded-for"] ||
            req.socket?.remoteAddress ||
            ""
        )
          .split(",")[0]
          .trim();
        await activeDevice.save();

        boundDeviceId = activeDevice.deviceId;
      } else {
        // DIFFERENT device: never switch automatically.
        const pending = await createPendingRequest({
          user,
          proofResult,
          req,
        });

        return res.status(403).json({
          success: false,
          code: DEVICE_ERROR.NOT_APPROVED,
          requestId: String(pending._id),
          message:
            "This device is not approved for your account. A device approval request has been sent to admin. Please contact admin to approve your new device.",
        });
      }
    }

    // -------------------------------------------------
    // CREATE JWT
    // -------------------------------------------------

    const token = createToken(user, boundDeviceId);

    // -------------------------------------------------
    // KYC (from BankDetails collection)
    // -------------------------------------------------

    let userResponse = formatUserResponse(user);

    try {
      const kyc = await getKycForUser(user);
      userResponse = withKyc(userResponse, kyc);
    } catch (kycError) {
      console.error("❌ Login KYC load error:", kycError);
    }

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("❌ Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
});

// =====================================================
// POST /api/auth/forgot-password
// =====================================================
//
// ADMIN / SUPERADMIN PASSWORD RESET
//
// Flow:
// Email → Generate OTP → Hash OTP → Save MongoDB
// → Send OTP by email
//
// =====================================================

router.post(
  "/forgot-password",
  async (req, res) => {
    try {
      if (!isMongoActive()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is currently unavailable. Please try again later.",
        });
      }

      const cleanEmail = String(
        req.body?.email || ""
      )
        .trim()
        .toLowerCase();

      // -------------------------------------------------
      // EMAIL VALIDATION
      // -------------------------------------------------

      if (!cleanEmail) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter your email address.",
        });
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid email address.",
        });
      }

      // -------------------------------------------------
      // FIND ADMIN ACCOUNT
      // -------------------------------------------------

      const user = await User.findOne({
        email: cleanEmail,
        role: {
          $in: ["admin", "superadmin"],
        },
      });

      // -------------------------------------------------
      // GENERIC RESPONSE
      // -------------------------------------------------

      const genericResponse = {
        success: true,
        message:
          "If an administrator account exists for this email, a password reset code has been sent.",
      };

      if (!user) {
        return res.json(genericResponse);
      }

      // -------------------------------------------------
      // INVALIDATE PREVIOUS RESET CODES
      // -------------------------------------------------

      await LoginCode.updateMany(
        {
          userId: user._id,
          purpose: "password_reset",
          used: false,
        },
        {
          $set: {
            used: true,
            usedAt: new Date(),
          },
        }
      );

      // -------------------------------------------------
      // GENERATE OTP
      // -------------------------------------------------

      const resetCode =
        generatePasswordResetCode();

      // -------------------------------------------------
      // HASH OTP
      // -------------------------------------------------

      const codeHash = await bcrypt.hash(
        resetCode,
        10
      );

      // -------------------------------------------------
      // EXPIRY
      // -------------------------------------------------

      const expiresAt = new Date(
        Date.now() +
          PASSWORD_RESET_CODE_EXPIRY_MINUTES *
            60 *
            1000
      );

      // -------------------------------------------------
      // SAVE RESET CODE
      // -------------------------------------------------

      const resetCodeRecord =
        await LoginCode.create({
          userId: user._id,
          email: cleanEmail,
          codeHash,
          purpose: "password_reset",
          expiresAt,
          attempts: 0,
          used: false,
        });

      // -------------------------------------------------
      // SEND EMAIL
      // -------------------------------------------------

      try {
        await sendPasswordResetCodeEmail({
          email: cleanEmail,
          name:
            user.name || "Administrator",
          resetCode,
        });
      } catch (mailError) {
        console.error(
          "❌ Password reset email error:",
          mailError.message
        );

        await LoginCode.deleteOne({
          _id: resetCodeRecord._id,
        });

        return res.status(500).json({
          success: false,
          message:
            "Unable to send password reset code. Please check the email server configuration.",
        });
      }

      console.log(
        `📧 Password reset code sent to ${cleanEmail}`
      );

      return res.json(genericResponse);
    } catch (error) {
      console.error(
        "❌ Forgot password error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while requesting password reset.",
      });
    }
  }
);

// =====================================================
// POST /api/auth/reset-password
// =====================================================
//
// OTP + NEW PASSWORD
//
// =====================================================

router.post(
  "/reset-password",
  async (req, res) => {
    try {
      if (!isMongoActive()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is currently unavailable. Please try again later.",
        });
      }

      const cleanEmail = String(
        req.body?.email || ""
      )
        .trim()
        .toLowerCase();

      const resetCode = String(
        req.body?.otp || ""
      ).trim();

      const newPassword = String(
        req.body?.newPassword || ""
      );

      // -------------------------------------------------
      // VALIDATION
      // -------------------------------------------------

      if (
        !cleanEmail ||
        !resetCode ||
        !newPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email, reset code and new password are required.",
        });
      }

      if (!/^\d{6}$/.test(resetCode)) {
        return res.status(400).json({
          success: false,
          message:
            "Reset code must contain exactly 6 digits.",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "New password must contain at least 6 characters.",
        });
      }

      // -------------------------------------------------
      // FIND ADMIN
      // -------------------------------------------------

      const user = await User.findOne({
        email: cleanEmail,
        role: {
          $in: ["admin", "superadmin"],
        },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid or expired reset code.",
        });
      }

      // -------------------------------------------------
      // FIND ACTIVE RESET CODE
      // -------------------------------------------------

      const resetCodeRecord =
        await LoginCode.findOne({
          userId: user._id,
          email: cleanEmail,
          purpose: "password_reset",
          used: false,
          expiresAt: {
            $gt: new Date(),
          },
        }).sort({
          createdAt: -1,
        });

      if (!resetCodeRecord) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid or expired reset code.",
        });
      }

      // -------------------------------------------------
      // MAX ATTEMPTS
      // -------------------------------------------------

      if (
        Number(resetCodeRecord.attempts || 0) >=
        PASSWORD_RESET_MAX_ATTEMPTS
      ) {
        resetCodeRecord.used = true;
        resetCodeRecord.usedAt = new Date();

        await resetCodeRecord.save();

        return res.status(400).json({
          success: false,
          message:
            "Too many incorrect attempts. Please request a new reset code.",
        });
      }

      // -------------------------------------------------
      // VERIFY OTP
      // -------------------------------------------------

      const codeMatches = await bcrypt.compare(
        resetCode,
        resetCodeRecord.codeHash
      );

      if (!codeMatches) {
        resetCodeRecord.attempts =
          Number(
            resetCodeRecord.attempts || 0
          ) + 1;

        if (
          resetCodeRecord.attempts >=
          PASSWORD_RESET_MAX_ATTEMPTS
        ) {
          resetCodeRecord.used = true;
          resetCodeRecord.usedAt = new Date();
        }

        await resetCodeRecord.save();

        const attemptsLeft = Math.max(
          0,
          PASSWORD_RESET_MAX_ATTEMPTS -
            resetCodeRecord.attempts
        );

        return res.status(400).json({
          success: false,
          message:
            attemptsLeft > 0
              ? `Invalid reset code. ${attemptsLeft} attempt(s) remaining.`
              : "Too many incorrect attempts. Please request a new reset code.",
        });
      }

      // -------------------------------------------------
      // HASH NEW PASSWORD
      // -------------------------------------------------

      const passwordHash = await bcrypt.hash(
        newPassword,
        10
      );

      user.password = passwordHash;

      await user.save();

      // -------------------------------------------------
      // MARK CODE AS USED
      // -------------------------------------------------

      resetCodeRecord.used = true;
      resetCodeRecord.usedAt = new Date();

      await resetCodeRecord.save();

      // -------------------------------------------------
      // INVALIDATE OTHER RESET CODES
      // -------------------------------------------------

      await LoginCode.updateMany(
        {
          userId: user._id,
          purpose: "password_reset",
          used: false,
        },
        {
          $set: {
            used: true,
            usedAt: new Date(),
          },
        }
      );

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      console.log(
        `🔐 Password successfully reset for ${cleanEmail}`
      );

      return res.json({
        success: true,
        message:
          "Password reset successfully. You can now login with your new password.",
      });
    } catch (error) {
      console.error(
        "❌ Reset password error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while resetting password.",
      });
    }
  }
);

// =====================================================
// POST /api/auth/register
// DISABLED
// =====================================================

router.post("/register", (req, res) => {
  return res.status(403).json({
    success: false,
    message:
      "Public registration is disabled. Please login and register new members from your dashboard.",
  });
});

// =====================================================
// GET /api/auth/referrer/:code
// PUBLIC
// =====================================================
//
// This endpoint only looks up the sponsor.
// It does NOT create an account.
//
// Sponsor must be:
// - role: user
// - status: active
//
// Both PAID and zero PIN (UNPAID) activated members can
// act as sponsors.
//
// =====================================================

router.get(
  "/referrer/:code",
  async (req, res) => {
    try {
      if (!isMongoActive()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is currently unavailable.",
        });
      }

      const code = String(
        req.params.code || ""
      )
        .trim()
        .toUpperCase();

      if (!code) {
        return res.status(404).json({
          success: false,
          message:
            "Invalid or inactive referral link.",
        });
      }

      const sponsor = await User.findOne({
        role: "user",
        status: "active",
        $or: [
          {
            memberId: code,
          },
          {
            userCode: code,
          },
        ],
      }).select("memberId name");

      if (!sponsor) {
        return res.status(404).json({
          success: false,
          message:
            "Invalid or inactive referral link.",
        });
      }

      return res.json({
        success: true,
        sponsor: {
          memberId: sponsor.memberId,
          name: sponsor.name,
        },
      });
    } catch (error) {
      console.error(
        "❌ Referrer lookup error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error.",
      });
    }
  }
);

// =====================================================
// POST /api/auth/register-by-link
// DISABLED
// =====================================================

router.post(
  "/register-by-link",
  (req, res) => {
    return res.status(403).json({
      success: false,
      message:
        "Public registration is disabled. Please login and register the new member from your dashboard.",
    });
  }
);

// =====================================================
// POST /api/auth/activate
// =====================================================
//
// Activation rules:
//
// 1. Paid PIN:
//    - Account becomes PAID and active.
//    - Sponsor receives ₹100 direct referral income when
//      the sponsor is active. The sponsor may be PAID or
//      zero PIN (UNPAID) activated.
//
// 2. Unpaid (zero) PIN:
//    - Account becomes UNPAID and active.
//    - Sponsor receives NO direct referral income.
//    - Account gets no captcha access.
//
// 3. No welcome bonus is credited.
//
// 4. Activation and direct referral income are handled
//    inside the same MongoDB transaction.
//
// 5. Binary income is processed after activation commits.
//
// =====================================================

router.post("/activate", async (req, res) => {
  try {
    if (!isMongoActive()) {
      return res.status(503).json({
        success: false,
        message:
          "Database is currently unavailable. Please try again later.",
      });
    }

    const identifier = String(
      req.body?.identifier ||
        req.body?.memberId ||
        req.body?.email ||
        ""
    ).trim();

    const pin = String(req.body?.pin || "").trim();

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!identifier || !pin) {
      return res.status(400).json({
        success: false,
        message:
          "Member ID / Email and Activation PIN are required.",
      });
    }

    if (!/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: "Activation PIN must be 6 digits.",
      });
    }

    // -------------------------------------------------
    // FIND CUSTOMER
    // -------------------------------------------------

    const user = identifier.includes("@")
      ? await User.findOne({
          email: identifier.toLowerCase(),
        })
      : await User.findOne({
          $or: [
            {
              memberId: identifier.toUpperCase(),
            },
            {
              userCode: identifier.toUpperCase(),
            },
          ],
        });

    if (!user || user.role !== "user") {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    // -------------------------------------------------
    // CHECK ACCOUNT STATUS
    // -------------------------------------------------

    if (user.status === "active") {
      return res.status(400).json({
        success: false,
        message: "Account is already active.",
      });
    }

    if (user.status !== "inactive") {
      return res.status(403).json({
        success: false,
        message:
          "This account cannot be activated. Please contact admin.",
      });
    }

    // -------------------------------------------------
    // FIND LATEST UNUSED PIN
    // -------------------------------------------------

    const pinRecord = await ActivationPin.findOne({
      userId: user._id,
      used: false,
    }).sort({
      createdAt: -1,
    });

    if (!pinRecord) {
      return res.status(404).json({
        success: false,
        message:
          "Activation PIN not found. Please contact admin.",
      });
    }

    // -------------------------------------------------
    // CHECK EXPIRY
    // -------------------------------------------------

    if (pinRecord.isExpired()) {
      return res.status(400).json({
        success: false,
        message:
          "PIN expired. Please ask admin to send a new PIN.",
      });
    }

    // -------------------------------------------------
    // CHECK PIN LOCK
    // -------------------------------------------------

    if (pinRecord.isLocked()) {
      return res.status(429).json({
        success: false,
        message:
          "Too many attempts. Please ask admin to send a new PIN.",
      });
    }

    // -------------------------------------------------
    // VERIFY PIN
    // -------------------------------------------------

    const pinMatches = await bcrypt.compare(
      pin,
      pinRecord.pinHash
    );

    if (!pinMatches) {
      const now = new Date();

      const updated = await ActivationPin.findOneAndUpdate(
        {
          _id: pinRecord._id,
          used: false,
          expiresAt: {
            $gt: now,
          },
          attempts: {
            $lt: ACTIVATION_PIN_MAX_ATTEMPTS,
          },
        },
        {
          $inc: {
            attempts: 1,
          },
        },
        {
          new: true,
        }
      );

      const currentAttempts = Number(
        updated?.attempts ?? pinRecord.attempts ?? 0
      );

      const remaining = Math.max(
        0,
        ACTIVATION_PIN_MAX_ATTEMPTS - currentAttempts
      );

      return res.status(400).json({
        success: false,
        message:
          remaining > 0
            ? `Invalid PIN. ${remaining} attempt(s) remaining.`
            : "Too many attempts. Please ask admin to send a new PIN.",
      });
    }

    // -------------------------------------------------
    // ACTIVATE ACCOUNT
    // MONGODB TRANSACTION
    // -------------------------------------------------

    const session = await mongoose.startSession();

    let alreadyUsed = false;
    let activatedUser = null;
    let directReferralIncomeProcessed = false;

    try {
      await session.withTransaction(async () => {
        // Reset values if the transaction callback retries.
        alreadyUsed = false;
        activatedUser = null;
        directReferralIncomeProcessed = false;

        // -----------------------------------------------
        // MARK PIN AS USED ATOMICALLY
        // -----------------------------------------------

        const consumed =
          await ActivationPin.findOneAndUpdate(
            {
              _id: pinRecord._id,
              used: false,
              expiresAt: {
                $gt: new Date(),
              },
              attempts: {
                $lt: ACTIVATION_PIN_MAX_ATTEMPTS,
              },
            },
            {
              $set: {
                used: true,
                usedAt: new Date(),
              },
            },
            {
              new: true,
              session,
            }
          );

        if (!consumed) {
          alreadyUsed = true;
          return;
        }

        const pinType = String(consumed.pinType || "")
          .trim()
          .toLowerCase();

        if (!["paid", "unpaid"].includes(pinType)) {
          throw new Error("INVALID_PIN_TYPE");
        }

        const activatedWithPaidPin = pinType === "paid";

        // -----------------------------------------------
        // ACTIVATE USER
        // -----------------------------------------------

        activatedUser = await User.findOneAndUpdate(
          {
            _id: user._id,
            status: "inactive",
          },
          {
            $set: {
              status: "active",
              activationDate: new Date(),
              userType: activatedWithPaidPin
                ? "PAID"
                : "UNPAID",
            },
          },
          {
            new: true,
            session,
          }
        );

        if (!activatedUser) {
          alreadyUsed = true;
          throw new Error("ALREADY_ACTIVATED");
        }

        // -----------------------------------------------
        // DIRECT REFERRAL INCOME (₹100)
        //
        // Paid PIN   -> sponsor may get ₹100.
        // Unpaid PIN -> no direct referral income.
        //
        // Sponsor must exist and be active. The sponsor
        // may be PAID or zero PIN (UNPAID) activated.
        // Any failure here aborts the whole transaction.
        // -----------------------------------------------

        if (activatedWithPaidPin && activatedUser.sponsorId) {
          const sponsor = await User.findById(
            activatedUser.sponsorId
          )
            .select("_id status userType")
            .session(session);

          const sponsorIsActive =
            String(sponsor?.status || "").toLowerCase() ===
            "active";

          if (sponsor && sponsorIsActive) {
            const referralResult =
              await processDirectReferralIncome({
                sponsorId: sponsor._id,
                referredUserId: activatedUser._id,
                session,
              });

            if (!referralResult?.success) {
              throw new Error(
                referralResult?.message ||
                  "Direct referral income processing failed."
              );
            }

            directReferralIncomeProcessed = true;
          }
        }

        // -----------------------------------------------
        // SPONSOR ACTIVE COUNTS
        //
        // These count updates happen for either PIN type.
        // They do not credit referral income.
        // -----------------------------------------------

        if (activatedUser.sponsorId) {
          await User.updateOne(
            {
              _id: activatedUser.sponsorId,
            },
            {
              $inc: {
                activeReferral: 1,
                activeTeam: 1,
              },
            },
            {
              session,
            }
          );
        }

        // -----------------------------------------------
        // NO WELCOME BONUS
        // -----------------------------------------------
      });
    } catch (txError) {
      if (txError?.message === "ALREADY_ACTIVATED") {
        return res.status(400).json({
          success: false,
          message: "Account is already active.",
        });
      }

      throw txError;
    } finally {
      await session.endSession();
    }

    // -------------------------------------------------
    // PIN WAS ALREADY CONSUMED
    // -------------------------------------------------

    if (alreadyUsed || !activatedUser) {
      return res.status(400).json({
        success: false,
        message:
          "This PIN has already been used or the account has already been activated.",
      });
    }

    // -------------------------------------------------
    // BINARY INCOME TRIGGER
    //
    // Runs after activation transaction commits.
    // Existing ₹450 binary pair calculation is unchanged.
    // -------------------------------------------------

    let binaryIncomeResult = {
      processedAncestors: [],
      totalPaid: 0,
    };

    try {
      binaryIncomeResult =
        await processBinaryIncomeForAncestors(
          activatedUser
        );
    } catch (binaryError) {
      console.error(
        "Binary income trigger error:",
        binaryError
      );

      // Activation has already succeeded.
      // Do not reject activation due to a binary processing error.
    }

    // -------------------------------------------------
    // 2 DIRECT RULE: SPONSOR BINARY TRIGGER
    //
    // The sponsor may have just reached 2 qualified
    // directs, which unlocks his pending binary pairs.
    // The sponsor is not always a binary ancestor of the
    // activated member (spillover), so process him here.
    // Safe to repeat: pairs are idempotent.
    // -------------------------------------------------

    try {
      if (
        activatedUser.sponsorId &&
        String(activatedUser.userType || "").toUpperCase() ===
          "PAID"
      ) {
        const sponsorBinaryResult =
          await processCompletedBinaryPairIncome({
            parentId: activatedUser.sponsorId,
          });

        binaryIncomeResult = {
          processedAncestors:
            binaryIncomeResult.processedAncestors || [],
          totalPaid:
            Number(binaryIncomeResult.totalPaid || 0) +
            Number(sponsorBinaryResult?.totalPaid || 0),
        };
      }
    } catch (sponsorBinaryError) {
      console.error(
        "Sponsor binary trigger error:",
        sponsorBinaryError
      );
    }

    // -------------------------------------------------
    // DEVICE BINDING: the browser that verified the PIN
    // becomes the first trusted device (best effort).
    // -------------------------------------------------

    let deviceRegistered = false;

    try {
      if (req.body?.deviceProof) {
        const proofResult = verifyDeviceProof({
          proof: req.body.deviceProof,
          purpose: "activate",
          identifier,
        });

        if (proofResult.ok) {
          const existing = await getActiveDevice(
            activatedUser._id
          );

          if (!existing) {
            const registered = await registerFirstDevice({
              user: activatedUser,
              proofResult,
              req,
              via: "activation",
            });

            deviceRegistered =
              registered?.deviceId === proofResult.deviceId;
          }
        }
      }
    } catch (deviceError) {
      console.error("Activation device binding error:", deviceError);
      // Activation already succeeded; first login will bind.
    }

    // -------------------------------------------------
    // SUCCESS
    // -------------------------------------------------

    return res.json({
      success: true,
      deviceRegistered,
      message:
        "Account activated successfully. You can now login.",
      memberId: activatedUser.memberId,
      userType: activatedUser.userType,
      directReferralIncomeProcessed,
      binaryIncomeProcessed:
        binaryIncomeResult.processedAncestors.length,
      binaryIncomePaid: Number(
        binaryIncomeResult.totalPaid || 0
      ),
    });
  } catch (error) {
    console.error("Activation error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during activation.",
    });
  }
});

// =====================================================
// GET /api/auth/me
// =====================================================

router.get(
  "/me",
  authenticateToken,
  async (req, res) => {
    try {
      if (!isMongoActive()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is currently unavailable.",
        });
      }

      // -------------------------------------------------
      // VALIDATE USER ID
      // -------------------------------------------------

      if (
        !req.user?.id ||
        !mongoose.Types.ObjectId.isValid(
          req.user.id
        )
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid user session.",
        });
      }

      // -------------------------------------------------
      // FIND USER
      // -------------------------------------------------

      const user =
        await User.findById(
          req.user.id
        ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User session not found.",
        });
      }

      // -------------------------------------------------
      // CHECK STATUS
      // -------------------------------------------------

      if (
        String(user.status || "active")
          .toLowerCase() !== "active"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account is inactive. Please contact admin.",
        });
      }

      // -------------------------------------------------
      // FIND WALLET
      // -------------------------------------------------

      let wallet =
        await Wallet.findOne({
          userId: user._id,
        });

      // -------------------------------------------------
      // CREATE WALLET IF MISSING
      // -------------------------------------------------

      if (!wallet) {
        wallet =
          await Wallet.create({
            userId: user._id,
            memberId: user.memberId,
            currentBalance: 0,
            totalEarnings: 0,
            captchaEarnings: 0,
            referralCommissions: 0,
            totalWithdrawn: 0,
            todayCaptchasSolved: 0,
            lastCaptchaDate:
              new Date().toISOString(),
          });
      }

      // -------------------------------------------------
      // KYC (from BankDetails collection)
      // -------------------------------------------------

      let userResponse = formatUserResponse(user);

      try {
        const kyc = await getKycForUser(user);
        userResponse = withKyc(userResponse, kyc);
      } catch (kycError) {
        console.error("❌ /me KYC load error:", kycError);
      }

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.json({
        success: true,
        user: userResponse,
        wallet: wallet.toObject(),
      });
    } catch (error) {
      console.error(
        "❌ Get current user error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch user session.",
      });
    }
  }
);

// =====================================================
// GET /api/auth/kyc
// =====================================================
//
// Returns the logged-in member's PAN + bank / UPI details
// from the BankDetails collection.
//
// =====================================================

router.get(
  "/kyc",
  authenticateToken,
  async (req, res) => {
    try {
      if (!isMongoActive()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is currently unavailable.",
        });
      }

      if (
        !req.user?.id ||
        !mongoose.Types.ObjectId.isValid(
          req.user.id
        )
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid user session.",
        });
      }

      const user = await User.findById(
        req.user.id
      ).select(
        "name memberId userCode panNumber panVerified bankDetails"
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const kyc = await getKycForUser(user);

      return res.json({
        success: true,
        kyc,
      });
    } catch (error) {
      console.error("❌ KYC fetch error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch KYC.",
      });
    }
  }
);

// =====================================================
// PUT /api/auth/kyc
// =====================================================
//
// Saves PAN + bank / UPI details for the logged-in member.
//
// - Every field is validated here (the frontend checks
//   are only for convenience).
// - Data is saved in the BankDetails collection
//   (one record per user, upsert).
// - The same values are mirrored on the User document
//   with $set, so older code that reads user.bankDetails
//   / user.panNumber keeps working.
// - A verified PAN cannot be changed by the member.
// - panVerified is never read from the request body.
//
// =====================================================

router.put(
  "/kyc",
  authenticateToken,
  async (req, res) => {
    try {
      if (!isMongoActive()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is currently unavailable.",
        });
      }

      // -------------------------------------------------
      // VALIDATE USER ID
      // -------------------------------------------------

      if (
        !req.user?.id ||
        !mongoose.Types.ObjectId.isValid(
          req.user.id
        )
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid user session.",
        });
      }

      const body = req.body || {};

      // undefined = field was not sent (keep old value)
      const clean = (value) =>
        value === undefined || value === null
          ? undefined
          : String(value).trim();

      const pan = clean(body.panNumber)?.toUpperCase();
      const holder = clean(body.accountHolderName);
      const accountNumber = clean(body.accountNumber);
      const ifsc = clean(body.ifscCode)?.toUpperCase();
      const bank = clean(body.bankName);
      const upi = clean(body.upiId)?.toLowerCase();

      const fail = (message) =>
        res.status(400).json({
          success: false,
          message,
        });

      // -------------------------------------------------
      // VALIDATION
      // -------------------------------------------------

      if (pan && !PAN_REGEX.test(pan)) {
        return fail(
          "Invalid PAN format. It should look like ABCDE1234F."
        );
      }

      if (
        accountNumber &&
        !ACCOUNT_REGEX.test(accountNumber)
      ) {
        return fail(
          "Account number must be 6 to 18 digits."
        );
      }

      if (ifsc && !IFSC_REGEX.test(ifsc)) {
        return fail(
          "Invalid IFSC code. It should look like SBIN0001234."
        );
      }

      if (upi && !UPI_REGEX.test(upi)) {
        return fail(
          "Invalid UPI ID. It should look like username@bank."
        );
      }

      if (holder && holder.length > KYC_TEXT_MAX_LENGTH) {
        return fail("Account holder name is too long.");
      }

      if (bank && bank.length > KYC_TEXT_MAX_LENGTH) {
        return fail("Bank name is too long.");
      }

      // -------------------------------------------------
      // FIND USER (only the fields we need)
      // -------------------------------------------------

      const user = await User.findById(
        req.user.id
      ).select(
        "name memberId userCode panNumber panVerified bankDetails"
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const memberId = String(
        user.memberId || user.userCode || ""
      )
        .trim()
        .toUpperCase();

      if (!memberId) {
        return res.status(400).json({
          success: false,
          message:
            "Member ID not found for this account. Please contact admin.",
        });
      }

      // -------------------------------------------------
      // CURRENT KYC (BankDetails record, or old User data)
      // -------------------------------------------------

      const current = await getKycForUser(user);

      // PAN fields to save (only when changed)
      const panUpdate = {};

      // -------------------------------------------------
      // PAN
      // -------------------------------------------------

      if (pan) {
        const panChanged = pan !== (current.panNumber || "");

        if (
          panChanged &&
          current.panVerified &&
          current.panNumber
        ) {
          return fail(
            "Your PAN is already verified and cannot be changed. Please contact admin."
          );
        }

        if (panChanged) {
          panUpdate.panNumber = pan;
          panUpdate.panVerified = PAN_AUTO_VERIFY;
        }
      }

      // -------------------------------------------------
      // BANK DETAILS
      // Fields that were not sent keep their old value.
      // -------------------------------------------------

      const existingBank = current.bankDetails || {};

      const bankDetails = {
        accountHolderName:
          holder !== undefined
            ? holder
            : existingBank.accountHolderName ||
              user.name ||
              "",

        accountNumber:
          accountNumber !== undefined
            ? accountNumber
            : existingBank.accountNumber || "",

        ifscCode:
          ifsc !== undefined
            ? ifsc
            : existingBank.ifscCode || "",

        bankName:
          bank !== undefined
            ? bank
            : existingBank.bankName || "",

        upiId:
          upi !== undefined
            ? upi
            : existingBank.upiId || "",
      };

      // If any bank field is present, the full set is required.
      const hasAnyBankField = Boolean(
        bankDetails.accountNumber ||
          bankDetails.ifscCode ||
          bankDetails.bankName
      );

      if (
        hasAnyBankField &&
        (!bankDetails.accountHolderName ||
          !bankDetails.accountNumber ||
          !bankDetails.ifscCode ||
          !bankDetails.bankName)
      ) {
        return fail(
          "Please provide account holder name, bank name, account number and IFSC code together."
        );
      }

      // -------------------------------------------------
      // SAVE 1: BankDetails collection (upsert)
      // -------------------------------------------------

      const bankDetailsSet = {
        memberId,
        accountHolderName: bankDetails.accountHolderName,
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        bankName: bankDetails.bankName,
        upiId: bankDetails.upiId,
        ...panUpdate,
      };

      // Old members: copy existing PAN into the new record
      // the first time, so it is not lost.
      const setOnInsert = {
        userId: user._id,
      };

      if (panUpdate.panNumber === undefined) {
        setOnInsert.panNumber = current.panNumber || "";
        setOnInsert.panVerified = Boolean(
          current.panVerified
        );
      }

      const savedKyc = await BankDetails.findOneAndUpdate(
        {
          userId: user._id,
        },
        {
          $set: bankDetailsSet,
          $setOnInsert: setOnInsert,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      // -------------------------------------------------
      // SAVE 2: mirror on User document (compatibility)
      // -------------------------------------------------

      const userUpdate = {
        bankDetails,
      };

      if (panUpdate.panNumber !== undefined) {
        userUpdate.panNumber = panUpdate.panNumber;
        userUpdate.panVerified = panUpdate.panVerified;
      }

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $set: userUpdate,
        },
        {
          new: true,
          runValidators: true,
        }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      console.log(
        `🏦 KYC updated for ${memberId} at ${new Date().toISOString()}`
      );

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      const kycResponse = {
        panNumber: savedKyc.panNumber || "",
        panVerified: Boolean(savedKyc.panVerified),
        bankDetails: {
          accountHolderName: savedKyc.accountHolderName || "",
          accountNumber: savedKyc.accountNumber || "",
          ifscCode: savedKyc.ifscCode || "",
          bankName: savedKyc.bankName || "",
          upiId: savedKyc.upiId || "",
        },
      };

      return res.json({
        success: true,
        message:
          "KYC and Bank details updated successfully!",
        user: withKyc(
          formatUserResponse(updatedUser),
          kycResponse
        ),
        kyc: kycResponse,
      });
    } catch (error) {
      console.error(
        "❌ KYC update error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update KYC.",
      });
    }
  }
);

// =====================================================
// EXPORT
// =====================================================

export default router;