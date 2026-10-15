import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import crypto from "crypto";

import { User } from "../../models/User.js";
import { Wallet } from "../../models/Wallet.js";
import { Transaction } from "../../models/Transaction.js";
import { CaptchaAttempt } from "../../models/CaptchaAttempt.js";
import {
  ActivationPin,
  ACTIVATION_PIN_EXPIRY_HOURS,
} from "../../models/ActivationPin.js";
import {
  buildBinaryPath,
  syncBinaryTeamCounts,
} from "../../utils/binaryTree.js";
import {
  customerFilter,
  findCustomerByIdentifier,
  getAdminId,
  getSafeUser,
} from "../../utils/adminHelpers.js";
import { sendActivationPinEmail } from "../../utils/mailer.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn(
    "JWT_SECRET is not defined. Admin impersonation will not work."
  );
}

const normalizeStatus = (value) =>
  String(value || "").trim().toLowerCase();

const normalizeType = (value) =>
  String(value || "").trim().toLowerCase();

const asNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const isProtectedRole = (role) =>
  ["admin", "superadmin"].includes(normalizeType(role));

/* =====================================================
   GET CUSTOMERS
===================================================== */

export const getUsers = async (req, res) => {
  try {
    const users = await User.find(customerFilter)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
};

/* =====================================================
   CREATE CUSTOMER
===================================================== */


/* =====================================================
   CREATE CUSTOMER — ROOT SPONSOR + NORMAL CUSTOMER
===================================================== */

export const createCustomer = async (req, res) => {
  let session;

  try {
    const {
      name,
      email,
      phone,
      password,
      sponsorCode,
      position,
    } = req.body || {};

    // 1. Validate required fields
    if (
      !name ||
      !email ||
      !phone ||
      password === undefined ||
      password === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required.",
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = String(phone).trim();
    const cleanPassword = String(password);
    const cleanSponsorCode = String(sponsorCode || "")
      .trim()
      .toUpperCase();

    if (!cleanName || !cleanEmail || !cleanPhone) {
      return res.status(400).json({
        success: false,
        message: "Name, email and phone cannot be empty.",
      });
    }

    if (cleanPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // 2. Prevent duplicate email or phone
    const duplicate = await User.findOne({
      role: "user",
      $or: [
        { email: cleanEmail },
        { phone: cleanPhone },
      ],
    })
      .select("_id email phone")
      .lean();

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message:
          duplicate.email === cleanEmail
            ? "A customer with this email already exists."
            : "A customer with this phone number already exists.",
      });
    }

    // 3. Find sponsor, if a sponsor code was provided
    let sponsorUser = null;

    if (cleanSponsorCode) {
      sponsorUser = await User.findOne({
        role: "user",
        $or: [
          { userCode: cleanSponsorCode },
          { memberId: cleanSponsorCode },
        ],
      });

      if (!sponsorUser) {
        return res.status(400).json({
          success: false,
          message: "Sponsor code was not found.",
        });
      }

      if (
        String(sponsorUser.email || "").toLowerCase() ===
          cleanEmail ||
        String(sponsorUser.phone || "") === cleanPhone
      ) {
        return res.status(400).json({
          success: false,
          message: "A customer cannot sponsor themselves.",
        });
      }
    } else {
      // No sponsor code is allowed only for the first customer.
      const existingCustomer = await User.exists({
        role: "user",
      });

      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message:
            "Sponsor code is required because a customer already exists. Use the first customer's Referral Code.",
        });
      }
    }

    // 4. Generate a unique member ID
    const latestUsers = await User.find({
      memberId: /^SI\d+$/i,
    })
      .select("memberId")
      .lean();

    let memberNumber = 681909;

    for (const item of latestUsers) {
      const number = Number(
        String(item.memberId || "").replace(/^SI/i, "")
      );

      if (
        Number.isSafeInteger(number) &&
        number >= memberNumber
      ) {
        memberNumber = number + 1;
      }
    }

    let memberCode = `SI${memberNumber}`;

    while (
      await User.exists({
        $or: [
          { memberId: memberCode },
          { userCode: memberCode },
        ],
      })
    ) {
      memberNumber += 1;
      memberCode = `SI${memberNumber}`;
    }

    // 5. Prepare customer account
    const passwordHash = await bcrypt.hash(cleanPassword, 10);
    const now = new Date();

    const newUser = new User({
      memberId: memberCode,
      userCode: memberCode,

      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: passwordHash,

      role: "user",
      status: "inactive",
      activationDate: null,
      userType: "UNPAID",

      // Referral tree
      sponsorId: sponsorUser?._id || null,
      sponsorCode: sponsorUser
        ? sponsorUser.userCode || sponsorUser.memberId || ""
        : "",
      sponsorMemberId: sponsorUser?.memberId || "",

      treePath: sponsorUser
        ? `${sponsorUser.treePath || "/"}${
            sponsorUser.memberId || sponsorUser.userCode
          }/`
        : "/",

      level: sponsorUser
        ? Number(sponsorUser.level || 1) + 1
        : 1,

      // Binary tree: first customer is the root.
      // This initializes the root; it does not place later
      // customers into the binary tree.
      binaryParentId: null,
      binaryPosition: null,
      binaryLeftId: null,
      binaryRightId: null,
      binaryLevel: 1,
      binaryPath: "/",

      position:
        String(position || "").trim().toLowerCase() === "right"
          ? "right"
          : "left",

      joiningPackage: "",
      rank: "Distributor",
      dateOfEntry: now,

      panNumber: "",
      panVerified: false,

      bankDetails: {
        accountHolderName: cleanName,
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        upiId: "",
      },
    });

    // 6. Save customer and zero-balance wallet atomically
    session = await mongoose.startSession();

    let savedUser;

    await session.withTransaction(async () => {
      // Recheck root condition inside transaction.
      // This helps prevent creating another root customer.
      if (!sponsorUser) {
        const existingCustomer = await User.exists({
          role: "user",
        }).session(session);

        if (existingCustomer) {
          const error = new Error(
            "A root customer already exists. Sponsor code is required."
          );
          error.statusCode = 409;
          throw error;
        }
      }

      savedUser = await newUser.save({ session });

      await Wallet.create(
        [
          {
            userId: savedUser._id,
            memberId: savedUser.memberId,
            currentBalance: 0,
            totalEarnings: 0,
            captchaEarnings: 0,
            referralCommissions: 0,
            totalWithdrawn: 0,
            todayCaptchasSolved: 0,
            lastCaptchaDate: null,
          },
        ],
        { session }
      );

      if (sponsorUser) {
        await User.updateOne(
          {
            _id: sponsorUser._id,
            role: "user",
          },
          {
            $inc: {
              directReferralsCount: 1,
              totalReferral: 1,
              teamCount: 1,
            },
          },
          { session }
        );
      }
    });

    return res.status(201).json({
      success: true,
      message: sponsorUser
        ? "Customer created successfully. Send an activation PIN to activate the account."
        : "First root customer created successfully. This customer's Referral Code can be used for the next customer. Send an activation PIN to activate the account.",

      isRootCustomer: !sponsorUser,
      emailSent: false,

      user: {
        ...getSafeUser(savedUser),
        accountId: savedUser._id,
        memberId: savedUser.memberId,
        userCode: savedUser.userCode,
        referralCode: savedUser.userCode,
        sponsorId: savedUser.sponsorId || null,
      },
    });
  } catch (error) {
    console.error("Create customer error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Member ID, user code, email, or phone already exists.",
      });
    }

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message || "Failed to create customer.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

