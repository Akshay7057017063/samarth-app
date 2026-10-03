import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { User } from "../../models/User.js";
import { Wallet } from "../../models/Wallet.js";
import { Transaction } from "../../models/Transaction.js";
import { CaptchaAttempt } from "../../models/CaptchaAttempt.js";

import {
  customerFilter,
  findCustomerByIdentifier,
  getAdminId,
  getSafeUser,
} from "../../utils/adminHelpers.js";
import { sendCustomerWelcomeEmail } from "../../utils/customerWelcomeEmail.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn("⚠️ JWT_SECRET is not defined. Admin impersonation will not work.");
}

// =====================================================
// GET USERS / CUSTOMERS
// =====================================================

export const getUsers = async (req, res) => {
  try {
    const users = await User.find(customerFilter)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error("❌ Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
};

// =====================================================
// CREATE CUSTOMER
// =====================================================

export const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, password, sponsorCode, position } = req.body;

    // ---------------- VALIDATION ----------------

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and password are required.",
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = String(phone).trim();
    const cleanPassword = String(password);

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required.",
      });
    }

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: "Customer email is required.",
      });
    }

    if (!cleanPhone) {
      return res.status(400).json({
        success: false,
        message: "Customer phone is required.",
      });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Customer password must be at least 6 characters.",
      });
    }

    // ---------------- DUPLICATE CHECKS ----------------

    const existingEmail = await User.findOne({ email: cleanEmail });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "A customer with this email already exists.",
      });
    }

    const existingPhone = await User.findOne({ phone: cleanPhone });

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "A customer with this phone number already exists.",
      });
    }

    // ---------------- GENERATE MEMBER CODE ----------------

    let memberNumber = 681909;

    const latestUser = await User.findOne({ memberId: /^SI\d+$/i })
      .sort({ memberId: -1 })
      .lean();

    if (latestUser?.memberId) {
      const parsed = Number(String(latestUser.memberId).replace(/^SI/i, ""));

      if (Number.isFinite(parsed)) {
        memberNumber = parsed + 1;
      }
    }

    let memberCode = `SI${memberNumber}`;

    while (
      await User.exists({
        $or: [{ memberId: memberCode }, { userCode: memberCode }],
      })
    ) {
      memberNumber++;
      memberCode = `SI${memberNumber}`;
    }

    // ---------------- HASH PASSWORD ----------------

    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    // ---------------- SPONSOR ----------------

    let sponsorUser = null;

    if (sponsorCode && String(sponsorCode).trim()) {
      const cleanSponsorCode = String(sponsorCode).trim().toUpperCase();

      sponsorUser = await User.findOne({
        $or: [{ userCode: cleanSponsorCode }, { memberId: cleanSponsorCode }],
      });
    }

    // ---------------- POSITION ----------------

    const cleanPosition = position === "right" ? "right" : "left";

    // ---------------- USER ----------------

    const newUser = new User({
      memberId: memberCode,
      userCode: memberCode,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: passwordHash,
      role: "user",
      status: "active",

      sponsorId: sponsorUser?._id || null,
      sponsorCode: sponsorUser?.userCode || sponsorUser?.memberId || "",
      sponsorMemberId: sponsorUser?.memberId || "",

      treePath: sponsorUser
        ? `${sponsorUser.treePath || "/"}${
            sponsorUser.memberId || sponsorUser.userCode
          }/`
        : "/",

      level: sponsorUser ? Number(sponsorUser.level || 1) + 1 : 1,

      position: cleanPosition,
      userType: "UNPAID",
      activationDate: null,
      joiningPackage: "",
      rank: "Distributor",
      dateOfEntry: new Date(),

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

    // ---------------- MONGODB TRANSACTION ----------------

    const session = await mongoose.startSession();

    let savedUser;

    try {
      await session.withTransaction(async () => {
        savedUser = await newUser.save({ session });

        await Wallet.create(
          [
            {
              userId: savedUser._id,
              memberId: savedUser.memberId,
              currentBalance: 50,
              totalEarnings: 50,
              captchaEarnings: 0,
              referralCommissions: 0,
              totalWithdrawn: 0,
              todayCaptchasSolved: 0,
              lastCaptchaDate: new Date().toISOString(),
            },
          ],
          { session }
        );

        // Welcome credit
        await Transaction.create(
          [
            {
              userId: savedUser._id,
              memberId: savedUser.memberId,
              type: "credit",
              category: "other",
              amount: 50,
              grossAmount: 50,
              netAmount: 50,
              balanceAfter: 50,
              status: "completed",
              description: "Welcome wallet credit",
              createdBy: getAdminId(req),
              timestamp: new Date(),
            },
          ],
          { session }
        );

        // Update sponsor counts
        if (sponsorUser) {
          await User.updateOne(
            { _id: sponsorUser._id },
            {
              $inc: {
                directReferralsCount: 1,
                totalReferral: 1,
                teamCount: 1,
                totalTeam: 1,
                ...(cleanPosition === "left" ? { leftCount: 1 } : { rightCount: 1 }),
              },
            },
            { session }
          );
        }
      });
    } finally {
      await session.endSession();
    }

    // ---------------- SEND WELCOME EMAIL ----------------

    let welcomeEmailSent = false;

    try {
      await sendCustomerWelcomeEmail({
        email: savedUser.email,
        name: savedUser.name,
        memberId: savedUser.memberId,
      });

      welcomeEmailSent = true;

      console.log(`✅ Welcome email sent to ${savedUser.email}`);
    } catch (emailError) {
      console.error(
        `⚠️ Welcome email failed for ${savedUser.email}:`,
        emailError.message
      );
    }

    // ---------------- RESPONSE ----------------

    return res.status(201).json({
      success: true,

      message: welcomeEmailSent
        ? "Customer created successfully. Welcome email sent."
        : "Customer created successfully, but the welcome email could not be sent.",

      emailSent: welcomeEmailSent,

      user: {
        ...getSafeUser(savedUser),
        accountId: savedUser._id,
        memberId: savedUser.memberId,
        userCode: savedUser.userCode,

        // Returned only in this response. Never stored in plain text.
        password: cleanPassword,
      },
    });
  } catch (error) {
    console.error("❌ Create customer error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A customer with the same unique information already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create customer.",
    });
  }
};

