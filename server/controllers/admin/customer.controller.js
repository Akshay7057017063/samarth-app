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
  customerFilter,
  findCustomerByIdentifier,
  getAdminId,
  getSafeUser,
} from "../../utils/adminHelpers.js";

import { sendActivationPinEmail } from "../../utils/mailer.js";

const JWT_SECRET =
  process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn(
    "⚠️ JWT_SECRET is not defined. Admin impersonation will not work."
  );
}

/* =====================================================
   GET USERS / CUSTOMERS
===================================================== */

export const getUsers = async (
  req,
  res
) => {
  try {
    const users =
      await User.find(customerFilter)
        .select("-password")
        .sort({ createdAt: -1 })
        .lean();

    return res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(
      "❌ Get users error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch users.",
    });
  }
};

/* =====================================================
   CREATE CUSTOMER
===================================================== */

/*
 * This endpoint is retained for backward compatibility
 * with the admin customer-management UI.
 *
 * IMPORTANT:
 *
 * Admin-created customers are now also created as:
 *
 *   status = inactive
 *   activationDate = null
 *   wallet = ₹0
 *
 * The customer cannot login until the activation PIN
 * flow is completed.
 *
 * Existing customer registration from the member
 * dashboard continues to use /referral/register.
 */

export const createCustomer = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      sponsorCode,
      position,
    } = req.body || {};

    /* -----------------------------------------------
       VALIDATION
    ------------------------------------------------ */

    if (
      !name ||
      !email ||
      !phone ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone and password are required.",
      });
    }

    const cleanName =
      String(name).trim();

    const cleanEmail =
      String(email)
        .trim()
        .toLowerCase();

    const cleanPhone =
      String(phone).trim();

    const cleanPassword =
      String(password);

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message:
          "Customer name is required.",
      });
    }

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Customer email is required.",
      });
    }

    if (!cleanPhone) {
      return res.status(400).json({
        success: false,
        message:
          "Customer phone is required.",
      });
    }

    if (
      cleanPassword.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Customer password must be at least 6 characters.",
      });
    }

    /* -----------------------------------------------
       GENERATE MEMBER CODE
    ------------------------------------------------ */

    let memberNumber =
      681909;

    const latestUser =
      await User.findOne({
        memberId: /^SI\d+$/i,
      })
        .sort({
          memberId: -1,
        })
        .lean();

    if (latestUser?.memberId) {
      const parsed =
        Number(
          String(
            latestUser.memberId
          ).replace(
            /^SI/i,
            ""
          )
        );

      if (
        Number.isFinite(parsed)
      ) {
        memberNumber =
          parsed + 1;
      }
    }

    let memberCode =
      `SI${memberNumber}`;

    while (
      await User.exists({
        $or: [
          {
            memberId:
              memberCode,
          },
          {
            userCode:
              memberCode,
          },
        ],
      })
    ) {
      memberNumber++;
      memberCode =
        `SI${memberNumber}`;
    }

    /* -----------------------------------------------
       HASH PASSWORD
    ------------------------------------------------ */

    const passwordHash =
      await bcrypt.hash(
        cleanPassword,
        10
      );

    /* -----------------------------------------------
       SPONSOR
    ------------------------------------------------ */

    let sponsorUser =
      null;

    if (
      sponsorCode &&
      String(sponsorCode).trim()
    ) {
      const cleanSponsorCode =
        String(
          sponsorCode
        )
          .trim()
          .toUpperCase();

      sponsorUser =
        await User.findOne({
          $or: [
            {
              userCode:
                cleanSponsorCode,
            },
            {
              memberId:
                cleanSponsorCode,
            },
          ],
        });
    }

    /* -----------------------------------------------
       POSITION
    ------------------------------------------------ */

    const cleanPosition =
      String(
        position || ""
      ).trim().toLowerCase() ===
      "right"
        ? "right"
        : "left";

    /* -----------------------------------------------
       USER
    ------------------------------------------------ */

    const newUser =
      new User({
        memberId:
          memberCode,

        userCode:
          memberCode,

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

        /*
         * IMPORTANT:
         * Admin-created accounts are inactive.
         */
        status:
          "inactive",

        sponsorId:
          sponsorUser?._id ||
          null,

        sponsorCode:
          sponsorUser?.userCode ||
          sponsorUser?.memberId ||
          "",

        sponsorMemberId:
          sponsorUser?.memberId ||
          "",

        treePath:
          sponsorUser
            ? `${sponsorUser.treePath || "/"}${
                sponsorUser.memberId ||
                sponsorUser.userCode
              }/`
            : "/",

        level:
          sponsorUser
            ? Number(
                sponsorUser.level || 1
              ) + 1
            : 1,

        position:
          cleanPosition,

        userType:
          "UNPAID",

        activationDate:
          null,

        joiningPackage:
          "",

        rank:
          "Distributor",

        dateOfEntry:
          new Date(),

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
      });

    /* -----------------------------------------------
       MONGODB TRANSACTION
    ------------------------------------------------ */

    const session =
      await mongoose.startSession();

    let savedUser;

    try {
      await session.withTransaction(
        async () => {
          savedUser =
            await newUser.save({
              session,
            });

          /*
           * New inactive accounts start with ₹0.
           *
           * NO welcome bonus is created here.
           */
          await Wallet.create(
            [
              {
                userId:
                  savedUser._id,

                memberId:
                  savedUser.memberId,

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
                  null,
              },
            ],
            {
              session,
            }
          );

          /*
           * No ₹50 transaction here.
           *
           * The ₹50 welcome bonus is issued exactly once
           * by /auth/activate after PIN verification.
           */

          /* -----------------------------------------
             SPONSOR COUNTS
          ------------------------------------------ */

          if (sponsorUser) {
            await User.updateOne(
              {
                _id:
                  sponsorUser._id,
              },
              {
                $inc: {
                  directReferralsCount:
                    1,

                  totalReferral:
                    1,

                  teamCount:
                    1,

                  totalTeam:
                    1,

                  ...(cleanPosition ===
                  "left"
                    ? {
                        leftCount:
                          1,
                      }
                    : {
                        rightCount:
                          1,
                      }),
                },
              },
              {
                session,
              }
            );
          }
        }
      );
    } finally {
      await session.endSession();
    }

    /* -----------------------------------------------
       RESPONSE
    ------------------------------------------------ */

    const [emailAccountCount, phoneAccountCount] =
      await Promise.all([
        User.countDocuments({
          email: cleanEmail,
          role: "user",
        }),
        User.countDocuments({
          phone: cleanPhone,
          role: "user",
        }),
      ]);

    return res.status(201).json({
      success:
        true,

      message:
        `Customer created successfully as an inactive account. Send an activation PIN to activate the account. Accounts with this mobile number: ${phoneAccountCount}. Accounts with this email: ${emailAccountCount}.`,

      accountCounts: {
        phone: phoneAccountCount,
        email: emailAccountCount,
      },

      emailSent:
        false,

      user: {
        ...getSafeUser(
          savedUser
        ),

        accountId:
          savedUser._id,

        memberId:
          savedUser.memberId,

        userCode:
          savedUser.userCode,

        /*
         * Kept for backward compatibility with existing
         * admin UI. This is NOT stored in plain text.
         *
         * IMPORTANT:
         * The password still cannot be used for login while
         * the account is inactive.
         */
        password:
          cleanPassword,
      },
    });
  } catch (error) {
    console.error(
      "❌ Create customer error:",
      error
    );

    if (
      error?.code === 11000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A customer with the same member ID or user code already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to create customer.",
    });
  }
};