/* =====================================================
   RESET CUSTOMER PASSWORD
===================================================== */

export const resetCustomerPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required.",
      });
    }

    if (
      newPassword === undefined ||
      newPassword === null
    ) {
      return res.status(400).json({
        success: false,
        message: "New password is required.",
      });
    }

    const cleanPassword = String(newPassword);

    if (!cleanPassword.trim()) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be empty.",
      });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters.",
      });
    }

    const user = await findCustomerByIdentifier(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    user.password = await bcrypt.hash(
      cleanPassword,
      10
    );

    await user.save();

    return res.json({
      success: true,
      message: "Customer password updated successfully.",
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error("Reset customer password error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reset customer password.",
    });
  }
};

/* =====================================================
   GET CUSTOMER DETAILS
===================================================== */

export const getCustomerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await findCustomerByIdentifier(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    /* -----------------------------------------------
       WALLET, TRANSACTIONS AND SALES
    ------------------------------------------------ */

    const [wallet, allTransactions, sales] =
      await Promise.all([
        Wallet.findOne({
          userId: user._id,
        }).lean(),

        Transaction.find({
          userId: user._id,
        })
          .sort({ createdAt: -1 })
          .lean(),

        Transaction.find({
          userId: user._id,
          category: "package",
        })
          .sort({ createdAt: -1 })
          .lean(),
      ]);

    /* -----------------------------------------------
       COMPLETED TRANSACTIONS
    ------------------------------------------------ */

    const completedTransactions =
      allTransactions.filter(
        (transaction) =>
          normalizeStatus(transaction?.status) ===
          "completed"
      );

    /* -----------------------------------------------
       BINARY INCOME
    ------------------------------------------------ */

    // Zero-value milestone entries are not paid binary income.
    const binaryIncomeTransactions =
      completedTransactions.filter((transaction) => {
        return (
          normalizeType(transaction?.type) ===
            "binary_income" &&
          asNumber(
            transaction?.amount ??
              transaction?.netAmount
          ) > 0
        );
      });

    const binaryIncome =
      binaryIncomeTransactions.reduce(
        (total, transaction) =>
          total +
          asNumber(
            transaction?.amount ??
              transaction?.netAmount
          ),
        0
      );

    const binaryPairCount =
      binaryIncomeTransactions.length;

    /* -----------------------------------------------
       CAPTCHA INCOME
    ------------------------------------------------ */

    const captchaIncomeTransactions =
      completedTransactions.filter(
        (transaction) =>
          normalizeType(transaction?.type) ===
          "captcha_reward"
      );

    const transactionCaptchaIncome =
      captchaIncomeTransactions.reduce(
        (total, transaction) =>
          total +
          asNumber(
            transaction?.amount ??
              transaction?.netAmount
          ),
        0
      );

    /* -----------------------------------------------
       REFERRAL BONUS
    ------------------------------------------------ */

    const referralBonusTransactions =
      completedTransactions.filter(
        (transaction) =>
          normalizeType(transaction?.type) ===
          "referral_bonus"
      );

    const referralBonusIncome =
      referralBonusTransactions.reduce(
        (total, transaction) =>
          total +
          asNumber(
            transaction?.amount ??
              transaction?.netAmount
          ),
        0
      );

    /* -----------------------------------------------
       PENDING WITHDRAWALS
    ------------------------------------------------ */

    const pendingWithdrawalTransactions =
      allTransactions.filter((transaction) => {
        const type = normalizeType(transaction?.type);
        const category = normalizeType(
          transaction?.category
        );
        const status = normalizeStatus(
          transaction?.status
        );

        return (
          (
            type === "withdrawal" ||
            category === "withdrawal"
          ) &&
          status === "pending"
        );
      });

    const pendingWithdrawalsAmount =
      pendingWithdrawalTransactions.reduce(
        (total, transaction) =>
          total +
          asNumber(
            transaction?.netAmount ??
              transaction?.amount
          ),
        0
      );

    /* -----------------------------------------------
       WALLET VALUES
    ------------------------------------------------ */

    const currentBalance = asNumber(
      wallet?.currentBalance
    );

    const totalEarnings = asNumber(
      wallet?.totalEarnings
    );

    const captchaEarnings =
      wallet?.captchaEarnings == null
        ? transactionCaptchaIncome
        : asNumber(wallet.captchaEarnings);

    const referralCommissions =
      wallet?.referralCommissions == null
        ? referralBonusIncome
        : asNumber(wallet.referralCommissions);

    const totalWithdrawn = asNumber(
      wallet?.totalWithdrawn
    );

    /* -----------------------------------------------
       USER INCOME VALUES
    ------------------------------------------------ */

    const matchingIncome = asNumber(
      user?.matchingIncome
    );

    const todayMatchingIncome = asNumber(
      user?.todayMatchingIncome
    );

    const franchiseReferralIncome = asNumber(
      user?.franchiseReferralIncome
    );

    const franchiseMatchingIncome = asNumber(
      user?.franchiseMatchingIncome
    );

    const totalIncome = asNumber(
      user?.totalIncome
    );

    /* -----------------------------------------------
       BINARY TEAM VALUES
    ------------------------------------------------ */

    const leftCount = asNumber(user?.leftCount);
    const rightCount = asNumber(user?.rightCount);

    const totalTeam =
      user?.totalTeam == null
        ? leftCount + rightCount
        : asNumber(user.totalTeam);

    const activeTeam = asNumber(user?.activeTeam);

    const leftBusiness = asNumber(user?.leftBusiness);
    const rightBusiness = asNumber(user?.rightBusiness);

    const leftPv = asNumber(user?.leftPv);
    const rightPv = asNumber(user?.rightPv);

    const leftCarryForwardPv = asNumber(
      user?.leftCarryForwardPv
    );

    const rightCarryForwardPv = asNumber(
      user?.rightCarryForwardPv
    );

    /* -----------------------------------------------
       SAFE USER DATA
    ------------------------------------------------ */

    const safeUser = {
      ...getSafeUser(user),

      binaryParentId: user?.binaryParentId || null,
      binaryPosition: user?.binaryPosition || null,
      binaryLeftId: user?.binaryLeftId || null,
      binaryRightId: user?.binaryRightId || null,
      binaryLevel: user?.binaryLevel ?? null,
      binaryPath: user?.binaryPath || "",

      leftCount,
      rightCount,
      totalTeam,
      activeTeam,

      leftBusiness,
      rightBusiness,

      leftPv,
      rightPv,

      leftCarryForwardPv,
      rightCarryForwardPv,

      matchingIncome,
      todayMatchingIncome,

      franchiseReferralIncome,
      franchiseMatchingIncome,

      totalIncome,
    };

    /* -----------------------------------------------
       CUSTOMER STATISTICS
    ------------------------------------------------ */

    const stats = {
      currentBalance,
      walletBalance: currentBalance,

      totalEarnings,
      totalWithdrawn,

      pendingWithdrawals: pendingWithdrawalsAmount,
      pendingWithdrawalsCount:
        pendingWithdrawalTransactions.length,

      captchaEarnings,
      referralCommissions,

      binaryIncome,
      totalBinaryIncome: binaryIncome,

      binaryPairCount,
      completedBinaryPairs: binaryPairCount,
      completedPairs: binaryPairCount,

      matchingIncome,
      todayMatchingIncome,

      franchiseReferralIncome,
      franchiseMatchingIncome,

      totalIncome,

      totalCaptchaPaid: transactionCaptchaIncome,
      totalReferralPaid: referralBonusIncome,

      leftCount,
      rightCount,

      binaryLeftCount: leftCount,
      binaryRightCount: rightCount,

      totalTeam,
      binaryTotalTeam: totalTeam,
      activeTeam,

      leftBusiness,
      rightBusiness,

      leftPv,
      rightPv,

      leftCarryForwardPv,
      rightCarryForwardPv,

      binaryParentId: user?.binaryParentId || null,
      binaryPosition: user?.binaryPosition || null,
      binaryLeftId: user?.binaryLeftId || null,
      binaryRightId: user?.binaryRightId || null,

      salesCount: sales.length,
      totalTransactions: allTransactions.length,
      completedTransactions: completedTransactions.length,

      binaryIncomeTransactions:
        binaryIncomeTransactions.length,

      captchaIncomeTransactions:
        captchaIncomeTransactions.length,

      referralBonusTransactions:
        referralBonusTransactions.length,
    };

    /* -----------------------------------------------
       RECENT TRANSACTIONS
    ------------------------------------------------ */

    const recentTransactions =
      allTransactions.slice(0, 50).map((transaction) => {
        const type = normalizeType(transaction?.type);

        let displayType =
          transaction?.type ||
          transaction?.category ||
          "Transaction";

        if (type === "binary_income") {
          displayType = "Binary Income";
        } else if (type === "captcha_reward") {
          displayType = "CAPTCHA Reward";
        } else if (type === "referral_bonus") {
          displayType = "Referral Bonus";
        }

        return {
          ...transaction,
          displayType,
        };
      });

    /* -----------------------------------------------
       RESPONSE
    ------------------------------------------------ */

    return res.json({
      success: true,

      user: safeUser,
      customer: safeUser,

      wallet,
      stats,
      sales,

      transactions: recentTransactions,

      income: {
        binaryIncome,
        binaryPairCount,

        matchingIncome,
        todayMatchingIncome,

        franchiseReferralIncome,
        franchiseMatchingIncome,

        totalIncome,
      },

      binary: {
        leftCount,
        rightCount,
        totalTeam,

        leftBusiness,
        rightBusiness,

        leftPv,
        rightPv,

        leftCarryForwardPv,
        rightCarryForwardPv,

        parentId: user?.binaryParentId || null,
        position: user?.binaryPosition || null,
        leftId: user?.binaryLeftId || null,
        rightId: user?.binaryRightId || null,

        completedPairs: binaryPairCount,
        income: binaryIncome,
      },
    });
  } catch (error) {
    console.error("Get customer details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer details.",
    });
  }
};

