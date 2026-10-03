
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import crypto from "crypto";

import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
import { LoginCode } from "../models/LoginCode.js";
import { authenticateToken } from "../middleware/auth.js";
import { sendPasswordResetCodeEmail } from "../utils/mailer.js";
import { autoPlaceUser, syncBinaryTeamCounts } from "../utils/binaryTree.js";

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

const createToken = (user) => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: String(user._id),

      memberId:
        user.memberId ||
        user.userCode ||
        "",

      userCode:
        user.userCode ||
        user.memberId ||
        "",

      role:
        user.role ||
        "user",

      name:
        user.name ||
        "",
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
  return String(
    crypto.randomInt(100000, 1000000)
  );
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

    const {
      loginId,
      password,
    } = req.body;

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

    const user =
      await findUserByLoginId(cleanId);

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
      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive. Please contact admin.",
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

    const passwordMatch =
      await bcrypt.compare(
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
    // CREATE JWT
    // -------------------------------------------------

    const token =
      createToken(user);

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.json({
      success: true,

      message:
        "Login successful.",

      token,

      user:
        formatUserResponse(user),
    });
  } catch (error) {
    console.error(
      "❌ Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error during login.",
    });
  }
});

// =====================================================
// POST /api/auth/forgot-password
// =====================================================
// ADMIN / SUPERADMIN PASSWORD RESET
//
// Flow:
// Email → Generate OTP → Hash OTP → Save MongoDB
// → Send OTP by email
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

      const cleanEmail =
        String(req.body?.email || "")
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

      const user =
        await User.findOne({
          email: cleanEmail,
          role: {
            $in: [
              "admin",
              "superadmin",
            ],
          },
        });

      // -------------------------------------------------
      // GENERIC RESPONSE
      // -------------------------------------------------
      //
      // We don't reveal whether an email belongs
      // to an administrator account.
      // This prevents email/account enumeration.
      // -------------------------------------------------

      const genericResponse = {
        success: true,
        message:
          "If an administrator account exists for this email, a password reset code has been sent.",
      };

      if (!user) {
        return res.json(
          genericResponse
        );
      }

      // -------------------------------------------------
      // INVALIDATE PREVIOUS RESET CODES
      // -------------------------------------------------

      await LoginCode.updateMany(
        {
          userId: user._id,

          purpose:
            "password_reset",

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

      const codeHash =
        await bcrypt.hash(
          resetCode,
          10
        );

      // -------------------------------------------------
      // EXPIRY
      // -------------------------------------------------

      const expiresAt =
        new Date(
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
          userId:
            user._id,

          email:
            cleanEmail,

          codeHash,

          purpose:
            "password_reset",

          expiresAt,

          attempts:
            0,

          used:
            false,
        });

      // -------------------------------------------------
      // SEND EMAIL
      // -------------------------------------------------

      try {
        await sendPasswordResetCodeEmail({
          email:
            cleanEmail,

          name:
            user.name ||
            "Administrator",

          resetCode,
        });
      } catch (mailError) {
        console.error(
          "❌ Password reset email error:",
          mailError.message
        );

        // Remove the unusable reset code
        await LoginCode.deleteOne({
          _id:
            resetCodeRecord._id,
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

      return res.json(
        genericResponse
      );
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
// OTP + NEW PASSWORD
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

      const cleanEmail =
        String(req.body?.email || "")
          .trim()
          .toLowerCase();

      const resetCode =
        String(req.body?.otp || "").trim();

      const newPassword =
        String(
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

      const user =
        await User.findOne({
          email:
            cleanEmail,

          role: {
            $in: [
              "admin",
              "superadmin",
            ],
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
          userId:
            user._id,

          email:
            cleanEmail,

          purpose:
            "password_reset",

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
        Number(
          resetCodeRecord.attempts || 0
        ) >=
        PASSWORD_RESET_MAX_ATTEMPTS
      ) {
        resetCodeRecord.used =
          true;

        resetCodeRecord.usedAt =
          new Date();

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

      const codeMatches =
        await bcrypt.compare(
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
          resetCodeRecord.used =
            true;

          resetCodeRecord.usedAt =
            new Date();
        }

        await resetCodeRecord.save();

        const attemptsLeft =
          Math.max(
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

      const passwordHash =
        await bcrypt.hash(
          newPassword,
          10
        );

      user.password =
        passwordHash;

      await user.save();

      // -------------------------------------------------
      // MARK CODE AS USED
      // -------------------------------------------------

      resetCodeRecord.used =
        true;

      resetCodeRecord.usedAt =
        new Date();

      await resetCodeRecord.save();

      // -------------------------------------------------
      // INVALIDATE ANY OTHER RESET CODES
      // -------------------------------------------------

      await LoginCode.updateMany(
        {
          userId:
            user._id,

          purpose:
            "password_reset",

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
// =====================================================
//
// CUSTOMER REGISTRATION FLOW
//
// 1. Customer enters Referral / Upline ID
// 2. Backend finds active USER sponsor
// 3. New customer account is created
// 4. Customer is automatically placed in Binary Tree
// 5. Sponsor referral/team counters are updated
// 6. ₹50 welcome wallet is created
// 7. JWT token returned
//
// Superadmin/Admin is NOT required for normal registration.
//
// =====================================================

router.post("/register", async (req, res) => {
  try {
    // -------------------------------------------------
    // CHECK MONGODB
    // -------------------------------------------------

    if (!isMongoActive()) {
      return res.status(503).json({
        success: false,
        message:
          "Database is currently unavailable. Please try again later.",
      });
    }

    const {
      name,
      email,
      phone,
      password,
      sponsorCode,
    } = req.body;

    // -------------------------------------------------
    // REQUIRED FIELD VALIDATION
    // -------------------------------------------------

    if (
      !name ||
      !email ||
      !phone ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone, password and Referral/Upline ID are required.",
      });
    }

    // -------------------------------------------------
    // CLEAN INPUT
    // -------------------------------------------------

    const cleanName = String(name).trim();

    const cleanEmail = String(email)
      .trim()
      .toLowerCase();

    const cleanPhone = String(phone).trim();

    const cleanPassword = String(password);

    const cleanSponsorCode = String(
      sponsorCode || ""
    )
      .trim()
      .toUpperCase();

    // -------------------------------------------------
    // BASIC VALIDATION
    // -------------------------------------------------

    if (cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Name must contain at least 2 characters.",
      });
    }

    if (cleanEmail.length < 5) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid email address.",
      });
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid email address.",
      });
    }

    if (cleanPhone.length < 5) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid phone number.",
      });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 6 characters.",
      });
    }

    // -------------------------------------------------
    // REFERRAL / UPLINE IS REQUIRED
    // -------------------------------------------------

    if (!cleanSponsorCode) {
      return res.status(400).json({
        success: false,
        message:
          "Referral / Upline ID is required for registration.",
      });
    }

    // -------------------------------------------------
    // DUPLICATE EMAIL
    // -------------------------------------------------

    const existingEmail = await User.findOne({
      email: cleanEmail,
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Email already registered.",
      });
    }

    // -------------------------------------------------
    // DUPLICATE PHONE
    // -------------------------------------------------

    const existingPhone = await User.findOne({
      phone: cleanPhone,
    });

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number already registered.",
      });
    }

    // -------------------------------------------------
    // FIND SPONSOR / UPLINE
    // -------------------------------------------------
    //
    // Referral ID can be:
    // - Member ID
    // - User Code
    //
    // Only ACTIVE USER accounts can become sponsors.
    // Admin/Superadmin cannot be used as normal
    // customer upline.
    //
    // -------------------------------------------------

    const sponsor = await User.findOne({
      role: "user",
      status: "active",
      $or: [
        {
          memberId: cleanSponsorCode,
        },
        {
          userCode: cleanSponsorCode,
        },
      ],
    });

    if (!sponsor) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid Referral / Upline ID. Please enter a valid active member ID.",
      });
    }

    // -------------------------------------------------
    // PASSWORD HASH
    // -------------------------------------------------

    const passwordHash = await bcrypt.hash(
      cleanPassword,
      10
    );

    // -------------------------------------------------
    // GENERATE UNIQUE MEMBER ID
    // -------------------------------------------------

    let memberCode = "";
    let attempts = 0;

    while (
      !memberCode &&
      attempts < 20
    ) {
      attempts++;

      const randomNumber =
        Math.floor(
          100000 +
            Math.random() * 900000
        );

      const candidate = `SI${randomNumber}`;

      const existing =
        await User.findOne({
          $or: [
            {
              memberId: candidate,
            },
            {
              userCode: candidate,
            },
          ],
        });

      if (!existing) {
        memberCode = candidate;
      }
    }

    if (!memberCode) {
      return res.status(500).json({
        success: false,
        message:
          "Unable to generate a unique member ID. Please try again.",
      });
    }

    // -------------------------------------------------
    // CREATE USER
    // -------------------------------------------------
    //
    // Referral tree information is stored immediately.
    //
    // Binary placement is done automatically AFTER
    // saving the user.
    //
    // -------------------------------------------------

    const newUser = new User({
      memberId: memberCode,

      userCode: memberCode,

      name: cleanName,

      email: cleanEmail,

      phone: cleanPhone,

      password: passwordHash,

      role: "user",

      status: "active",

      // -------------------------------
      // REFERRAL / SPONSOR
      // -------------------------------

      sponsorId: sponsor._id,

      sponsorCode:
        sponsor.userCode ||
        sponsor.memberId ||
        "",

      sponsorMemberId:
        sponsor.memberId || "",

      treePath:
        `${sponsor.treePath || "/"}/${memberCode}/`,

      level:
        Number(sponsor.level || 1) + 1,

      position: "left",

      // -------------------------------
      // BINARY DEFAULTS
      // -------------------------------

      binaryParentId: null,

      binaryPosition: null,

      binaryLeftId: null,

      binaryRightId: null,

      binaryLevel: 1,

      binaryPath: "/",

      // -------------------------------
      // USER TYPE / PACKAGE
      // -------------------------------

      userType: "UNPAID",

      activationDate: null,

      joiningPackage: "",

      rank: "Distributor",

      // -------------------------------
      // REFERRAL COUNTS
      // -------------------------------

      directReferralsCount: 0,

      teamCount: 0,

      totalReferral: 0,

      activeReferral: 0,

      // -------------------------------
      // TEAM COUNTS
      // -------------------------------

      leftCount: 0,

      rightCount: 0,

      leftBusiness: 0,

      rightBusiness: 0,

      totalTeam: 0,

      activeTeam: 0,

      teamPercent: 0,

      // -------------------------------
      // PV
      // -------------------------------

      leftPv: 0,

      rightPv: 0,

      leftCarryForwardPv: 0,

      rightCarryForwardPv: 0,

      // -------------------------------
      // INCOME
      // -------------------------------

      matchingIncome: 0,

      todayMatchingIncome: 0,

      franchiseReferralIncome: 0,

      franchiseMatchingIncome: 0,

      totalIncome: 0,

      // -------------------------------
      // KYC
      // -------------------------------

      panNumber: "",

      panVerified: false,

      bankDetails: {
        accountHolderName: cleanName,
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        upiId: "",
      },

      dateOfEntry: new Date(),
    });

    // -------------------------------------------------
    // SAVE USER FIRST
    // -------------------------------------------------

    await newUser.save();

    // -------------------------------------------------
    // AUTOMATIC BINARY PLACEMENT
    // -------------------------------------------------
    //
    // Sponsor is used as the starting placement point.
    //
    // The backend automatically finds:
    //
    // Sponsor Left
    //       ↓
    // Sponsor Right
    //       ↓
    // Next available slot
    //
    // So frontend does NOT need to manually decide
    // where the customer goes.
    //
    // -------------------------------------------------

    try {
      await autoPlaceUser(
        newUser._id,
        sponsor._id
      );
    } catch (binaryError) {
      console.error(
        "❌ Binary placement error:",
        binaryError
      );

      // User was created but could not be placed.
      // Remove incomplete registration.
      await User.deleteOne({
        _id: newUser._id,
      });

      return res.status(500).json({
        success: false,
        message:
          "Account could not be placed in the Binary Tree. Registration was cancelled.",
      });
    }

    // -------------------------------------------------
    // GET UPDATED USER AFTER BINARY PLACEMENT
    // -------------------------------------------------

    const placedUser =
      await User.findById(
        newUser._id
      );

    if (!placedUser) {
      return res.status(500).json({
        success: false,
        message:
          "Registered user could not be loaded after binary placement.",
      });
    }

    // -------------------------------------------------
    // VERIFY BINARY PLACEMENT
    // -------------------------------------------------

    if (
      !placedUser.binaryParentId ||
      !placedUser.binaryPosition
    ) {
      console.error(
        "❌ Binary placement missing after registration:",
        placedUser._id
      );

      await User.deleteOne({
        _id: placedUser._id,
      });

      return res.status(500).json({
        success: false,
        message:
          "Binary placement failed. Registration was cancelled.",
      });
    }

    // -------------------------------------------------
    // UPDATE SPONSOR REFERRAL COUNTS
    // -------------------------------------------------

    sponsor.directReferralsCount =
      Number(
        sponsor.directReferralsCount || 0
      ) + 1;

    sponsor.totalReferral =
      Number(
        sponsor.totalReferral || 0
      ) + 1;

    sponsor.activeReferral =
      Number(
        sponsor.activeReferral || 0
      ) + 1;

    // Existing application behavior
    sponsor.teamCount =
      Number(
        sponsor.teamCount || 0
      ) + 1;

    sponsor.activeTeam =
      Number(
        sponsor.activeTeam || 0
      ) + 1;

    await sponsor.save();

    // -------------------------------------------------
    // SYNC BINARY COUNTS
    // -------------------------------------------------
    //
    // This updates sponsor:
    //
    // leftCount
    // rightCount
    // totalTeam
    //
    // based on actual Binary Tree data.
    //
    // -------------------------------------------------

    try {
      await syncBinaryTeamCounts(
        sponsor._id
      );
    } catch (countError) {
      console.error(
        "⚠️ Binary count sync warning:",
        countError
      );
    }

    // -------------------------------------------------
    // CREATE ₹50 WELCOME WALLET
    // -------------------------------------------------

    const newWallet = new Wallet({
      userId: placedUser._id,

      memberId: placedUser.memberId,

      currentBalance: 50,

      totalEarnings: 50,

      captchaEarnings: 0,

      referralCommissions: 0,

      totalWithdrawn: 0,

      todayCaptchasSolved: 0,

      lastCaptchaDate:
        new Date().toISOString(),
    });

    await newWallet.save();

    // -------------------------------------------------
    // CREATE JWT
    // -------------------------------------------------

    const token =
      createToken(placedUser);

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(201).json({
      success: true,

      message:
        "Account registered successfully! ₹50 welcome bonus credited.",

      token,

      user:
        formatUserResponse(
          placedUser
        ),

      wallet: {
        currentBalance: 50,
        totalEarnings: 50,
        captchaEarnings: 0,
        referralCommissions: 0,
      },

      // ------------------------------------------------
      // BINARY PLACEMENT INFORMATION
      // ------------------------------------------------

      binaryPlacement: {
        parentId:
          placedUser.binaryParentId,

        position:
          placedUser.binaryPosition,

        level:
          placedUser.binaryLevel,

        path:
          placedUser.binaryPath,
      },

      sponsor: {
        memberId:
          sponsor.memberId,

        userCode:
          sponsor.userCode ||
          sponsor.memberId,

        name:
          sponsor.name,
      },
    });
  } catch (error) {
    console.error(
      "❌ Register error:",
      error
    );

    // -------------------------------------------------
    // MONGOOSE DUPLICATE KEY
    // -------------------------------------------------

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A user with the same email, phone, member ID or user code already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error during registration.",
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
          .toLowerCase() !==
        "active"
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
          userId:
            user._id,
        });

      // -------------------------------------------------
      // CREATE WALLET IF MISSING
      // -------------------------------------------------

      if (!wallet) {
        wallet =
          await Wallet.create({
            userId:
              user._id,

            memberId:
              user.memberId,

            currentBalance:
              0,

            totalEarnings:
              0,

            captchaEarnings:
              0,

            referralCommissions:
              0,

            totalWithdrawn:
              0,

            todayCaptchasSolved:
              0,

            lastCaptchaDate:
              new Date()
                .toISOString(),
          });
      }

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.json({
        success: true,

        user:
          formatUserResponse(
            user
          ),

        wallet:
          wallet.toObject(),
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
          message:
            "User not found.",
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

        // Existing application behavior:
        // PAN submitted = verified.
        //
        // A real PAN verification service can be
        // integrated later.
        user.panVerified =
          true;
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
            ? String(
                ifscCode
              )
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

        user:
          formatUserResponse(
            user
          ),
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