// =====================================================
// RESET CUSTOMER PASSWORD
// =====================================================

export const resetCustomerPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required.",
      });
    }

    if (newPassword === undefined || newPassword === null) {
      return res.status(400).json({
        success: false,
        message: "New password is required.",
      });
    }

    const cleanPassword = String(newPassword);

    if (cleanPassword.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be empty.",
      });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters.",
      });
    }

    const user = await findCustomerByIdentifier(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    user.password = await bcrypt.hash(cleanPassword, 10);
    user.updatedAt = new Date();

    await user.save();

    return res.json({
      success: true,
      message: "Customer password updated successfully.",
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error("❌ Reset customer password error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reset customer password.",
    });
  }
};

// =====================================================
// GET CUSTOMER DETAILS
// =====================================================

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

    // ===================================================
    // LOAD CUSTOMER WALLET + TRANSACTIONS + SALES
    // ===================================================

    const [wallet, allTransactions, sales] =
      await Promise.all([
        Wallet.findOne({
          userId: user._id,
        }).lean(),

        Transaction.find({
          userId: user._id,
        })
          .sort({
            createdAt: -1,
          })
          .lean(),

        Transaction.find({
          userId: user._id,
          category: "package",
        })
          .sort({
            createdAt: -1,
          })
          .lean(),
      ]);

    // ===================================================
    // COMPLETED TRANSACTIONS
    // ===================================================

    const completedTransactions =
      allTransactions.filter(
        (transaction) =>
          String(
            transaction?.status || ""
          ).toLowerCase() === "completed"
      );

    // ===================================================
    // BINARY INCOME
    // ===================================================

    const binaryIncomeTransactions =
      completedTransactions.filter(
        (transaction) =>
          String(
            transaction?.type || ""
          ).toLowerCase() ===
          "binary_income"
      );

    const binaryIncome =
      binaryIncomeTransactions.reduce(
        (total, transaction) => {
          return (
            total +
            Number(
              transaction?.amount ??
                transaction?.netAmount ??
                0
            )
          );
        },
        0
      );

    const binaryPairCount =
      binaryIncomeTransactions.length;

    // ===================================================
    // CAPTCHA INCOME
    // ===================================================

    const captchaIncomeTransactions =
      completedTransactions.filter(
        (transaction) =>
          String(
            transaction?.type || ""
          ).toLowerCase() ===
          "captcha_reward"
      );

    const transactionCaptchaIncome =
      captchaIncomeTransactions.reduce(
        (total, transaction) => {
          return (
            total +
            Number(
              transaction?.amount ??
                transaction?.netAmount ??
                0
            )
          );
        },
        0
      );

    // ===================================================
    // REFERRAL BONUS INCOME
    // ===================================================

    const referralBonusTransactions =
      completedTransactions.filter(
        (transaction) =>
          String(
            transaction?.type || ""
          ).toLowerCase() ===
          "referral_bonus"
      );

    const referralBonusIncome =
      referralBonusTransactions.reduce(
        (total, transaction) => {
          return (
            total +
            Number(
              transaction?.amount ??
                transaction?.netAmount ??
                0
            )
          );
        },
        0
      );

    // ===================================================
    // WITHDRAWAL INFORMATION
    // ===================================================

    const pendingWithdrawalTransactions =
      allTransactions.filter(
        (transaction) => {
          const type = String(
            transaction?.type || ""
          ).toLowerCase();

          const category = String(
            transaction?.category || ""
          ).toLowerCase();

          const status = String(
            transaction?.status || ""
          ).toLowerCase();

          return (
            (type === "withdrawal" ||
              category === "withdrawal") &&
            status === "pending"
          );
        }
      );

    const pendingWithdrawalsAmount =
      pendingWithdrawalTransactions.reduce(
        (total, transaction) => {
          return (
            total +
            Number(
              transaction?.netAmount ??
                transaction?.amount ??
                0
            )
          );
        },
        0
      );

    // ===================================================
    // WALLET VALUES
    // ===================================================

    const currentBalance = Number(
      wallet?.currentBalance || 0
    );

    const totalEarnings = Number(
      wallet?.totalEarnings || 0
    );

    const captchaEarnings =
      Number(
        wallet?.captchaEarnings ??
          transactionCaptchaIncome ??
          0
      );

    const referralCommissions =
      Number(
        wallet?.referralCommissions ??
          referralBonusIncome ??
          0
      );

    const totalWithdrawn =
      Number(
        wallet?.totalWithdrawn || 0
      );

    // ===================================================
    // USER INCOME VALUES
    // ===================================================

    const matchingIncome =
      Number(
        user?.matchingIncome || 0
      );

    const todayMatchingIncome =
      Number(
        user?.todayMatchingIncome || 0
      );

    const franchiseReferralIncome =
      Number(
        user?.franchiseReferralIncome || 0
      );

    const franchiseMatchingIncome =
      Number(
        user?.franchiseMatchingIncome || 0
      );

    const totalIncome =
      Number(
        user?.totalIncome || 0
      );

    // ===================================================
    // BINARY TEAM VALUES
    // ===================================================

    const leftCount =
      Number(
        user?.leftCount || 0
      );

    const rightCount =
      Number(
        user?.rightCount || 0
      );

    const totalTeam =
      Number(
        user?.totalTeam ??
          user?.teamCount ??
          leftCount + rightCount
      );

    const activeTeam =
      Number(
        user?.activeTeam || 0
      );

    const leftBusiness =
      Number(
        user?.leftBusiness || 0
      );

    const rightBusiness =
      Number(
        user?.rightBusiness || 0
      );

    const leftPv =
      Number(
        user?.leftPv || 0
      );

    const rightPv =
      Number(
        user?.rightPv || 0
      );

    const leftCarryForwardPv =
      Number(
        user?.leftCarryForwardPv || 0
      );

    const rightCarryForwardPv =
      Number(
        user?.rightCarryForwardPv || 0
      );

    // ===================================================
    // SAFE USER DATA
    // ===================================================

    const safeUser = {
      ...getSafeUser(user),

      /*
       * Explicitly return binary fields so the admin
       * customer-details frontend can display them.
       */
      binaryParentId:
        user?.binaryParentId || null,

      binaryPosition:
        user?.binaryPosition || null,

      binaryLeftId:
        user?.binaryLeftId || null,

      binaryRightId:
        user?.binaryRightId || null,

      binaryLevel:
        user?.binaryLevel ?? null,

      binaryPath:
        user?.binaryPath || "",

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

    // ===================================================
    // CUSTOMER STATS
    // ===================================================

    const stats = {
      // ---------------- WALLET ----------------

      currentBalance,
      walletBalance:
        currentBalance,

      totalEarnings,

      totalWithdrawn,

      pendingWithdrawals:
        pendingWithdrawalsAmount,

      pendingWithdrawalsCount:
        pendingWithdrawalTransactions.length,

      captchaEarnings,

      referralCommissions,

      // ---------------- INCOME ----------------

      binaryIncome,

      totalBinaryIncome:
        binaryIncome,

      binaryPairCount,

      completedBinaryPairs:
        binaryPairCount,

      completedPairs:
        binaryPairCount,

      matchingIncome,

      todayMatchingIncome,

      franchiseReferralIncome,

      franchiseMatchingIncome,

      totalIncome,

      // ---------------- CAPTCHA ----------------

      totalCaptchaPaid:
        transactionCaptchaIncome,

      // ---------------- REFERRAL ----------------

      totalReferralPaid:
        referralBonusIncome,

      // ---------------- BINARY TEAM ----------------

      leftCount,

      rightCount,

      binaryLeftCount:
        leftCount,

      binaryRightCount:
        rightCount,

      totalTeam,

      binaryTotalTeam:
        totalTeam,

      activeTeam,

      leftBusiness,
      rightBusiness,

      leftPv,
      rightPv,

      leftCarryForwardPv,
      rightCarryForwardPv,

      binaryParentId:
        user?.binaryParentId || null,

      binaryPosition:
        user?.binaryPosition || null,

      binaryLeftId:
        user?.binaryLeftId || null,

      binaryRightId:
        user?.binaryRightId || null,

      // ---------------- PACKAGE ----------------

      salesCount:
        sales.length,

      // ---------------- TRANSACTION COUNTS ----------------

      totalTransactions:
        allTransactions.length,

      completedTransactions:
        completedTransactions.length,

      binaryIncomeTransactions:
        binaryIncomeTransactions.length,

      captchaIncomeTransactions:
        captchaIncomeTransactions.length,

      referralBonusTransactions:
        referralBonusTransactions.length,
    };

    // ===================================================
    // RECENT TRANSACTIONS
    // ===================================================

    const recentTransactions =
      allTransactions
        .slice(0, 50)
        .map((transaction) => ({
          ...transaction,

          /*
           * Helpful readable label for admin frontend.
           */
          displayType:
            String(
              transaction?.type || ""
            ).toLowerCase() ===
            "binary_income"
              ? "Binary Income"
              : String(
                  transaction?.type || ""
                ).toLowerCase() ===
                "captcha_reward"
              ? "CAPTCHA Reward"
              : String(
                  transaction?.type || ""
                ).toLowerCase() ===
                "referral_bonus"
              ? "Referral Bonus"
              : transaction?.type ||
                transaction?.category ||
                "Transaction",
        }));

    // ===================================================
    // RESPONSE
    // ===================================================

    return res.json({
      success: true,

      user: safeUser,

      customer: safeUser,

      wallet,

      stats,

      sales,

      transactions: recentTransactions,

      /*
       * Helpful shortcut for the admin UI.
       */
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

        parentId:
          user?.binaryParentId || null,

        position:
          user?.binaryPosition || null,

        leftId:
          user?.binaryLeftId || null,

        rightId:
          user?.binaryRightId || null,

        completedPairs:
          binaryPairCount,

        income:
          binaryIncome,
      },
    });
  } catch (error) {
    console.error(
      "❌ Get customer details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch customer details.",
    });
  }
};