/* =====================================================
   RESET CUSTOMER PASSWORD
===================================================== */

export const resetCustomerPassword =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        newPassword,
      } = req.body || {};

      if (!id) {
        return res.status(400).json({
          success: false,
          message:
            "Customer ID is required.",
        });
      }

      if (
        newPassword ===
          undefined ||
        newPassword ===
          null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "New password is required.",
        });
      }

      const cleanPassword =
        String(newPassword);

      if (
        cleanPassword
          .trim()
          .length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "New password cannot be empty.",
        });
      }

      if (
        cleanPassword.length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be at least 6 characters.",
        });
      }

      const user =
        await findCustomerByIdentifier(
          id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Customer not found.",
        });
      }

      user.password =
        await bcrypt.hash(
          cleanPassword,
          10
        );

      user.updatedAt =
        new Date();

      await user.save();

      return res.json({
        success:
          true,
        message:
          "Customer password updated successfully.",
        user:
          getSafeUser(user),
      });
    } catch (error) {
      console.error(
        "❌ Reset customer password error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to reset customer password.",
      });
    }
  };

/* =====================================================
   GET CUSTOMER DETAILS
===================================================== */

export const getCustomerDetails =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const user =
        await findCustomerByIdentifier(
          id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Customer not found.",
        });
      }

      /* -----------------------------------------------
         WALLET + TRANSACTIONS + SALES
      ------------------------------------------------ */

      const [
        wallet,
        allTransactions,
        sales,
      ] = await Promise.all([
        Wallet.findOne({
          userId:
            user._id,
        }).lean(),

        Transaction.find({
          userId:
            user._id,
        })
          .sort({
            createdAt: -1,
          })
          .lean(),

        Transaction.find({
          userId:
            user._id,
          category:
            "package",
        })
          .sort({
            createdAt: -1,
          })
          .lean(),
      ]);

      /* -----------------------------------------------
         COMPLETED TRANSACTIONS
      ------------------------------------------------ */

      const completedTransactions =
        allTransactions.filter(
          (transaction) =>
            String(
              transaction?.status ||
                ""
            ).toLowerCase() ===
            "completed"
        );

      /* -----------------------------------------------
         BINARY INCOME
      ------------------------------------------------ */

      const binaryIncomeTransactions =
        completedTransactions.filter(
          (transaction) =>
            String(
              transaction?.type ||
                ""
            ).toLowerCase() ===
            "binary_income"
        );

      const binaryIncome =
        binaryIncomeTransactions.reduce(
          (
            total,
            transaction
          ) =>
            total +
            Number(
              transaction?.amount ??
                transaction?.netAmount ??
                0
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
            String(
              transaction?.type ||
                ""
            ).toLowerCase() ===
            "captcha_reward"
        );

      const transactionCaptchaIncome =
        captchaIncomeTransactions.reduce(
          (
            total,
            transaction
          ) =>
            total +
            Number(
              transaction?.amount ??
                transaction?.netAmount ??
                0
            ),
          0
        );

      /* -----------------------------------------------
         REFERRAL BONUS
      ------------------------------------------------ */

      const referralBonusTransactions =
        completedTransactions.filter(
          (transaction) =>
            String(
              transaction?.type ||
                ""
            ).toLowerCase() ===
            "referral_bonus"
        );

      const referralBonusIncome =
        referralBonusTransactions.reduce(
          (
            total,
            transaction
          ) =>
            total +
            Number(
              transaction?.amount ??
                transaction?.netAmount ??
                0
            ),
          0
        );

      /* -----------------------------------------------
         WITHDRAWAL INFORMATION
      ------------------------------------------------ */

      const pendingWithdrawalTransactions =
        allTransactions.filter(
          (transaction) => {
            const type =
              String(
                transaction?.type ||
                  ""
              ).toLowerCase();

            const category =
              String(
                transaction?.category ||
                  ""
              ).toLowerCase();

            const status =
              String(
                transaction?.status ||
                  ""
              ).toLowerCase();

            return (
              (
                type ===
                  "withdrawal" ||
                category ===
                  "withdrawal"
              ) &&
              status ===
                "pending"
            );
          }
        );

      const pendingWithdrawalsAmount =
        pendingWithdrawalTransactions.reduce(
          (
            total,
            transaction
          ) =>
            total +
            Number(
              transaction?.netAmount ??
                transaction?.amount ??
                0
            ),
          0
        );

      /* -----------------------------------------------
         WALLET VALUES
      ------------------------------------------------ */

      const currentBalance =
        Number(
          wallet?.currentBalance ||
            0
        );

      const totalEarnings =
        Number(
          wallet?.totalEarnings ||
            0
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
          wallet?.totalWithdrawn ||
            0
        );

      /* -----------------------------------------------
         USER INCOME VALUES
      ------------------------------------------------ */

      const matchingIncome =
        Number(
          user?.matchingIncome ||
            0
        );

      const todayMatchingIncome =
        Number(
          user?.todayMatchingIncome ||
            0
        );

      const franchiseReferralIncome =
        Number(
          user?.franchiseReferralIncome ||
            0
        );

      const franchiseMatchingIncome =
        Number(
          user?.franchiseMatchingIncome ||
            0
        );

      const totalIncome =
        Number(
          user?.totalIncome ||
            0
        );

      /* -----------------------------------------------
         BINARY TEAM VALUES
      ------------------------------------------------ */

      const leftCount =
        Number(
          user?.leftCount ||
            0
        );

      const rightCount =
        Number(
          user?.rightCount ||
            0
        );

      const totalTeam =
        Number(
          user?.totalTeam ??
            user?.teamCount ??
            leftCount +
              rightCount
        );

      const activeTeam =
        Number(
          user?.activeTeam ||
            0
        );

      const leftBusiness =
        Number(
          user?.leftBusiness ||
            0
        );

      const rightBusiness =
        Number(
          user?.rightBusiness ||
            0
        );

      const leftPv =
        Number(
          user?.leftPv ||
            0
        );

      const rightPv =
        Number(
          user?.rightPv ||
            0
        );

      const leftCarryForwardPv =
        Number(
          user?.leftCarryForwardPv ||
            0
        );

      const rightCarryForwardPv =
        Number(
          user?.rightCarryForwardPv ||
            0
        );

      /* -----------------------------------------------
         SAFE USER DATA
      ------------------------------------------------ */

      const safeUser = {
        ...getSafeUser(
          user
        ),

        binaryParentId:
          user?.binaryParentId ||
          null,

        binaryPosition:
          user?.binaryPosition ||
          null,

        binaryLeftId:
          user?.binaryLeftId ||
          null,

        binaryRightId:
          user?.binaryRightId ||
          null,

        binaryLevel:
          user?.binaryLevel ??
          null,

        binaryPath:
          user?.binaryPath ||
          "",

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
         CUSTOMER STATS
      ------------------------------------------------ */

      const stats = {
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

        totalCaptchaPaid:
          transactionCaptchaIncome,

        totalReferralPaid:
          referralBonusIncome,

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
          user?.binaryParentId ||
          null,

        binaryPosition:
          user?.binaryPosition ||
          null,

        binaryLeftId:
          user?.binaryLeftId ||
          null,

        binaryRightId:
          user?.binaryRightId ||
          null,

        salesCount:
          sales.length,

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

      /* -----------------------------------------------
         RECENT TRANSACTIONS
      ------------------------------------------------ */

      const recentTransactions =
        allTransactions
          .slice(0, 50)
          .map(
            (
              transaction
            ) => ({
              ...transaction,

              displayType:
                String(
                  transaction?.type ||
                    ""
                ).toLowerCase() ===
                "binary_income"
                  ? "Binary Income"
                  : String(
                      transaction?.type ||
                        ""
                    ).toLowerCase() ===
                    "captcha_reward"
                  ? "CAPTCHA Reward"
                  : String(
                      transaction?.type ||
                        ""
                    ).toLowerCase() ===
                    "referral_bonus"
                  ? "Referral Bonus"
                  : transaction?.type ||
                    transaction?.category ||
                    "Transaction",
            })
          );

      /* -----------------------------------------------
         RESPONSE
      ------------------------------------------------ */

      return res.json({
        success:
          true,

        user:
          safeUser,

        customer:
          safeUser,

        wallet,

        stats,

        sales,

        transactions:
          recentTransactions,

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
            user?.binaryParentId ||
            null,

          position:
            user?.binaryPosition ||
            null,

          leftId:
            user?.binaryLeftId ||
            null,

          rightId:
            user?.binaryRightId ||
            null,

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

/* =====================================================
   UPDATE CUSTOMER
===================================================== */

const UPDATABLE_CUSTOMER_FIELDS = [
  "name",
  "email",
  "phone",
  "sponsorCode",
  "sponsorMemberId",
  "joiningPackage",
  "rank",
  "position",
  "panNumber",
  "panVerified",
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

export const updateCustomer =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const user =
        await findCustomerByIdentifier(
          id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Customer not found.",
        });
      }

      /* -----------------------------------------------
         STATUS GUARD
      ------------------------------------------------ */

      if (
        req.body?.status !==
        undefined
      ) {
        const requestedStatus =
          String(
            req.body.status
          )
            .trim()
            .toLowerCase();

        if (
          ![
            "active",
            "inactive",
          ].includes(
            requestedStatus
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Customer status must be active or inactive.",
          });
        }

        /*
         * IMPORTANT:
         * An inactive customer cannot be manually activated.
         * Activation must happen through /auth/activate using
         * the emailed activation PIN.
         */
        if (
          user.status ===
            "inactive" &&
          requestedStatus ===
            "active"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Inactive customers must be activated using the activation PIN. Manual activation is disabled.",
          });
        }

        user.status =
          requestedStatus;
      }

      /* -----------------------------------------------
         ACTIVATION DATE GUARD
      ------------------------------------------------ */

      if (
        req.body?.activationDate !==
        undefined
      ) {
        if (
          user.status ===
          "inactive"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Activation date cannot be set for an inactive customer. Use the activation PIN flow.",
          });
        }

        user.activationDate =
          req.body.activationDate
            ? new Date(
                req.body.activationDate
              )
            : null;
      }

      /* -----------------------------------------------
         USER TYPE GUARD
      ------------------------------------------------ */

      if (
        req.body?.userType !==
        undefined
      ) {
        if (
          user.status ===
          "inactive"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "User type for an inactive customer is determined by the activation PIN.",
          });
        }

        const requestedUserType =
          String(
            req.body.userType
          )
            .trim()
            .toUpperCase();

        if (
          [
            "PAID",
            "UNPAID",
          ].includes(
            requestedUserType
          )
        ) {
          user.userType =
            requestedUserType;
        }
      }

      /* -----------------------------------------------
         STANDARD CUSTOMER FIELDS
      ------------------------------------------------ */

      for (
        const field of UPDATABLE_CUSTOMER_FIELDS
      ) {
        if (
          req.body?.[field] !==
          undefined
        ) {
          user[field] =
            req.body[field];
        }
      }

      /* -----------------------------------------------
         BANK DETAILS
      ------------------------------------------------ */

      if (
        req.body?.bankDetails
      ) {
        user.bankDetails = {
          ...(user.bankDetails
            ? user.bankDetails
                .toObject?.() ||
              user.bankDetails
            : {}),
          ...req.body.bankDetails,
        };
      }

      user.updatedAt =
        new Date();

      await user.save();

      return res.json({
        success:
          true,
        message:
          "Customer updated successfully.",
        user:
          getSafeUser(user),
      });
    } catch (error) {
      console.error(
        "❌ Update customer error:",
        error
      );

      if (
        error?.code === 11000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Member ID or user code already exists.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Failed to update customer.",
      });
    }
  };