/* =====================================================
   UPDATE CUSTOMER
===================================================== */

// Graph links and derived binary/referral counters must not
// be edited manually through this endpoint.
const UPDATABLE_CUSTOMER_FIELDS = [
  "name",
  "email",
  "phone",
  "joiningPackage",
  "rank",
  "position",
  "panNumber",
  "panVerified",
  "leftBusiness",
  "rightBusiness",
  "leftPv",
  "rightPv",
  "leftCarryForwardPv",
  "rightCarryForwardPv",
  "matchingIncome",
  "todayMatchingIncome",
  "franchiseReferralIncome",
  "franchiseMatchingIncome",
  "totalIncome",
];

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findCustomerByIdentifier(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    /* -----------------------------------------------
       SPONSOR RELATIONSHIP GUARD
    ------------------------------------------------ */

    if (
      req.body?.sponsorCode !== undefined ||
      req.body?.sponsorMemberId !== undefined ||
      req.body?.sponsorId !== undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Sponsor cannot be changed through profile update because referral links and counts must also be rebuilt.",
      });
    }

    /* -----------------------------------------------
       STATUS GUARD
    ------------------------------------------------ */

    if (req.body?.status !== undefined) {
      const requestedStatus = normalizeStatus(
        req.body.status
      );

      if (
        !["active", "inactive"].includes(
          requestedStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Customer status must be active or inactive.",
        });
      }

      if (
        normalizeStatus(user.status) === "inactive" &&
        requestedStatus === "active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Inactive customers must be activated using the activation PIN. Manual activation is disabled.",
        });
      }

      user.status = requestedStatus;
    }

    /* -----------------------------------------------
       ACTIVATION DATE GUARD
    ------------------------------------------------ */

    if (req.body?.activationDate !== undefined) {
      if (normalizeStatus(user.status) === "inactive") {
        return res.status(400).json({
          success: false,
          message:
            "Activation date cannot be set for an inactive customer. Use the activation PIN flow.",
        });
      }

      const date = req.body.activationDate
        ? new Date(req.body.activationDate)
        : null;

      if (date && Number.isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid activation date.",
        });
      }

      user.activationDate = date;
    }

    /* -----------------------------------------------
       USER TYPE GUARD
    ------------------------------------------------ */

    if (req.body?.userType !== undefined) {
      if (normalizeStatus(user.status) === "inactive") {
        return res.status(400).json({
          success: false,
          message:
            "User type for an inactive customer is determined by the activation PIN.",
        });
      }

      const requestedUserType = String(
        req.body.userType
      )
        .trim()
        .toUpperCase();

      if (!["PAID", "UNPAID"].includes(requestedUserType)) {
        return res.status(400).json({
          success: false,
          message: "User type must be PAID or UNPAID.",
        });
      }

      user.userType = requestedUserType;
    }

    /* -----------------------------------------------
       STANDARD FIELDS
    ------------------------------------------------ */

    for (const field of UPDATABLE_CUSTOMER_FIELDS) {
      if (req.body?.[field] === undefined) {
        continue;
      }

      let value = req.body[field];

      if (
        field === "name" ||
        field === "phone" ||
        field === "panNumber"
      ) {
        value = value == null ? "" : String(value).trim();
      }

      if (field === "email") {
        value =
          value == null
            ? ""
            : String(value).trim().toLowerCase();
      }

      if (field === "panVerified") {
        value =
          typeof value === "string"
            ? value.trim().toLowerCase() === "true"
            : Boolean(value);
      }

      user[field] = value;
    }

    /* -----------------------------------------------
       BANK DETAILS
    ------------------------------------------------ */

    if (req.body?.bankDetails !== undefined) {
      if (
        !req.body.bankDetails ||
        typeof req.body.bankDetails !== "object" ||
        Array.isArray(req.body.bankDetails)
      ) {
        return res.status(400).json({
          success: false,
          message: "bankDetails must be an object.",
        });
      }

      const allowedBankFields = [
        "accountHolderName",
        "accountNumber",
        "ifscCode",
        "bankName",
        "upiId",
      ];

      const currentBank =
        user.bankDetails?.toObject?.() ||
        user.bankDetails ||
        {};

      const nextBank = { ...currentBank };

      for (const field of allowedBankFields) {
        if (req.body.bankDetails[field] !== undefined) {
          nextBank[field] = String(
            req.body.bankDetails[field] ?? ""
          ).trim();
        }
      }

      user.bankDetails = nextBank;
    }

    await user.save();

    return res.json({
      success: true,
      message: "Customer updated successfully.",
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error("Update customer error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Member ID, user code, email, or phone already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update customer.",
    });
  }
};

