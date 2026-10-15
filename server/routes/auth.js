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
    // RESPONSE
    // -------------------------------------------------

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: formatUserResponse(user),
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
// - userType may be PAID or UNPAID.
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
//    - The sponsor can receive ₹100 direct referral income
//      when the sponsor is active, whether PAID or UNPAID.
//
// 2. Unpaid PIN:
//    - Account becomes UNPAID and active.
//    - This activation does not trigger the ₹100 direct
//      referral bonus.
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
        // Paid PIN   -> active sponsor may get ₹100.
        // Unpaid PIN -> no direct referral income.
        //
        // Sponsor eligibility does not depend on whether
        // the sponsor's own account type is PAID or UNPAID.
        // -----------------------------------------------

        if (activatedWithPaidPin && activatedUser.sponsorId) {
          const sponsor = await User.findById(
            activatedUser.sponsorId
          )
            .select("_id status")
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
      // RESPONSE
      // -------------------------------------------------

      return res.json({
        success: true,
        user: formatUserResponse(user),
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
// PUT /api/auth/kyc
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

      const {
        panNumber,
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
        upiId,
      } = req.body;

      // -------------------------------------------------
      // FIND USER
      // -------------------------------------------------

      const user =
        await User.findById(
          req.user.id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // -------------------------------------------------
      // PAN
      // -------------------------------------------------

      if (
        panNumber !== undefined &&
        panNumber !== null &&
        String(panNumber).trim()
      ) {
        user.panNumber =
          String(panNumber)
            .trim()
            .toUpperCase();

        user.panVerified = true;
      }

      // -------------------------------------------------
      // EXISTING BANK DETAILS
      // -------------------------------------------------

      const existingBank =
        user.bankDetails || {};

      user.bankDetails = {
        accountHolderName:
          accountHolderName !== undefined
            ? String(
                accountHolderName
              ).trim()
            : existingBank.accountHolderName ||
              user.name,

        accountNumber:
          accountNumber !== undefined
            ? String(
                accountNumber
              ).trim()
            : existingBank.accountNumber ||
              "",

        ifscCode:
          ifscCode !== undefined
            ? String(ifscCode)
                .trim()
                .toUpperCase()
            : existingBank.ifscCode ||
              "",

        bankName:
          bankName !== undefined
            ? String(
                bankName
              ).trim()
            : existingBank.bankName ||
              "",

        upiId:
          upiId !== undefined
            ? String(
                upiId
              ).trim()
            : existingBank.upiId ||
              "",
      };

      // -------------------------------------------------
      // SAVE
      // -------------------------------------------------

      await user.save();

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.json({
        success: true,
        message:
          "KYC and Bank details updated successfully!",
        user: formatUserResponse(user),
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