/* =====================================================
   TOGGLE CUSTOMER STATUS
===================================================== */

export const toggleCustomerStatus =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const user =
        await findCustomerByIdentifier(
          id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Customer not found.",
        });
      }

      /*
       * Active -> Inactive is allowed.
       *
       * Inactive -> Active is NOT allowed here.
       *
       * This prevents admin status toggle from bypassing
       * the activation PIN process.
       */
      if (
        user.status ===
        "inactive"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This customer is inactive. Use Send Activation PIN to activate the account.",
        });
      }

      user.status =
        "inactive";

      user.updatedAt =
        new Date();

      await user.save();

      return res.json({
        success:
          true,
        message:
          "Customer deactivated successfully.",
        user:
          getSafeUser(user),
      });
    } catch (error) {
      console.error(
        "❌ Toggle customer status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update customer status.",
      });
    }
  };

/* =====================================================
   IMPERSONATE CUSTOMER
===================================================== */

export const impersonateCustomer =
  async (req, res) => {
    try {
      if (!JWT_SECRET) {
        return res.status(500).json({
          success: false,
          message:
            "JWT authentication configuration is missing.",
        });
      }

      const { id } =
        req.params;

      const user =
        await findCustomerByIdentifier(
          id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Customer not found.",
        });
      }

      /*
       * Inactive customers must not be impersonated
       * into an active customer session.
       */
      if (
        user.status !==
        "active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Inactive customers cannot be impersonated before activation.",
        });
      }

      const token =
        jwt.sign(
          {
            id: String(
              user._id
            ),

            memberId:
              user.memberId,

            userCode:
              user.userCode,

            role:
              user.role,

            name:
              user.name,

            // Admin impersonation (skips device binding check)
            imp:
              true,
          },
          JWT_SECRET,
          {
            expiresIn:
              "1h",
          }
        );

      return res.json({
        success:
          true,

        message:
          "Customer impersonation token generated.",

        token,

        user:
          getSafeUser(user),
      });
    } catch (error) {
      console.error(
        "❌ Impersonate customer error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to impersonate customer.",
      });
    }
  };