/* =====================================================
   TOGGLE CUSTOMER STATUS
===================================================== */

export const toggleCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findCustomerByIdentifier(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    /*
     * This endpoint can deactivate an active user.
     * It cannot activate an inactive user.
     */
    if (normalizeStatus(user.status) === "inactive") {
      return res.status(400).json({
        success: false,
        message:
          "This customer is inactive. Use Send Activation PIN to activate the account.",
      });
    }

    user.status = "inactive";

    await user.save();

    return res.json({
      success: true,
      message: "Customer deactivated successfully.",
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error("Toggle customer status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update customer status.",
    });
  }
};

/* =====================================================
   IMPERSONATE CUSTOMER
===================================================== */

export const impersonateCustomer = async (req, res) => {
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message:
          "JWT authentication configuration is missing.",
      });
    }

    const { id } = req.params;
    const user = await findCustomerByIdentifier(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (normalizeStatus(user.status) !== "active") {
      return res.status(400).json({
        success: false,
        message:
          "Inactive customers cannot be impersonated before activation.",
      });
    }

    const token = jwt.sign(
      {
        id: String(user._id),
        memberId: user.memberId,
        userCode: user.userCode,
        role: user.role,
        name: user.name,

        // Admin impersonation token.
        imp: true,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      success: true,
      message: "Customer impersonation token generated.",
      token,
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error("Impersonate customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to impersonate customer.",
    });
  }
};