// =====================================================
// UPDATE CUSTOMER
// =====================================================

const UPDATABLE_CUSTOMER_FIELDS = [
  "name",
  "email",
  "phone",
  "sponsorCode",
  "sponsorMemberId",
  "userType",
  "activationDate",
  "joiningPackage",
  "rank",
  "position",
  "panNumber",
  "panVerified",
  "status",
  "leftCount",
  "rightCount",
  "leftBusiness",
  "rightBusiness",
  "totalReferral",
  "activeReferral",
  "leftPv",
  "rightPv",
  "leftCarryForwardPv",
  "rightCarryForwardPv",
  "totalTeam",
  "activeTeam",
  "teamPercent",
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

    for (const field of UPDATABLE_CUSTOMER_FIELDS) {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    }

    // Bank details
    if (req.body.bankDetails) {
      user.bankDetails = {
        ...(user.bankDetails
          ? user.bankDetails.toObject?.() || user.bankDetails
          : {}),
        ...req.body.bankDetails,
      };
    }

    user.updatedAt = new Date();

    await user.save();

    return res.json({
      success: true,
      message: "Customer updated successfully.",
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error("❌ Update customer error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email, phone, member ID or user code already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update customer.",
    });
  }
};

// =====================================================
// TOGGLE CUSTOMER STATUS
// =====================================================

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

    user.status = user.status === "active" ? "inactive" : "active";
    user.updatedAt = new Date();

    await user.save();

    return res.json({
      success: true,
      message: `Customer ${
        user.status === "active" ? "activated" : "deactivated"
      } successfully.`,
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error("❌ Toggle customer status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update customer status.",
    });
  }
};