/* =====================================================
   DELETE CUSTOMER
===================================================== */

export const deleteCustomer =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const user =
        await findCustomerByIdentifier(
          id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Customer not found.",
        });
      }

      if (
        user.role ===
          "admin" ||
        user.role ===
          "superadmin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin accounts cannot be deleted from customer management.",
        });
      }

      const session =
        await mongoose.startSession();

      try {
        await session.withTransaction(
          async () => {
            await User.deleteOne(
              {
                _id:
                  user._id,
              },
              {
                session,
              }
            );

            await Wallet.deleteMany(
              {
                userId:
                  user._id,
              },
              {
                session,
              }
            );

            await CaptchaAttempt.deleteMany(
              {
                userId:
                  user._id,
              },
              {
                session,
              }
            );

            await Transaction.deleteMany(
              {
                userId:
                  user._id,
              },
              {
                session,
              }
            );

            await ActivationPin.deleteMany(
              {
                userId:
                  user._id,
              },
              {
                session,
              }
            );

            /* -----------------------------------------
               UPDATE SPONSOR COUNTS
            ------------------------------------------ */

            if (
              user.sponsorId
            ) {
              const decrementFields =
                {
                  directReferralsCount:
                    -1,

                  totalReferral:
                    -1,

                  teamCount:
                    -1,

                  totalTeam:
                    -1,
                };

              if (
                user.position ===
                "left"
              ) {
                decrementFields.leftCount =
                  -1;
              } else {
                decrementFields.rightCount =
                  -1;
              }

              await User.updateOne(
                {
                  _id:
                    user.sponsorId,
                },
                {
                  $inc:
                    decrementFields,
                },
                {
                  session,
                }
              );
            }
          }
        );
      } finally {
        await session.endSession();
      }

      return res.json({
        success:
          true,
        message:
          "Customer deleted successfully.",
      });
    } catch (error) {
      console.error(
        "❌ Delete customer error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete customer.",
      });
    }
  };