/* =====================================================
   DELETE CUSTOMER HELPERS
===================================================== */

/**
 * Rebuild referral paths for a customer and descendants.
 * Referral links use sponsorId, not binaryParentId.
 */
const rebuildReferralSubtree = async (
  userId,
  parentUser,
  session,
  visited = new Set()
) => {
  const id = String(userId);

  if (visited.has(id)) {
    throw new Error(
      "Referral tree cycle detected. Customer deletion cancelled."
    );
  }

  visited.add(id);

  const user = await User.findById(id).session(session);

  if (!user || user.role !== "user") {
    throw new Error(
      "A referral descendant could not be found. Customer deletion cancelled."
    );
  }

  if (parentUser) {
    const parentCode =
      parentUser.memberId || parentUser.userCode;

    user.treePath =
      `${parentUser.treePath || "/"}${parentCode}/`;

    user.level =
      asNumber(parentUser.level || 1) + 1;
  } else {
    user.treePath = "/";
    user.level = 1;
  }

  await user.save({ session });

  const children = await User.find({
    role: "user",
    sponsorId: user._id,
  })
    .select("_id")
    .session(session);

  for (const child of children) {
    await rebuildReferralSubtree(
      child._id,
      user,
      session,
      visited
    );
  }

  return user;
};

/**
 * Find the first free binary slot using BFS.
 * Left slots are preferred over right slots.
 */
const findBinaryInsertionSlot = async (
  rootId,
  session,
  forbiddenId = null
) => {
  const queue = [String(rootId)];
  const visited = new Set();

  let firstSlot = null;
  let index = 0;

  while (index < queue.length) {
    const currentId = queue[index++];

    if (visited.has(currentId)) {
      throw new Error(
        "Binary tree cycle or duplicate link detected. Customer deletion cancelled."
      );
    }

    visited.add(currentId);

    if (
      forbiddenId &&
      currentId === String(forbiddenId)
    ) {
      throw new Error(
        "Binary tree contains an invalid relationship. Customer deletion cancelled."
      );
    }

    const current = await User.findById(
      currentId
    ).session(session);

    if (!current || current.role !== "user") {
      throw new Error(
        "A binary descendant could not be found. Customer deletion cancelled."
      );
    }

    if (!firstSlot && !current.binaryLeftId) {
      firstSlot = {
        parentId: current._id,
        position: "left",
      };
    } else if (!firstSlot && !current.binaryRightId) {
      firstSlot = {
        parentId: current._id,
        position: "right",
      };
    }

    if (current.binaryLeftId) {
      queue.push(String(current.binaryLeftId));
    }

    if (current.binaryRightId) {
      queue.push(String(current.binaryRightId));
    }
  }

  return firstSlot;
};

/**
 * Rebuild binary parent, position, level, and path fields.
 */
const rebuildBinarySubtree = async (
  rootId,
  parentId,
  position,
  session,
  visited = new Set()
) => {
  const id = String(rootId);

  if (visited.has(id)) {
    throw new Error(
      "Binary tree cycle or duplicate link detected. Customer deletion cancelled."
    );
  }

  visited.add(id);

  const user = await User.findById(id).session(session);

  if (!user || user.role !== "user") {
    throw new Error(
      "A binary descendant could not be found. Customer deletion cancelled."
    );
  }

  if (parentId) {
    const parent = await User.findById(
      parentId
    ).session(session);

    if (!parent || parent.role !== "user") {
      throw new Error(
        "Binary parent could not be found. Customer deletion cancelled."
      );
    }

    if (!["left", "right"].includes(position)) {
      throw new Error(
        "Invalid binary position. Customer deletion cancelled."
      );
    }

    user.binaryParentId = parent._id;
    user.binaryPosition = position;

    user.binaryLevel =
      asNumber(parent.binaryLevel || 1) + 1;

    user.binaryPath = buildBinaryPath(
      parent.binaryPath,
      position
    );
  } else {
    user.binaryParentId = null;
    user.binaryPosition = null;
    user.binaryLevel = 1;
    user.binaryPath = "/";
  }

  const leftId = user.binaryLeftId;
  const rightId = user.binaryRightId;

  if (
    leftId &&
    rightId &&
    String(leftId) === String(rightId)
  ) {
    throw new Error(
      "The same customer occupies both binary positions. Deletion cancelled."
    );
  }

  await user.save({ session });

  if (leftId) {
    await rebuildBinarySubtree(
      leftId,
      user._id,
      "left",
      session,
      visited
    );
  }

  if (rightId) {
    await rebuildBinarySubtree(
      rightId,
      user._id,
      "right",
      session,
      visited
    );
  }
};

/**
 * Recalculate binary counts upwards to the binary root.
 */
const syncBinaryCountsUpwards = async (
  startId,
  session
) => {
  let currentId = startId;
  const visited = new Set();

  while (currentId) {
    const id = String(currentId);

    if (visited.has(id)) {
      throw new Error(
        "Binary ancestor cycle detected. Customer deletion cancelled."
      );
    }

    visited.add(id);

    const current = await User.findById(
      id
    ).session(session);

    if (!current || current.role !== "user") {
      throw new Error(
        "Binary ancestor could not be found. Customer deletion cancelled."
      );
    }

    await syncBinaryTeamCounts(
      current._id,
      session
    );

    currentId = current.binaryParentId || null;
  }
};

/**
 * Reverse a direct referral bonus, if the matching
 * completed transaction exists.
 *
 * Historical binary income is not reversed here.
 */