// =====================================================
// IMPERSONATE CUSTOMER
// =====================================================

export const impersonateCustomer = async (req, res) => {
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT authentication configuration is missing.",
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

    const token = jwt.sign(
      {
        id: String(user._id),
        memberId: user.memberId,
        userCode: user.userCode,
        role: user.role,
        name: user.name,
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
    console.error("❌ Impersonate customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to impersonate customer.",
    });
  }
};

// =====================================================
// DELETE CUSTOMER
// =====================================================

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await findCustomerByIdentifier(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (user.role === "admin" || user.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be deleted from customer management.",
      });
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await User.deleteOne({ _id: user._id }, { session });
        await Wallet.deleteMany({ userId: user._id }, { session });
        await CaptchaAttempt.deleteMany({ userId: user._id }, { session });
        await Transaction.deleteMany({ userId: user._id }, { session });

        // Update sponsor counts
        if (user.sponsorId) {
          const decrementFields = {
            directReferralsCount: -1,
            totalReferral: -1,
            teamCount: -1,
            totalTeam: -1,
          };

          if (user.position === "left") {
            decrementFields.leftCount = -1;
          } else {
            decrementFields.rightCount = -1;
          }

          await User.updateOne(
            { _id: user.sponsorId },
            { $inc: decrementFields },
            { session }
          );
        }
      });
    } finally {
      await session.endSession();
    }

    return res.json({
      success: true,
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    console.error("❌ Delete customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete customer.",
    });
  }
};