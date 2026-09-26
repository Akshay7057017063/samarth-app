import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
import { authenticateToken } from "../middleware/auth.js";
import { store } from "../dataStore.js";

const router = express.Router();

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "samarth_jwt_secret_token_key_2026_prod";

const isMongoActive = () => {
  return mongoose.connection.readyState === 1;
};

// =====================================================
// POST /api/auth/login
// =====================================================

router.post("/login", async (req, res) => {
  try {
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

    if (!cleanId) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide Account ID / User Code / Email and Password.",
      });
    }

    let user = null;

    // =================================================
    // FIRST: LOCAL JSON DATASTORE
    // =================================================
    // Admin-created customers are stored in JSON.
    // Always check local datastore first.

    user = (store.data.users || []).find(
      (u) =>
        // Account ID
        (u._id &&
          String(u._id).toLowerCase() ===
            cleanId.toLowerCase()) ||

        // Member ID
        (u.memberId &&
          String(u.memberId).toUpperCase() ===
            cleanId.toUpperCase()) ||

        // User Code
        (u.userCode &&
          String(u.userCode).toUpperCase() ===
            cleanId.toUpperCase()) ||

        // Email
        (u.email &&
          String(u.email).toLowerCase() ===
            cleanId.toLowerCase())
    );

    // =================================================
    // SECOND: MONGODB
    // =================================================
    // If the user is not available in JSON datastore,
    // then check MongoDB when MongoDB is active.

    if (!user && isMongoActive()) {
      // -------------------------------------------------
      // Search memberId / userCode / email
      // -------------------------------------------------

      user = await User.findOne({
        $or: [
          {
            memberId: cleanId.toUpperCase(),
          },
          {
            userCode: cleanId.toUpperCase(),
          },
          {
            email: cleanId.toLowerCase(),
          },
        ],
      });

      // -------------------------------------------------
      // Search MongoDB Account ID
      // -------------------------------------------------

      if (!user) {
        try {
          user = await User.findById(cleanId);
        } catch (idError) {
          // user_downline_1 is not a Mongo ObjectId.
          // Ignore invalid ObjectId errors.
          user = null;
        }
      }
    }

    // =================================================
    // USER NOT FOUND
    // =================================================

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Account ID, User Code or Email not found.",
      });
    }

    // =================================================
    // PASSWORD CHECK
    // =================================================

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message:
          "Password is not configured for this account.",
      });
    }

    const isMatch = await bcrypt.compare(
      cleanPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password.",
      });
    }

    // =================================================
    // ACCOUNT STATUS
    // =================================================

    if (
      user.status &&
      String(user.status).toLowerCase() !== "active"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive. Please contact admin.",
      });
    }

    // =================================================
    // JWT TOKEN
    // =================================================

    const token = jwt.sign(
      {
        // Actual Account ID
        id: user._id,

        memberId:
          user.memberId ||
          user.userCode,

        userCode:
          user.userCode ||
          user.memberId,

        role:
          user.role,

        name:
          user.name,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // =================================================
    // USER RESPONSE
    // =================================================

    let userResponse;

    if (
      user &&
      typeof user.toObject === "function"
    ) {
      userResponse = user.toObject();
    } else {
      userResponse = {
        ...user,
      };
    }

    // Never send password to frontend
    delete userResponse.password;

    // =================================================
    // RESPONSE
    // =================================================

    return res.json({
      success: true,

      message:
        "Login successful.",

      token,

      user:
        userResponse,
    });
  } catch (error) {
    console.error(
      "Login error:",
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
// POST /api/auth/register
// =====================================================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      sponsorCode,
      position,
    } = req.body;

    // -------------------------------------------------
    // VALIDATION
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
          "All required fields must be filled.",
      });
    }

    const cleanName = String(name).trim();

    const cleanEmail =
      String(email)
        .trim()
        .toLowerCase();

    const cleanPhone =
      String(phone).trim();

    // =================================================
    // DUPLICATE EMAIL
    // =================================================

    const existingEmail =
      store.data.users.find(
        (user) =>
          user.email?.toLowerCase() ===
          cleanEmail
      );

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Email already registered.",
      });
    }

    // =================================================
    // DUPLICATE PHONE
    // =================================================

    const existingPhone =
      store.data.users.find(
        (user) =>
          user.phone ===
          cleanPhone
      );

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message:
          "Phone number already registered.",
      });
    }

    // =================================================
    // PASSWORD HASH
    // =================================================

    const salt =
      await bcrypt.genSalt(10);

    const passwordHash =
      await bcrypt.hash(
        password,
        salt
      );

    // =================================================
    // MEMBER CODE
    // =================================================

    let memberNumber =
      681908 +
      store.data.users.length;

    let memberCode =
      `SI${memberNumber}`;

    while (
      store.data.users.some(
        (user) =>
          user.memberId ===
            memberCode ||
          user.userCode ===
            memberCode
      )
    ) {
      memberNumber++;

      memberCode =
        `SI${memberNumber}`;
    }

    // =================================================
    // SPONSOR
    // =================================================

    const sponsor =
      sponsorCode
        ? String(sponsorCode)
            .trim()
            .toUpperCase()
        : "SI107476";

    // =================================================
    // CREATE USER
    // =================================================

    const newUser = {
      _id:
        `user_${Date.now()}`,

      memberId:
        memberCode,

      userCode:
        memberCode,

      sponsorCode:
        sponsor,

      sponsorMemberId:
        sponsor,

      name:
        cleanName,

      email:
        cleanEmail,

      phone:
        cleanPhone,

      password:
        passwordHash,

      role:
        "user",

      dateOfEntry:
        new Date().toLocaleDateString(
          "en-GB"
        ),

      userType:
        "UNPAID",

      activationDate:
        "-",

      joiningPackage:
        "-",

      rank:
        "Distributor",

      position:
        position ||
        "left",

      leftCount:
        0,

      rightCount:
        0,

      leftBusiness:
        0,

      rightBusiness:
        0,

      totalReferral:
        0,

      activeReferral:
        0,

      leftPv:
        0,

      rightPv:
        0,

      leftCarryForwardPv:
        0,

      rightCarryForwardPv:
        0,

      totalTeam:
        0,

      activeTeam:
        0,

      teamPercent:
        "0%",

      matchingIncome:
        0,

      todayMatchingIncome:
        0,

      franchiseReferralIncome:
        0,

      franchiseMatchingIncome:
        0,

      totalIncome:
        0,

      panNumber:
        "",

      panVerified:
        false,

      bankDetails: {
        accountHolderName:
          cleanName,

        accountNumber:
          "",

        ifscCode:
          "",

        bankName:
          "",

        upiId:
          "",
      },

      status:
        "active",

      createdAt:
        new Date().toISOString(),
    };

    // =================================================
    // CREATE WALLET
    // =================================================

    const newWallet = {
      _id:
        `w_${Date.now()}`,

      userId:
        newUser._id,

      memberId:
        newUser.memberId,

      currentBalance:
        50,

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
          .toISOString()
          .split("T")[0],
    };

    // =================================================
    // SAVE
    // =================================================

    store.data.users.push(
      newUser
    );

    store.data.wallets.push(
      newWallet
    );

    store.save();

    // =================================================
    // CREATE TOKEN
    // =================================================

    const token = jwt.sign(
      {
        id:
          newUser._id,

        memberId:
          newUser.memberId,

        userCode:
          newUser.userCode,

        role:
          newUser.role,

        name:
          newUser.name,
      },
      JWT_SECRET,
      {
        expiresIn:
          "7d",
      }
    );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({
      success:
        true,

      message:
        "Account registered successfully! Welcome bonus ₹50 credited.",

      token,

      user: {
        ...newUser,
        password:
          undefined,
      },
    });
  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    return res.status(500).json({
      success:
        false,

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
      let user = null;
      let wallet = null;

      // =================================================
      // FIRST: LOCAL JSON DATASTORE
      // =================================================

      user =
        store.data.users.find(
          (u) =>
            u._id ===
              req.user.id ||
            u.memberId ===
              req.user.memberId ||
            u.userCode ===
              req.user.userCode
        );

      wallet =
        store.data.wallets.find(
          (w) =>
            w.userId ===
              req.user.id ||
            w.memberId ===
              req.user.memberId
        );

      // =================================================
      // SECOND: MONGODB
      // =================================================

      if (!user && isMongoActive()) {
        try {
          user =
            await User.findById(
              req.user.id
            ).select("-password");

          wallet =
            await Wallet.findOne({
              userId:
                req.user.id,
            });
        } catch (mongoError) {
          console.error(
            "MongoDB /me lookup error:",
            mongoError
          );
        }
      }

      // =================================================
      // USER NOT FOUND
      // =================================================

      if (!user) {
        return res.status(404).json({
          success:
            false,

          message:
            "User session not found.",
        });
      }

      // =================================================
      // REMOVE PASSWORD
      // =================================================

      if (user.password) {
        delete user.password;
      }

      // =================================================
      // RESPONSE
      // =================================================

      return res.json({
        success:
          true,

        user,

        wallet:
          wallet || {
            currentBalance:
              0,

            captchaEarnings:
              0,

            referralCommissions:
              0,
          },
      });
    } catch (error) {
      console.error(
        "Get current user error:",
        error
      );

      return res.status(500).json({
        success:
          false,

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
      const {
        panNumber,
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
        upiId,
      } = req.body;

      // =================================================
      // FIND USER IN LOCAL DATASTORE
      // =================================================

      const user =
        store.data.users.find(
          (u) =>
            u._id ===
              req.user.id ||
            u.memberId ===
              req.user.memberId ||
            u.userCode ===
              req.user.userCode
        );

      if (!user) {
        return res.status(404).json({
          success:
            false,

          message:
            "User not found.",
        });
      }

      // =================================================
      // PAN
      // =================================================

      if (panNumber) {
        user.panNumber =
          String(panNumber)
            .trim()
            .toUpperCase();

        user.panVerified =
          true;
      }

      // =================================================
      // BANK DETAILS
      // =================================================

      user.bankDetails = {
        accountHolderName:
          accountHolderName ||
          user.bankDetails
            ?.accountHolderName ||
          user.name,

        accountNumber:
          accountNumber ||
          user.bankDetails
            ?.accountNumber ||
          "",

        ifscCode:
          ifscCode
            ? String(ifscCode)
                .trim()
                .toUpperCase()
            : user.bankDetails
                ?.ifscCode ||
              "",

        bankName:
          bankName ||
          user.bankDetails
            ?.bankName ||
          "",

        upiId:
          upiId ||
          user.bankDetails
            ?.upiId ||
          "",
      };

      user.updatedAt =
        new Date().toISOString();

      store.save();

      // =================================================
      // RESPONSE
      // =================================================

      return res.json({
        success:
          true,

        message:
          "KYC and Bank details updated successfully!",

        user,
      });
    } catch (error) {
      console.error(
        "KYC update error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to update KYC.",
      });
    }
  }
);

export default router;