const reverseDirectReferralBonus = async (
  sponsor,
  deletedCustomer,
  req,
  session
) => {
  if (!sponsor) {
    return;
  }

  const originalReference =
    `DIRECT_REFERRAL:${sponsor._id}:${deletedCustomer._id}`;

  const reversalReference =
    `DELETE_REVERSAL:${originalReference}`;

  const existingReversal = await Transaction.findOne({
    referenceKey: reversalReference,
  }).session(session);

  if (existingReversal) {
    return;
  }

  const originalTransaction = await Transaction.findOne({
    userId: sponsor._id,
    referenceKey: originalReference,
    status: "completed",
  }).session(session);

  if (!originalTransaction) {
    return;
  }

 const transactionAmount = asNumber(
  originalTransaction.amount
);

const netAmount = asNumber(
  originalTransaction.netAmount
);

// amount is zero असला तरी netAmount मध्ये रक्कम
// असल्यास योग्य transaction amount वापरा.
const amount =
  transactionAmount > 0
    ? transactionAmount
    : netAmount;

if (amount <= 0) {
  return;
}

  const wallet = await Wallet.findOne({
    userId: sponsor._id,
  }).session(session);

  if (!wallet) {
    throw new Error(
      "Sponsor wallet not found. Customer deletion cancelled."
    );
  }

  const balanceBefore = asNumber(
    wallet.currentBalance
  );

  if (balanceBefore < amount) {
    const error = new Error(
      `Customer cannot be deleted because the sponsor's wallet balance is insufficient to reverse the ₹${amount} referral bonus.`
    );

    error.statusCode = 409;
    throw error;
  }

  const balanceAfter = balanceBefore - amount;

  wallet.currentBalance = balanceAfter;

  wallet.totalEarnings = Math.max(
    0,
    asNumber(wallet.totalEarnings) - amount
  );

  wallet.referralCommissions = Math.max(
    0,
    asNumber(wallet.referralCommissions) - amount
  );

  await wallet.save({ session });

  /*
   * IMPORTANT:
   * The Transaction schema must accept type "debit"
   * and the fields used below.
   */
  await Transaction.create(
    [
      {
        userId: sponsor._id,
        memberId: sponsor.memberId,

        type: "debit",
        category: "referral",

        amount,
        grossAmount: amount,
        netAmount: amount,

        balanceBefore,
        balanceAfter,

        status: "completed",
        referenceKey: reversalReference,

        description:
          `Reversal of direct referral bonus for deleted customer ${deletedCustomer.memberId}.`,

        reason: "Customer deletion referral bonus reversal",
        createdBy: getAdminId(req),
      },
    ],
    { session }
  );
};

/* =====================================================
   DELETE CUSTOMER
===================================================== */