/* =====================================================
   ACTIVATION PIN (ADMIN)
===================================================== */

/*
 * Admin sends a 6 digit activation PIN to an INACTIVE customer.
 *
 * Rules:
 * - PIN is stored only as a bcrypt hash.
 * - Older unused PINs are invalidated.
 * - PIN is emailed to the customer.
 * - PIN is never returned in the API response.
 * - PIN expires after ACTIVATION_PIN_EXPIRY_HOURS.
 * - Resend cooldown is 60 seconds.
 */

const ACTIVATION_PIN_RESEND_COOLDOWN_SECONDS =
  60;

const issueActivationPin =
  async (
    req,
    res,
    {
      isResend,
    }
  ) => {
    try {
      const { id } =
        req.params;

      const pinType =
        String(
          req.body?.pinType ||
            "unpaid"
        )
          .trim()
          .toLowerCase();

      if (
        ![
          "paid",
          "unpaid",
        ].includes(
          pinType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "PIN type must be paid or unpaid.",
        });
      }

      const customer =
        await findCustomerByIdentifier(
          id
        );

      if (!customer) {
        return res.status(404).json({
          success: false,
          message:
            "Customer not found.",
        });
      }

      if (
        customer.status ===
        "active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Account is already active. Activation PIN is not required.",
        });
      }

      if (
        customer.status !==
        "inactive"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Activation PIN can only be sent to inactive customers.",
        });
      }

      if (
        !customer.email
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

      const lastPin =
        await ActivationPin.findOne(
          {
            userId:
              customer._id,
          }
        )
          .sort({
            createdAt: -1,
          })
          .lean();

      if (
        lastPin?.sentAt
      ) {
        const secondsSinceLast =
          (
            Date.now() -
            new Date(
              lastPin.sentAt
            ).getTime()
          ) / 1000;

        if (
          secondsSinceLast <
          ACTIVATION_PIN_RESEND_COOLDOWN_SECONDS
        ) {
          const wait =
            Math.ceil(
              ACTIVATION_PIN_RESEND_COOLDOWN_SECONDS -
                secondsSinceLast
            );

          return res.status(429).json({
            success:
              false,
            message:
              `Please wait ${wait} seconds before sending another PIN.`,
          });
        }
      }

      /* -----------------------------------------------
         GENERATE PIN
      ------------------------------------------------ */

      const plainPin =
        String(
          crypto.randomInt(
            100000,
            1000000
          )
        );

      const pinHash =
        await bcrypt.hash(
          plainPin,
          10
        );

      const expiresAt =
        new Date(
          Date.now() +
            ACTIVATION_PIN_EXPIRY_HOURS *
              60 *
              60 *
              1000
        );

      let pinRecord;

      const sentAt =
        new Date();

      const session =
        await mongoose.startSession();

      try {
        await session.withTransaction(
          async () => {
            /*
             * Invalidate all older unused PINs.
             */
            await ActivationPin.updateMany(
              {
                userId:
                  customer._id,

                used:
                  false,

                expiresAt:
                  {
                    $gt:
                      new Date(),
                  },
              },
              {
                $set: {
                  expiresAt:
                    new Date(),
                },
              },
              {
                session,
              }
            );

            const created =
              await ActivationPin.create(
                [
                  {
                    userId:
                      customer._id,

                    memberId:
                      customer.memberId,

                    pinHash,

                    pinType,

                    expiresAt,

                    used:
                      false,

                    attempts:
                      0,

                    /*
                     * Set sentAt before email so the record
                     * already has a resend timestamp.
                     */
                    sentAt,

                    createdBy:
                      getAdminId(
                        req
                      ),
                  },
                ],
                {
                  session,
                }
              );

            pinRecord =
              created[0];
          }
        );
      } finally {
        await session.endSession();
      }

      /* -----------------------------------------------
         SEND EMAIL
      ------------------------------------------------ */

      try {
        await sendActivationPinEmail({
          email:
            customer.email,

          name:
            customer.name,

          memberId:
            customer.memberId,

          pin:
            plainPin,

          pinType,

          expiresAt,
        });
      } catch (mailError) {
        console.error(
          "❌ Activation PIN email error:",
          mailError
        );

        /*
         * Remove the newly-created PIN because the customer
         * did not receive it.
         *
         * Older PINs were already invalidated, so the admin
         * can simply send a new PIN after the email issue is
         * resolved.
         */
        await ActivationPin.deleteOne(
          {
            _id:
              pinRecord._id,
          }
        );

        return res.status(502).json({
          success:
            false,
          message:
            "Activation PIN could not be emailed. Please check the SMTP settings and try again.",
        });
      }

      /* -----------------------------------------------
         RESPONSE
      ------------------------------------------------ */

      return res.json({
        success:
          true,

        message:
          isResend
            ? "Activation PIN resent successfully."
            : "Activation PIN sent successfully.",

        memberId:
          customer.memberId,

        email:
          customer.email,

        pinType,

        expiresAt,
      });
    } catch (error) {
      console.error(
        "❌ Send activation PIN error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to send activation PIN.",
      });
    }
  };

export const generateActivationPin =
  (
    req,
    res
  ) =>
    issueActivationPin(
      req,
      res,
      {
        isResend:
          false,
      }
    );

export const resendActivationPin =
  (
    req,
    res
  ) =>
    issueActivationPin(
      req,
      res,
      {
        isResend:
          true,
      }
    );