export const deleteCustomer = async (req, res) => {
  let session;

  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required.",
      });
    }

    const foundUser = await findCustomerByIdentifier(id);

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (
      isProtectedRole(foundUser.role) ||
      foundUser.role !== "user"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only customer accounts can be deleted from customer management.",
      });
    }

    session = await mongoose.startSession();

    const deletedMemberId = foundUser.memberId;
    const customerId = foundUser._id;

    await session.withTransaction(async () => {
      const customer = await User.findById(
        customerId
      ).session(session);

      if (!customer || customer.role !== "user") {
        const error = new Error(
          "Customer no longer exists or is not a customer account."
        );

        error.statusCode = 404;
        throw error;
      }

      const sponsor = customer.sponsorId
        ? await User.findById(
            customer.sponsorId
          ).session(session)
        : null;

      if (
        customer.sponsorId &&
        (!sponsor || sponsor.role !== "user")
      ) {
        throw new Error(
          "Customer sponsor could not be found or is invalid. Deletion cancelled."
        );
      }

      /* -----------------------------------------------
         1. LOAD REFERRAL CHILDREN
      ------------------------------------------------ */

      const referralChildren = await User.find({
        role: "user",
        sponsorId: customer._id,
      }).session(session);

      /* -----------------------------------------------
         2. REVERSE DIRECT REFERRAL BONUS
      ------------------------------------------------ */

      await reverseDirectReferralBonus(
        sponsor,
        customer,
        req,
        session
      );

      /* -----------------------------------------------
         3. REASSIGN REFERRAL CHILDREN
      ------------------------------------------------ */

      for (const child of referralChildren) {
        if (
          sponsor &&
          String(child._id) === String(sponsor._id)
        ) {
          throw new Error(
            "Invalid referral relationship detected. Deletion cancelled."
          );
        }

        child.sponsorId = sponsor?._id || null;

        child.sponsorCode = sponsor
          ? sponsor.userCode || sponsor.memberId || ""
          : "";

        child.sponsorMemberId = sponsor
          ? sponsor.memberId || ""
          : "";

        await child.save({ session });
      }

      /* -----------------------------------------------
         4. VALIDATE BINARY TREE LINKS
      ------------------------------------------------ */

      const leftChildId =
        customer.binaryLeftId || null;

      const rightChildId =
        customer.binaryRightId || null;

      if (
        leftChildId &&
        rightChildId &&
        String(leftChildId) === String(rightChildId)
      ) {
        throw new Error(
          "Customer has the same binary child on both sides. Deletion cancelled."
        );
      }

      const [
        leftChild,
        rightChild,
        pointerParents,
      ] = await Promise.all([
        leftChildId
          ? User.findById(leftChildId).session(session)
          : null,

        rightChildId
          ? User.findById(rightChildId).session(session)
          : null,

        User.find({
          role: "user",
          _id: { $ne: customer._id },
          $or: [
            { binaryLeftId: customer._id },
            { binaryRightId: customer._id },
          ],
        })
          .select("_id binaryLeftId binaryRightId")
          .session(session),
      ]);

      if (
        (leftChildId && !leftChild) ||
        (rightChildId && !rightChild)
      ) {
        throw new Error(
          "A binary child could not be found. Deletion cancelled to protect the tree."
        );
      }

      if (
        (leftChild && leftChild.role !== "user") ||
        (rightChild && rightChild.role !== "user")
      ) {
        throw new Error(
          "A binary child is not a valid customer account. Deletion cancelled."
        );
      }

      if (
        leftChild &&
        String(leftChild.binaryParentId || "") !==
          String(customer._id)
      ) {
        throw new Error(
          "The left binary child's parent pointer is inconsistent. Deletion cancelled to protect the tree."
        );
      }

      if (
        rightChild &&
        String(rightChild.binaryParentId || "") !==
          String(customer._id)
      ) {
        throw new Error(
          "The right binary child's parent pointer is inconsistent. Deletion cancelled to protect the tree."
        );
      }

      /* -----------------------------------------------
         5. VALIDATE BINARY PARENT
      ------------------------------------------------ */

      const oldBinaryParentId =
        customer.binaryParentId || null;

      let oldBinaryParent = oldBinaryParentId
        ? await User.findById(
            oldBinaryParentId
          ).session(session)
        : null;

      if (
        oldBinaryParentId &&
        (!oldBinaryParent || oldBinaryParent.role !== "user")
      ) {
        throw new Error(
          "Binary parent could not be found. Deletion cancelled."
        );
      }

      if (pointerParents.length > 1) {
        throw new Error(
          "Multiple binary parents reference this customer. Deletion cancelled to protect the tree."
        );
      }

      if (oldBinaryParent) {
        const referencedByOldParent =
          String(oldBinaryParent.binaryLeftId || "") ===
            String(customer._id) ||
          String(oldBinaryParent.binaryRightId || "") ===
            String(customer._id);

        if (!referencedByOldParent) {
          throw new Error(
            "Binary parent does not reference this customer. Deletion cancelled to protect the tree."
          );
        }

        if (
          pointerParents.length !== 1 ||
          String(pointerParents[0]._id) !==
            String(oldBinaryParent._id)
        ) {
          throw new Error(
            "Binary parent references are inconsistent. Deletion cancelled to protect the tree."
          );
        }
      } else if (pointerParents.length > 0) {
        throw new Error(
          "A binary parent references this customer but its parent pointer is missing. Deletion cancelled."
        );
      }

      /* -----------------------------------------------
         6. REPAIR BINARY TREE
      ------------------------------------------------ */

      let oldPosition = customer.binaryPosition;

      if (oldBinaryParent) {
        oldPosition =
          String(oldBinaryParent.binaryLeftId || "") ===
          String(customer._id)
            ? "left"
            : "right";
      }

      const promotedChild =
        leftChild || rightChild || null;

      // If both children exist, move the right child into
      // the first available slot in the promoted subtree.
      const secondChild =
        leftChild && rightChild
          ? rightChild
          : null;

      let binaryRecountStartId = null;

      if (promotedChild) {
        /* Replace the deleted customer at its old position. */

        if (oldBinaryParent) {
          if (oldPosition === "left") {
            oldBinaryParent.binaryLeftId =
              promotedChild._id;
          } else {
            oldBinaryParent.binaryRightId =
              promotedChild._id;
          }

          await oldBinaryParent.save({ session });
        }

        /* Promote child to the deleted customer's position. */

        promotedChild.binaryParentId =
          oldBinaryParent?._id || null;

        promotedChild.binaryPosition =
          oldBinaryParent
            ? oldPosition
            : null;

        await promotedChild.save({ session });

        /* Insert the second child if both existed. */

        if (secondChild) {
          const slot = await findBinaryInsertionSlot(
            promotedChild._id,
            session,
            secondChild._id
          );

          if (!slot) {
            throw new Error(
              "No valid binary slot was found. Deletion cancelled."
            );
          }

          const slotParent = await User.findById(
            slot.parentId
          ).session(session);

          if (
            !slotParent ||
            slotParent.role !== "user"
          ) {
            throw new Error(
              "Binary insertion parent could not be found. Deletion cancelled."
            );
          }

          if (slot.position === "left") {
            if (slotParent.binaryLeftId) {
              throw new Error(
                "Binary left slot changed during deletion. Please retry."
              );
            }

            slotParent.binaryLeftId =
              secondChild._id;
          } else {
            if (slotParent.binaryRightId) {
              throw new Error(
                "Binary right slot changed during deletion. Please retry."
              );
            }

            slotParent.binaryRightId =
              secondChild._id;
          }

          await slotParent.save({ session });

          secondChild.binaryParentId =
            slotParent._id;

          secondChild.binaryPosition =
            slot.position;

          await secondChild.save({ session });

          binaryRecountStartId =
            slotParent._id;
        } else {
          binaryRecountStartId =
            promotedChild._id;
        }

        /* Rebuild parent, level and path data. */

        await rebuildBinarySubtree(
          promotedChild._id,
          oldBinaryParent?._id || null,
          oldBinaryParent ? oldPosition : null,
          session
        );
      } else if (oldBinaryParent) {
        /* The deleted customer was a binary leaf. */

        if (oldPosition === "left") {
          oldBinaryParent.binaryLeftId = null;
        } else {
          oldBinaryParent.binaryRightId = null;
        }

        await oldBinaryParent.save({ session });

        binaryRecountStartId =
          oldBinaryParent._id;

        await rebuildBinarySubtree(
          oldBinaryParent._id,
          oldBinaryParent.binaryParentId || null,
          oldBinaryParent.binaryPosition || null,
          session
        );
      }

      /* -----------------------------------------------
         7. REBUILD REFERRAL PATHS
      ------------------------------------------------ */

      for (const child of referralChildren) {
        await rebuildReferralSubtree(
          child._id,
          sponsor,
          session,
          new Set()
        );
      }

      /* -----------------------------------------------
         8. RECALCULATE SPONSOR COUNTS
      ------------------------------------------------ */

      if (sponsor) {
        const [directCount, activeCount] =
          await Promise.all([
            User.countDocuments({
              role: "user",
              sponsorId: sponsor._id,
            }).session(session),

            User.countDocuments({
              role: "user",
              sponsorId: sponsor._id,
              status: "active",
            }).session(session),
          ]);

        sponsor.directReferralsCount =
          directCount;

        sponsor.totalReferral =
          directCount;

        sponsor.teamCount =
          directCount;

        sponsor.activeReferral =
          activeCount;

        await sponsor.save({ session });
      }

      /* -----------------------------------------------
         9. DELETE CUSTOMER OPERATIONAL RECORDS

         Transaction history is preserved for audit.
      ------------------------------------------------ */

      await Wallet.deleteMany(
        { userId: customer._id },
        { session }
      );

      await CaptchaAttempt.deleteMany(
        { userId: customer._id },
        { session }
      );

      await ActivationPin.deleteMany(
        { userId: customer._id },
        { session }
      );

      /* -----------------------------------------------
         10. DELETE CUSTOMER
      ------------------------------------------------ */

      await User.deleteOne(
        { _id: customer._id },
        { session }
      );

      /* -----------------------------------------------
         11. RECALCULATE BINARY COUNTS
      ------------------------------------------------ */

      if (binaryRecountStartId) {
        await syncBinaryCountsUpwards(
          binaryRecountStartId,
          session
        );
      }
    });

    return res.json({
      success: true,
      message:
        "Customer deleted successfully. Referral relationships and binary tree were repaired, and transaction history was preserved.",
      deletedMemberId,
    });
  } catch (error) {
    console.error("Delete customer error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message ||
        "Failed to delete customer.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

/* =====================================================
   ACTIVATION PIN (ADMIN)
===================================================== */

const ACTIVATION_PIN_RESEND_COOLDOWN_SECONDS = 60;

const issueActivationPin = async (
  req,
  res,
  { isResend }
) => {
  try {
    const { id } = req.params;

    const pinType = normalizeType(
      req.body?.pinType || "unpaid"
    );

    if (!["paid", "unpaid"].includes(pinType)) {
      return res.status(400).json({
        success: false,
        message:
          "PIN type must be paid or unpaid.",
      });
    }

    const customer = await findCustomerByIdentifier(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (normalizeStatus(customer.status) === "active") {
      return res.status(400).json({
        success: false,
        message:
          "Account is already active. Activation PIN is not required.",
      });
    }

    if (normalizeStatus(customer.status) !== "inactive") {
      return res.status(400).json({
        success: false,
        message:
          "Activation PIN can only be sent to inactive customers.",
      });
    }

    if (
      !customer.email ||
      !String(customer.email).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Customer does not have an email address.",
      });
    }

    /* -----------------------------------------------
       RESEND COOLDOWN
    ------------------------------------------------ */

    const lastPin = await ActivationPin.findOne({
      userId: customer._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (lastPin?.sentAt) {
      const secondsSinceLast =
        (
          Date.now() -
          new Date(lastPin.sentAt).getTime()
        ) / 1000;

      if (
        Number.isFinite(secondsSinceLast) &&
        secondsSinceLast >= 0 &&
        secondsSinceLast <
          ACTIVATION_PIN_RESEND_COOLDOWN_SECONDS
      ) {
        const wait = Math.ceil(
          ACTIVATION_PIN_RESEND_COOLDOWN_SECONDS -
            secondsSinceLast
        );

        return res.status(429).json({
          success: false,
          message:
            `Please wait ${wait} seconds before sending another PIN.`,
        });
      }
    }

    /* -----------------------------------------------
       GENERATE ACTIVATION PIN
    ------------------------------------------------ */

    const plainPin = String(
      crypto.randomInt(100000, 1000000)
    );

    const pinHash = await bcrypt.hash(
      plainPin,
      10
    );

    const expiresAt = new Date(
      Date.now() +
        ACTIVATION_PIN_EXPIRY_HOURS *
          60 *
          60 *
          1000
    );

    const sentAt = new Date();

    let pinRecord;

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        /*
         * Invalidate any older unused, unexpired PINs.
         */

        await ActivationPin.updateMany(
          {
            userId: customer._id,
            used: false,
            expiresAt: { $gt: new Date() },
          },
          {
            $set: {
              expiresAt: new Date(),
            },
          },
          { session }
        );

        const created = await ActivationPin.create(
          [
            {
              userId: customer._id,
              memberId: customer.memberId,

              pinHash,
              pinType,
              expiresAt,

              used: false,
              attempts: 0,
              sentAt,

              createdBy: getAdminId(req),
            },
          ],
          { session }
        );

        pinRecord = created[0];
      });
    } finally {
      await session.endSession();
    }

    /* -----------------------------------------------
       SEND ACTIVATION EMAIL
    ------------------------------------------------ */

    try {
      await sendActivationPinEmail({
        email: customer.email,
        name: customer.name,
        memberId: customer.memberId,
        pin: plainPin,
        pinType,
        expiresAt,
      });
    } catch (mailError) {
      console.error(
        "Activation PIN email error:",
        mailError
      );

      /*
       * Clean up the PIN record if email sending fails.
       */

      if (pinRecord?._id) {
        await ActivationPin.deleteOne({
          _id: pinRecord._id,
        }).catch((cleanupError) => {
          console.error(
            "Activation PIN cleanup error:",
            cleanupError
          );
        });
      }

      return res.status(502).json({
        success: false,
        message:
          "Activation PIN could not be emailed. Please check the SMTP settings and try again.",
      });
    }

    /* -----------------------------------------------
       RESPONSE
    ------------------------------------------------ */

    return res.json({
      success: true,

      message: isResend
        ? "Activation PIN resent successfully."
        : "Activation PIN sent successfully.",

      memberId: customer.memberId,
      email: customer.email,
      pinType,
      expiresAt,
    });
  } catch (error) {
    console.error("Send activation PIN error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send activation PIN.",
    });
  }
};

/* =====================================================
   GENERATE ACTIVATION PIN
===================================================== */

export const generateActivationPin = (req, res) =>
  issueActivationPin(req, res, {
    isResend: false,
  });

/* =====================================================
   RESEND ACTIVATION PIN
===================================================== */

export const resendActivationPin = (req, res) =>
  issueActivationPin(req, res, {
    isResend: true,
  });