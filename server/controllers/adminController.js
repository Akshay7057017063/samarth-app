import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { sendMail } from "../utils/mailer.js";

import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
import { Transaction } from "../models/Transaction.js";
import { CaptchaAttempt } from "../models/CaptchaAttempt.js";
import { SiteContent } from "../models/SiteContent.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn(
    "⚠️ JWT_SECRET is not defined. Admin impersonation will not work."
  );
}

// =====================================================
// HELPERS
// =====================================================

// -----------------------------------------------------
// SAFE NUMBER
// -----------------------------------------------------

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

// -----------------------------------------------------
// ESCAPE HTML
// -----------------------------------------------------

const escapeHtml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// -----------------------------------------------------
// SAFE USER
// -----------------------------------------------------

const getSafeUser = (user) => {
  if (!user) {
    return null;
  }

  const safeUser =
    typeof user.toObject === "function"
      ? user.toObject()
      : { ...user };

  delete safeUser.password;

  return safeUser;
};

// -----------------------------------------------------
// CUSTOMER FILTER
// -----------------------------------------------------

const customerFilter = {
  role: {
    $nin: ["admin", "superadmin"],
  },
};

// -----------------------------------------------------
// FIND CUSTOMER BY MONGO ID / MEMBER ID / USER CODE
// -----------------------------------------------------

const findCustomerByIdentifier = async (identifier) => {
  if (
    identifier === undefined ||
    identifier === null
  ) {
    return null;
  }

  const value = String(identifier).trim();

  if (!value) {
    return null;
  }

  let user = null;

  // ---------------------------------------------------
  // 1. TRY MONGODB _id FIRST
  // ---------------------------------------------------

  if (
    mongoose.Types.ObjectId.isValid(value)
  ) {
    user = await User.findById(value);
  }

  // ---------------------------------------------------
  // 2. TRY MEMBER ID / USER CODE
  // ---------------------------------------------------

  if (!user) {
    const normalizedValue =
      value.toUpperCase();

    user = await User.findOne({
      $or: [
        {
          memberId:
            normalizedValue,
        },
        {
          userCode:
            normalizedValue,
        },
      ],
    });
  }

  // ---------------------------------------------------
  // 3. CUSTOMER ROLE VALIDATION
  // ---------------------------------------------------

  if (!user) {
    return null;
  }

  const role = String(
    user.role || "user"
  )
    .trim()
    .toLowerCase();

  // Admin accounts must never be treated as customers.
  if (
    role === "admin" ||
    role === "superadmin"
  ) {
    return null;
  }

  return user;
};
// -----------------------------------------------------
// GET CMS SETTINGS
// -----------------------------------------------------

const getSiteSettings = async () => {
  const content =
    await SiteContent.findOne({
      key: "main",
    }).lean();

  const settings =
    content?.settings || {};

  return {
    captchaLength: Math.min(
      10,
      Math.max(
        4,
        Math.floor(
          toNumber(
            settings.captchaLength,
            6
          )
        )
      )
    ),

    captchaReward: Math.max(
      0,
      toNumber(
        settings.captchaReward,
        0.5
      )
    ),

    dailyCaptchaLimit:
      Math.max(
        1,
        Math.floor(
          toNumber(
            settings.dailyCaptchaLimit,
            50
          )
        )
      ),

    tdsRateWithPan:
      Math.max(
        0,
        toNumber(
          settings.tdsRateWithPan,
          5
        )
      ),

    tdsRateNoPan:
      Math.max(
        0,
        toNumber(
          settings.tdsRateNoPan,
          20
        )
      ),

    adminFeeRate:
      Math.max(
        0,
        toNumber(
          settings.adminFeeRate,
          5
        )
      ),

    minWithdrawalAmount:
      Math.max(
        0,
        toNumber(
          settings.minWithdrawalAmount,
          200
        )
      ),
  };
};

// -----------------------------------------------------
// TODAY DATE KEY
// -----------------------------------------------------

const getTodayDateKey = () => {
  const date = new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// -----------------------------------------------------
// SAFE TRANSACTION
// -----------------------------------------------------

const getSafeTransaction = (
  transaction
) => {
  if (!transaction) {
    return null;
  }

  return typeof transaction.toObject ===
    "function"
    ? transaction.toObject()
    : { ...transaction };
};

// -----------------------------------------------------
// SEND CUSTOMER WELCOME EMAIL
// -----------------------------------------------------

const sendCustomerWelcomeEmail = async ({
  email,
  name,
  memberId,
}) => {
  const safeName =
    escapeHtml(
      name || "Customer"
    );

  const safeEmail =
    escapeHtml(
      email || ""
    );

  const safeMemberId =
    escapeHtml(
      memberId || ""
    );

  const customerFrontendUrl =
    process.env.CUSTOMER_FRONTEND_URL ||
    "http://localhost:5173";

  const safeFrontendUrl =
    String(
      customerFrontendUrl
    ).replace(
      /"/g,
      "&quot;"
    );

  await sendMail({
    to: email,

    subject:
      "Welcome to DIGITAL LYF PVT. LTD. - Registration Successful",

    text: `
Welcome to DIGITAL LYF PVT. LTD.

Hello ${name || "Customer"},

Your registration has been successfully completed.

Your Member ID: ${memberId}
Registered Email: ${email}

You can now access your DIGITAL LYF PVT. LTD. account.

Website:
${customerFrontendUrl}

Thank you for joining DIGITAL LYF PVT. LTD.

Regards,
DIGITAL LYF PVT. LTD.
    `.trim(),

    html: `
      <div
        style="
          margin:0;
          padding:30px 15px;
          background:#f8fafc;
          font-family:Arial,Helvetica,sans-serif;
        "
      >
        <div
          style="
            max-width:600px;
            margin:0 auto;
            background:#ffffff;
            border:1px solid #e2e8f0;
            border-radius:16px;
            overflow:hidden;
          "
        >

          <div
            style="
              padding:25px;
              background:#0f172a;
              color:#ffffff;
              text-align:center;
            "
          >
            <h1
              style="
                margin:0;
                font-size:24px;
              "
            >
              DIGITAL LYF PVT. LTD.
            </h1>

            <p
              style="
                margin:8px 0 0;
                font-size:14px;
                color:#cbd5e1;
              "
            >
              Welcome to our platform
            </p>
          </div>

          <div
            style="
              padding:30px;
            "
          >

            <h2
              style="
                margin:0 0 15px;
                color:#0f172a;
                font-size:22px;
              "
            >
              Welcome, ${safeName}!
            </h2>

            <p
              style="
                margin:0;
                color:#475569;
                font-size:15px;
                line-height:1.7;
              "
            >
              Your registration with
              <strong>
                DIGITAL LYF PVT. LTD.
              </strong>
              has been successfully completed.
            </p>

            <div
              style="
                margin:25px 0;
                padding:20px;
                background:#f8fafc;
                border:1px solid #e2e8f0;
                border-radius:12px;
              "
            >

              <p
                style="
                  margin:0 0 10px;
                  font-size:14px;
                  color:#64748b;
                "
              >
                Your Member ID
              </p>

              <p
                style="
                  margin:0;
                  font-size:26px;
                  font-weight:700;
                  letter-spacing:1px;
                  color:#2563eb;
                "
              >
                ${safeMemberId}
              </p>

              <p
                style="
                  margin:18px 0 0;
                  font-size:14px;
                  color:#64748b;
                "
              >
                Registered Email
              </p>

              <p
                style="
                  margin:5px 0 0;
                  font-size:15px;
                  font-weight:600;
                  color:#0f172a;
                "
              >
                ${safeEmail}
              </p>

            </div>

            <p
              style="
                margin:0 0 20px;
                color:#475569;
                font-size:14px;
                line-height:1.7;
              "
            >
              Your account has been created successfully.
              You can now use your registered credentials
              to access the platform.
            </p>

            <div
              style="
                text-align:center;
              "
            >

              <a
                href="${safeFrontendUrl}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  display:inline-block;
                  padding:13px 24px;
                  background:#2563eb;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:10px;
                  font-size:14px;
                  font-weight:600;
                "
              >
                Visit DIGITAL LYF
              </a>

            </div>

            <p
              style="
                margin:25px 0 0;
                color:#64748b;
                font-size:13px;
                line-height:1.6;
              "
            >
              Thank you for joining
              <strong>
                DIGITAL LYF PVT. LTD.
              </strong>
            </p>

            <p
              style="
                margin:20px 0 0;
                color:#0f172a;
                font-size:14px;
                line-height:1.6;
              "
            >
              Regards,<br />
              <strong>
                DIGITAL LYF PVT. LTD.
              </strong>
            </p>

          </div>
        </div>
      </div>
    `,
  });
};

// =====================================================
// ADMIN STATS
// =====================================================

export const getAdminStats = async (
  req,
  res
) => {
  try {
    // -------------------------------------------------
    // CUSTOMER COUNTS
    // -------------------------------------------------

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      paidUsers,
      unpaidUsers,
    ] = await Promise.all([
      User.countDocuments(
        customerFilter
      ),

      User.countDocuments({
        ...customerFilter,
        status: "active",
      }),

      User.countDocuments({
        ...customerFilter,
        status: {
          $in: [
            "inactive",
            "suspended",
          ],
        },
      }),

      User.countDocuments({
        ...customerFilter,
        userType: "PAID",
      }),

      User.countDocuments({
        ...customerFilter,
        userType: {
          $ne: "PAID",
        },
      }),
    ]);

    // -------------------------------------------------
    // CUSTOMER IDS
    // -------------------------------------------------

    const customers =
      await User.find(
        customerFilter
      )
        .select("_id")
        .lean();

    const customerIds =
      customers.map(
        (customer) =>
          customer._id
      );

    // -------------------------------------------------
    // WALLET STATISTICS
    // -------------------------------------------------

    const walletResult =
      await Wallet.aggregate([
        {
          $match: {
            userId: {
              $in: customerIds,
            },
          },
        },

        {
          $group: {
            _id: null,

            totalCurrentBalance: {
              $sum:
                "$currentBalance",
            },

            totalCaptchaPaid: {
              $sum:
                "$captchaEarnings",
            },

            totalReferralPaid: {
              $sum:
                "$referralCommissions",
            },

            totalWithdrawnFromWallet:
              {
                $sum:
                  "$totalWithdrawn",
              },
          },
        },
      ]);

    const walletStats =
      walletResult[0] || {};

    // -------------------------------------------------
    // SALES STATISTICS
    // -------------------------------------------------

    const salesResult =
      await Transaction.aggregate([
        {
          $match: {
            userId: {
              $in: customerIds,
            },

            category:
              "package",
          },
        },

        {
          $group: {
            _id: null,

            totalSalesCount: {
              $sum: 1,
            },

            totalSalesVolume: {
              $sum: "$amount",
            },
          },
        },
      ]);

    const salesStats =
      salesResult[0] || {};

    // -------------------------------------------------
    // PENDING WITHDRAWALS
    // -------------------------------------------------

    const pendingWithdrawalResult =
      await Transaction.aggregate([
        {
          $match: {
            userId: {
              $in: customerIds,
            },

            type:
              "withdrawal",

            status:
              "pending",
          },
        },

        {
          $group: {
            _id: null,

            count: {
              $sum: 1,
            },

            pendingNet: {
              $sum: {
                $ifNull: [
                  "$netAmount",
                  "$amount",
                ],
              },
            },
          },
        },
      ]);

    const pendingStats =
      pendingWithdrawalResult[0] ||
      {};

    // -------------------------------------------------
    // COMPLETED WITHDRAWALS
    // -------------------------------------------------

    const completedWithdrawalResult =
      await Transaction.aggregate([
        {
          $match: {
            userId: {
              $in: customerIds,
            },

            type:
              "withdrawal",

            status:
              "completed",
          },
        },

        {
          $group: {
            _id: null,

            totalWithdrawnPaid: {
              $sum: {
                $ifNull: [
                  "$netAmount",
                  "$amount",
                ],
              },
            },

            totalTdsDeducted: {
              $sum: {
                $ifNull: [
                  "$tdsAmount",
                  0,
                ],
              },
            },

            totalAdminFee: {
              $sum: {
                $ifNull: [
                  "$adminFee",
                  0,
                ],
              },
            },
          },
        },
      ]);

    const completedStats =
      completedWithdrawalResult[0] ||
      {};

    // -------------------------------------------------
    // CAPTCHA STATISTICS
    // -------------------------------------------------

    const captchaResult =
      await CaptchaAttempt.aggregate([
        {
          $match: {
            userId: {
              $in: customerIds,
            },

            result:
              "correct",

            status:
              "success",
          },
        },

        {
          $group: {
            _id: null,

            totalCorrect: {
              $sum: 1,
            },
          },
        },
      ]);

    const captchaStats =
      captchaResult[0] || {};

    // -------------------------------------------------
    // FINAL RESPONSE
    // -------------------------------------------------

    return res.json({
      success: true,

      stats: {
        // CUSTOMERS
        totalUsers,

        activeUsers,

        inactiveUsers,

        paidUsers,

        unpaidUsers,

        // WALLET
        totalCurrentBalance:
          toNumber(
            walletStats.totalCurrentBalance
          ),

        totalCaptchaPaid:
          toNumber(
            walletStats.totalCaptchaPaid
          ),

        totalReferralPaid:
          toNumber(
            walletStats.totalReferralPaid
          ),

        totalWithdrawnFromWallet:
          toNumber(
            walletStats.totalWithdrawnFromWallet
          ),

        // CAPTCHA
        totalCaptchaCorrect:
          toNumber(
            captchaStats.totalCorrect
          ),

        // SALES
        totalSalesCount:
          toNumber(
            salesStats.totalSalesCount
          ),

        totalSalesVolume:
          toNumber(
            salesStats.totalSalesVolume
          ),

        // WITHDRAWALS
        pendingWithdrawalsCount:
          toNumber(
            pendingStats.count
          ),

        pendingWithdrawalsNet:
          toNumber(
            pendingStats.pendingNet
          ),

        totalWithdrawnPaid:
          toNumber(
            completedStats.totalWithdrawnPaid
          ),

        // FINANCIAL
        totalTdsDeducted:
          toNumber(
            completedStats.totalTdsDeducted
          ),

        totalAdminFee:
          toNumber(
            completedStats.totalAdminFee
          ),

        // BACKWARD COMPATIBILITY
        totalCustomers:
          totalUsers,

        activeCustomers:
          activeUsers,

        inactiveCustomers:
          inactiveUsers,

        totalWalletBalance:
          toNumber(
            walletStats.totalCurrentBalance
          ),

        totalSales:
          toNumber(
            salesStats.totalSalesCount
          ),

        totalSalesAmount:
          toNumber(
            salesStats.totalSalesVolume
          ),

        pendingWithdrawals:
          toNumber(
            pendingStats.count
          ),

        completedWithdrawals:
          toNumber(
            completedStats.totalWithdrawnPaid
          ),
      },
    });
  } catch (error) {
    console.error(
      "❌ Get admin stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch admin statistics.",
    });
  }
};

// =====================================================
// GET USERS / CUSTOMERS
// =====================================================

export const getUsers = async (
  req,
  res
) => {
  try {
    const users =
      await User.find(
        customerFilter
      )
        .select("-password")
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.json({
      success: true,

      count:
        users.length,

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

// =====================================================
// CREATE CUSTOMER
// =====================================================

export const createCustomer =
  async (req, res) => {
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

      // -------------------------------------------------
      // DUPLICATE CHECKS
      // -------------------------------------------------

      const existingEmail =
        await User.findOne({
          email:
            cleanEmail,
        });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message:
            "A customer with this email already exists.",
        });
      }

      const existingPhone =
        await User.findOne({
          phone:
            cleanPhone,
        });

      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message:
            "A customer with this phone number already exists.",
        });
      }

      // -------------------------------------------------
      // GENERATE MEMBER CODE
      // -------------------------------------------------

      let memberNumber =
        681909;

      const latestUser =
        await User.findOne({
          memberId:
            /^SI\d+$/i,
        })
          .sort({
            memberId: -1,
          })
          .lean();

      if (
        latestUser?.memberId
      ) {
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
          Number.isFinite(
            parsed
          )
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

      // -------------------------------------------------
      // HASH PASSWORD
      // -------------------------------------------------

      const passwordHash =
        await bcrypt.hash(
          cleanPassword,
          10
        );

      // -------------------------------------------------
      // SPONSOR
      // -------------------------------------------------

      let sponsorUser =
        null;

      if (
        sponsorCode &&
        String(
          sponsorCode
        ).trim()
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

      // -------------------------------------------------
      // POSITION
      // -------------------------------------------------

      const cleanPosition =
        position === "right"
          ? "right"
          : "left";

      // -------------------------------------------------
      // USER
      // -------------------------------------------------

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

          status:
            "active",

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
                  sponsorUser.level ||
                    1
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

      // -------------------------------------------------
      // MONGODB TRANSACTION
      // -------------------------------------------------

      const session =
        await mongoose.startSession();

      let savedUser;
      let savedWallet;

      try {
        await session.withTransaction(
          async () => {
            savedUser =
              await newUser.save({
                session,
              });

            savedWallet =
              await Wallet.create(
                [
                  {
                    userId:
                      savedUser._id,

                    memberId:
                      savedUser.memberId,

                    currentBalance:
                      50,

                    totalEarnings:
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
                      new Date().toISOString(),
                  },
                ],
                {
                  session,
                }
              );

            // -------------------------------------------
            // WELCOME CREDIT
            // -------------------------------------------

            await Transaction.create(
              [
                {
                  userId:
                    savedUser._id,

                  memberId:
                    savedUser.memberId,

                  type:
                    "credit",

                  category:
                    "other",

                  amount:
                    50,

                  grossAmount:
                    50,

                  netAmount:
                    50,

                  balanceAfter:
                    50,

                  status:
                    "completed",

                  description:
                    "Welcome wallet credit",

                  createdBy:
                    req.user?.id &&
                    mongoose.Types.ObjectId.isValid(
                      req.user.id
                    )
                      ? req.user.id
                      : null,

                  timestamp:
                    new Date(),
                },
              ],
              {
                session,
              }
            );

            // -------------------------------------------
            // UPDATE SPONSOR
            // -------------------------------------------

            if (
              sponsorUser
            ) {
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

      // -------------------------------------------------
      // SEND WELCOME EMAIL
      // -------------------------------------------------

      let welcomeEmailSent =
        false;

      try {
        await sendCustomerWelcomeEmail({
          email:
            savedUser.email,

          name:
            savedUser.name,

          memberId:
            savedUser.memberId,
        });

        welcomeEmailSent =
          true;

        console.log(
          `✅ Welcome email sent to ${savedUser.email}`
        );
      } catch (
        emailError
      ) {
        console.error(
          `⚠️ Welcome email failed for ${savedUser.email}:`,
          emailError.message
        );
      }

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.status(201).json({
        success:
          true,

        message:
          welcomeEmailSent
            ? "Customer created successfully. Welcome email sent."
            : "Customer created successfully, but the welcome email could not be sent.",

        emailSent:
          welcomeEmailSent,

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

          // Returned only in this response.
          // Never stored in plain text.
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
        error.code === 11000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A customer with the same unique information already exists.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Failed to create customer.",
      });
    }
  };

// =====================================================
// RESET CUSTOMER PASSWORD
// =====================================================

export const resetCustomerPassword =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        newPassword,
      } = req.body;

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
        newPassword === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "New password is required.",
        });
      }

      const cleanPassword =
        String(
          newPassword
        );

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

      const passwordHash =
        await bcrypt.hash(
          cleanPassword,
          10
        );

      user.password =
        passwordHash;

      user.updatedAt =
        new Date();

      await user.save();

      return res.json({
        success:
          true,

        message:
          "Customer password updated successfully.",

        user:
          getSafeUser(
            user
          ),
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

// =====================================================
// CAPTCHA STATISTICS - ALL CUSTOMERS
// =====================================================

export const getCaptchaStats =
  async (
    req,
    res
  ) => {
    try {
      const [
        totalAttempts,
        totalCorrect,
        totalWrong,
        totalCaptchaEarningsResult,
        todayAttempts,
        todayCorrect,
        todayWrong,
      ] = await Promise.all([
        CaptchaAttempt.countDocuments({}),

        CaptchaAttempt.countDocuments({
          result:
            "correct",

          status:
            "success",
        }),

        CaptchaAttempt.countDocuments({
          result:
            "wrong",

          status:
            "failed",
        }),

        Wallet.aggregate([
          {
            $group: {
              _id:
                null,

              total: {
                $sum:
                  "$captchaEarnings",
              },
            },
          },
        ]),

        CaptchaAttempt.countDocuments({
          attemptDate:
            getTodayDateKey(),
        }),

        CaptchaAttempt.countDocuments({
          attemptDate:
            getTodayDateKey(),

          result:
            "correct",

          status:
            "success",
        }),

        CaptchaAttempt.countDocuments({
          attemptDate:
            getTodayDateKey(),

          result:
            "wrong",

          status:
            "failed",
        }),
      ]);

      const accuracy =
        totalAttempts > 0
          ? Number(
              (
                (totalCorrect /
                  totalAttempts) *
                100
              ).toFixed(2)
            )
          : 0;

      const users =
        await User.find(
          customerFilter
        )
          .select(
            "_id memberId userCode name email status"
          )
          .sort({
            createdAt:
              -1,
          })
          .lean();

      const userIds =
        users.map(
          (user) =>
            user._id
        );

      const customerAttempts =
        await CaptchaAttempt.aggregate([
          {
            $match: {
              userId: {
                $in:
                  userIds,
              },
            },
          },

          {
            $group: {
              _id:
                "$userId",

              totalAttempts: {
                $sum:
                  1,
              },

              correctAttempts: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$result",
                        "correct",
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },

              wrongAttempts: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$result",
                        "wrong",
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ]);

      const wallets =
        await Wallet.find({
          userId: {
            $in:
              userIds,
          },
        })
          .select(
            "userId captchaEarnings todayCaptchasSolved"
          )
          .lean();

      const attemptMap =
        new Map(
          customerAttempts.map(
            (item) => [
              String(
                item._id
              ),
              item,
            ]
          )
        );

      const walletMap =
        new Map(
          wallets.map(
            (wallet) => [
              String(
                wallet.userId
              ),
              wallet,
            ]
          )
        );

      const customers =
        users.map(
          (user) => {
            const attempt =
              attemptMap.get(
                String(
                  user._id
                )
              );

            const wallet =
              walletMap.get(
                String(
                  user._id
                )
              );

            const total =
              Number(
                attempt
                  ?.totalAttempts ||
                  0
              );

            const correct =
              Number(
                attempt
                  ?.correctAttempts ||
                  0
              );

            const wrong =
              Number(
                attempt
                  ?.wrongAttempts ||
                  0
              );

            const userAccuracy =
              total > 0
                ? Number(
                    (
                      (correct /
                        total) *
                      100
                    ).toFixed(2)
                  )
                : 0;

            return {
              _id:
                user._id,

              memberId:
                user.memberId ||
                user.userCode ||
                "-",

              name:
                user.name,

              email:
                user.email,

              status:
                user.status,

              totalAttempts:
                total,

              correctAttempts:
                correct,

              wrongAttempts:
                wrong,

              accuracy:
                userAccuracy,

              captchaEarnings:
                toNumber(
                  wallet
                    ?.captchaEarnings
                ),

              todayCaptchasSolved:
                toNumber(
                  wallet
                    ?.todayCaptchasSolved
                ),
            };
          }
        );

      return res.json({
        success:
          true,

        stats: {
          totalAttempts,

          totalCorrect,

          totalWrong,

          accuracy,

          todayAttempts,

          todayCorrect,

          todayWrong,

          totalCaptchaEarnings:
            toNumber(
              totalCaptchaEarningsResult[0]
                ?.total
            ),
        },

        customers,
      });
    } catch (error) {
      console.error(
        "❌ Get captcha stats error:",
        error
      );

      return res.status(500).json({
        success:
          false,
        message:
          "Failed to fetch captcha statistics.",
      });
    }
  };

// =====================================================
// CAPTCHA STATISTICS - SINGLE CUSTOMER
// =====================================================

export const getCustomerCaptchaStats =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      const user =
        await findCustomerByIdentifier(
          id
        );

      if (!user) {
        return res.status(404).json({
          success:
            false,

          message:
            "Customer not found.",
        });
      }

      const [
        totalAttempts,
        totalCorrect,
        totalWrong,
        todayAttempts,
        todayCorrect,
        todayWrong,
        wallet,
      ] = await Promise.all([
        CaptchaAttempt.countDocuments({
          userId:
            user._id,
        }),

        CaptchaAttempt.countDocuments({
          userId:
            user._id,

          result:
            "correct",

          status:
            "success",
        }),

        CaptchaAttempt.countDocuments({
          userId:
            user._id,

          result:
            "wrong",

          status:
            "failed",
        }),

        CaptchaAttempt.countDocuments({
          userId:
            user._id,

          attemptDate:
            getTodayDateKey(),
        }),

        CaptchaAttempt.countDocuments({
          userId:
            user._id,

          attemptDate:
            getTodayDateKey(),

          result:
            "correct",

          status:
            "success",
        }),

        CaptchaAttempt.countDocuments({
          userId:
            user._id,

          attemptDate:
            getTodayDateKey(),

          result:
            "wrong",

          status:
            "failed",
        }),

        Wallet.findOne({
          userId:
            user._id,
        }).lean(),
      ]);

      const accuracy =
        totalAttempts > 0
          ? Number(
              (
                (totalCorrect /
                  totalAttempts) *
                100
              ).toFixed(2)
            )
          : 0;

      const attempts =
        await CaptchaAttempt.find({
          userId:
            user._id,
        })
          .sort({
            createdAt:
              -1,
          })
          .limit(100)
          .lean();

      return res.json({
        success:
          true,

        customer: {
          _id:
            user._id,

          memberId:
            user.memberId ||
            user.userCode ||
            "-",

          name:
            user.name,

          email:
            user.email,

          phone:
            user.phone,

          status:
            user.status,

          userType:
            user.userType,

          createdAt:
            user.createdAt,
        },

        stats: {
          totalAttempts,

          totalCorrect,

          totalWrong,

          accuracy,

          todayAttempts,

          todayCorrect,

          todayWrong,

          captchaEarnings:
            toNumber(
              wallet
                ?.captchaEarnings
            ),

          todayCaptchasSolved:
            toNumber(
              wallet
                ?.todayCaptchasSolved
            ),

          currentBalance:
            toNumber(
              wallet
                ?.currentBalance
            ),
        },

        attempts,
      });
    } catch (error) {
      console.error(
        "❌ Get customer captcha stats error:",
        error
      );

      return res.status(500).json({
        success:
          false,
        message:
          "Failed to fetch customer captcha statistics.",
      });
    }
  };

// =====================================================
// GET CUSTOMER DETAILS
// =====================================================

export const getCustomerDetails =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      const user =
        await findCustomerByIdentifier(
          id
        );

      if (!user) {
        return res.status(404).json({
          success:
            false,

          message:
            "Customer not found.",
        });
      }

      const [
        wallet,
        sales,
      ] = await Promise.all([
        Wallet.findOne({
          userId:
            user._id,
        }).lean(),

        Transaction.find({
          userId:
            user._id,

          category:
            "package",
        })
          .sort({
            createdAt:
              -1,
          })
          .lean(),
      ]);

      return res.json({
        success:
          true,

        user:
          getSafeUser(
            user
          ),

        wallet,

        sales,
      });
    } catch (error) {
      console.error(
        "❌ Get customer details error:",
        error
      );

      return res.status(500).json({
        success:
          false,
        message:
          "Failed to fetch customer details.",
      });
    }
  };

// =====================================================
// UPDATE CUSTOMER
// =====================================================

export const updateCustomer =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      const user =
        await findCustomerByIdentifier(
          id
        );

      if (!user) {
        return res.status(404).json({
          success:
            false,

          message:
            "Customer not found.",
        });
      }

      const allowedFields = [
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

      for (
        const field of
          allowedFields
      ) {
        if (
          req.body[field] !==
          undefined
        ) {
          user[field] =
            req.body[field];
        }
      }

      // -----------------------------------------------
      // BANK DETAILS
      // -----------------------------------------------

      if (
        req.body.bankDetails
      ) {
        user.bankDetails =
          {
            ...(user.bankDetails
              ? user.bankDetails
                  .toObject?.() ||
                user.bankDetails
              : {}),

            ...req.body
              .bankDetails,
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
          getSafeUser(
            user
          ),
      });
    } catch (error) {
      console.error(
        "❌ Update customer error:",
        error
      );

      if (
        error.code === 11000
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Email, phone, member ID or user code already exists.",
        });
      }

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to update customer.",
      });
    }
  };

// =====================================================
// ADJUST WALLET
// =====================================================

export const adjustWallet =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      const {
        amount,
        type,
        reason,
      } = req.body;

      const numericAmount =
        Number(amount);

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <=
          0
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Invalid wallet amount.",
        });
      }

      const user =
        await findCustomerByIdentifier(
          id
        );

      if (!user) {
        return res.status(404).json({
          success:
            false,

          message:
            "Customer not found.",
        });
      }

      const adjustmentType =
        type === "debit"
          ? "debit"
          : "credit";

      const amountToApply =
        Number(
          Math.abs(
            numericAmount
          ).toFixed(2)
        );

      const session =
        await mongoose.startSession();

      let updatedWallet;

      try {
        await session.withTransaction(
          async () => {
            let wallet =
              await Wallet.findOne({
                userId:
                  user._id,
              }).session(
                session
              );

            if (!wallet) {
              wallet =
                new Wallet({
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
                    new Date().toISOString(),
                });
            }

            const currentBalance =
              toNumber(
                wallet.currentBalance
              );

            let newBalance;

            if (
              adjustmentType ===
              "debit"
            ) {
              if (
                currentBalance <
                amountToApply
              ) {
                throw new Error(
                  "INSUFFICIENT_BALANCE"
                );
              }

              newBalance =
                Number(
                  (
                    currentBalance -
                    amountToApply
                  ).toFixed(2)
                );
            } else {
              newBalance =
                Number(
                  (
                    currentBalance +
                    amountToApply
                  ).toFixed(2)
                );
            }

            wallet.currentBalance =
              newBalance;

            wallet.memberId =
              user.memberId;

            await wallet.save({
              session,
            });

            const transaction =
              new Transaction({
                userId:
                  user._id,

                memberId:
                  user.memberId,

                type:
                  adjustmentType,

                category:
                  "wallet_adjustment",

                amount:
                  amountToApply,

                grossAmount:
                  amountToApply,

                netAmount:
                  amountToApply,

                balanceAfter:
                  newBalance,

                status:
                  "completed",

                description:
                  reason ||
                  "Admin wallet adjustment",

                reason:
                  reason ||
                  "Admin wallet adjustment",

                createdBy:
                  mongoose.Types.ObjectId.isValid(
                    req.user?.id
                  )
                    ? req.user.id
                    : null,

                timestamp:
                  new Date(),
              });

            await transaction.save({
              session,
            });

            updatedWallet =
              wallet;
          }
        );
      } catch (error) {
        if (
          error.message ===
          "INSUFFICIENT_BALANCE"
        ) {
          return res.status(400).json({
            success:
              false,

            message:
              "Insufficient wallet balance.",
          });
        }

        throw error;
      } finally {
        await session.endSession();
      }

      return res.json({
        success:
          true,

        message:
          "Wallet updated successfully.",

        wallet:
          updatedWallet,
      });
    } catch (error) {
      console.error(
        "❌ Adjust wallet error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to adjust wallet.",
      });
    }
  };

// =====================================================
// SELL PACKAGE
// =====================================================

export const sellPackage =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      const {
        packageName,
        amount,
        pv,
      } = req.body;

      const user =
        await findCustomerByIdentifier(
          id
        );

      if (!user) {
        return res.status(404).json({
          success:
            false,

          message:
            "Customer not found.",
        });
      }

      const numericAmount =
        Math.max(
          0,
          toNumber(amount)
        );

      const numericPv =
        Math.max(
          0,
          toNumber(pv)
        );

      const cleanPackageName =
        String(
          packageName ||
            "Package"
        ).trim();

      const session =
        await mongoose.startSession();

      let updatedUser;
      let sale;

      try {
        await session.withTransaction(
          async () => {
            user.joiningPackage =
              cleanPackageName;

            user.userType =
              "PAID";

            user.activationDate =
              new Date();

            if (
              numericPv >
              0
            ) {
              user.leftPv =
                Number(
                  user.leftPv ||
                    0
                ) +
                numericPv;
            }

            await user.save({
              session,
            });

            sale =
              new Transaction({
                userId:
                  user._id,

                memberId:
                  user.memberId,

                type:
                  "credit",

                category:
                  "package",

                amount:
                  numericAmount,

                grossAmount:
                  numericAmount,

                netAmount:
                  numericAmount,

                balanceAfter:
                  0,

                status:
                  "completed",

                description:
                  `Package sale: ${cleanPackageName}`,

                reason:
                  `Package sale: ${cleanPackageName}`,

                createdBy:
                  mongoose.Types.ObjectId.isValid(
                    req.user?.id
                  )
                    ? req.user.id
                    : null,

                timestamp:
                  new Date(),
              });

            await sale.save({
              session,
            });

            updatedUser =
              user;
          }
        );
      } finally {
        await session.endSession();
      }

      return res.json({
        success:
          true,

        message:
          "Package sold successfully.",

        user:
          getSafeUser(
            updatedUser
          ),

        sale:
          getSafeTransaction(
            sale
          ),
      });
    } catch (error) {
      console.error(
        "❌ Sell package error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to sell package.",
      });
    }
  };

// =====================================================
// IMPERSONATE CUSTOMER
// =====================================================

export const impersonateCustomer =
  async (
    req,
    res
  ) => {
    try {
      if (!JWT_SECRET) {
        return res.status(500).json({
          success:
            false,

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
          success:
            false,

          message:
            "Customer not found.",
        });
      }

      const token =
        jwt.sign(
          {
            id:
              String(
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
          getSafeUser(
            user
          ),
      });
    } catch (error) {
      console.error(
        "❌ Impersonate customer error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to impersonate customer.",
      });
    }
  };

// =====================================================
// DELETE CUSTOMER
// =====================================================

export const deleteCustomer =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      const user =
        await findCustomerByIdentifier(
          id
        );

      if (!user) {
        return res.status(404).json({
          success:
            false,

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
          success:
            false,

          message:
            "Admin accounts cannot be deleted from customer management.",
        });
      }

      const session =
        await mongoose.startSession();

      try {
        await session.withTransaction(
          async () => {
            // -------------------------------------------
            // REMOVE USER
            // -------------------------------------------

            await User.deleteOne(
              {
                _id:
                  user._id,
              },
              {
                session,
              }
            );

            // -------------------------------------------
            // REMOVE WALLET
            // -------------------------------------------

            await Wallet.deleteMany(
              {
                userId:
                  user._id,
              },
              {
                session,
              }
            );

            // -------------------------------------------
            // REMOVE CAPTCHA ATTEMPTS
            // -------------------------------------------

            await CaptchaAttempt.deleteMany(
              {
                userId:
                  user._id,
              },
              {
                session,
              }
            );

            // -------------------------------------------
            // REMOVE TRANSACTIONS
            // -------------------------------------------

            await Transaction.deleteMany(
              {
                userId:
                  user._id,
              },
              {
                session,
              }
            );

            // -------------------------------------------
            // UPDATE SPONSOR COUNTS
            // -------------------------------------------

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
        success:
          false,

        message:
          "Failed to delete customer.",
      });
    }
  };

// =====================================================
// TOGGLE CUSTOMER STATUS
// =====================================================

export const toggleCustomerStatus =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      const user =
        await findCustomerByIdentifier(
          id
        );

      if (!user) {
        return res.status(404).json({
          success:
            false,

          message:
            "Customer not found.",
        });
      }

      user.status =
        user.status ===
        "active"
          ? "inactive"
          : "active";

      user.updatedAt =
        new Date();

      await user.save();

      return res.json({
        success:
          true,

        message:
          `Customer ${
            user.status ===
            "active"
              ? "activated"
              : "deactivated"
          } successfully.`,

        user:
          getSafeUser(
            user
          ),
      });
    } catch (error) {
      console.error(
        "❌ Toggle customer status error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to update customer status.",
      });
    }
  };

// =====================================================
// GET SALES
// =====================================================

export const getSales =
  async (
    req,
    res
  ) => {
    try {
      const sales =
        await Transaction.find({
          category:
            "package",
        })
          .sort({
            createdAt:
              -1,
          })
          .lean();

      return res.json({
        success:
          true,

        count:
          sales.length,

        sales,
      });
    } catch (error) {
      console.error(
        "❌ Get sales error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to fetch sales.",
      });
    }
  };

// =====================================================
// GET WITHDRAWALS
// =====================================================

export const getWithdrawals =
  async (
    req,
    res
  ) => {
    try {
      const withdrawals =
        await Transaction.find({
          type:
            "withdrawal",
        })
          .sort({
            createdAt:
              -1,
          })
          .lean();

      return res.json({
        success:
          true,

        count:
          withdrawals.length,

        withdrawals,
      });
    } catch (error) {
      console.error(
        "❌ Get withdrawals error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to fetch withdrawals.",
      });
    }
  };

// =====================================================
// WITHDRAWAL ACTION
// =====================================================

export const withdrawalAction =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      const {
        action,
        remark,
        reason,
      } = req.body;

      if (
        ![
          "approve",
          "reject",
          "complete",
        ].includes(
          action
        )
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Invalid withdrawal action.",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Invalid withdrawal ID.",
        });
      }

      const session =
        await mongoose.startSession();

      let updatedWithdrawal;

      try {
        await session.withTransaction(
          async () => {
            const withdrawal =
              await Transaction.findOne({
                _id:
                  id,

                type:
                  "withdrawal",
              }).session(
                session
              );

            if (!withdrawal) {
              throw new Error(
                "WITHDRAWAL_NOT_FOUND"
              );
            }

            // -------------------------------------------
            // STATE VALIDATION
            // -------------------------------------------

            if (
              action ===
                "approve" &&
              withdrawal.status !==
                "pending"
            ) {
              throw new Error(
                "WITHDRAWAL_NOT_PENDING"
              );
            }

            if (
              action ===
                "reject" &&
              withdrawal.status !==
                "pending"
            ) {
              throw new Error(
                "WITHDRAWAL_NOT_PENDING"
              );
            }

            if (
              action ===
                "complete" &&
              withdrawal.status !==
                "approved"
            ) {
              throw new Error(
                "WITHDRAWAL_NOT_APPROVED"
              );
            }

            // -------------------------------------------
            // APPROVE
            // -------------------------------------------

            if (
              action ===
              "approve"
            ) {
              withdrawal.status =
                "approved";
            }

            // -------------------------------------------
            // COMPLETE
            // -------------------------------------------

            if (
              action ===
              "complete"
            ) {
              withdrawal.status =
                "completed";
            }

            // -------------------------------------------
            // REJECT + REFUND
            // -------------------------------------------

            if (
              action ===
              "reject"
            ) {
              const wallet =
                await Wallet.findOne({
                  userId:
                    withdrawal.userId,
                }).session(
                  session
                );

              if (!wallet) {
                throw new Error(
                  "WALLET_NOT_FOUND"
                );
              }

              const currentBalance =
                toNumber(
                  wallet.currentBalance
                );

              const refundAmount =
                toNumber(
                  withdrawal.grossAmount ||
                    withdrawal.amount
                );

              wallet.currentBalance =
                Number(
                  (
                    currentBalance +
                    refundAmount
                  ).toFixed(2)
                );

              await wallet.save({
                session,
              });

              withdrawal.status =
                "rejected";

              withdrawal.balanceAfter =
                wallet.currentBalance;

              await Transaction.create(
                [
                  {
                    userId:
                      withdrawal.userId,

                    memberId:
                      withdrawal.memberId,

                    type:
                      "credit",

                    category:
                      "wallet_adjustment",

                    amount:
                      refundAmount,

                    grossAmount:
                      refundAmount,

                    netAmount:
                      refundAmount,

                    balanceAfter:
                      wallet.currentBalance,

                    status:
                      "completed",

                    description:
                      "Withdrawal rejected - amount refunded",

                    reason:
                      remark ||
                      reason ||
                      "Withdrawal rejected",

                    createdBy:
                      mongoose.Types.ObjectId.isValid(
                        req.user?.id
                      )
                        ? req.user.id
                        : null,

                    timestamp:
                      new Date(),
                  },
                ],
                {
                  session,
                }
              );
            }

            withdrawal.reason =
              remark ||
              reason ||
              withdrawal.reason ||
              "";

            withdrawal.updatedAt =
              new Date();

            withdrawal.processedBy =
              mongoose.Types.ObjectId.isValid(
                req.user?.id
              )
                ? req.user.id
                : null;

            await withdrawal.save({
              session,
            });

            updatedWithdrawal =
              withdrawal;
          }
        );
      } catch (error) {
        if (
          error.message ===
          "WITHDRAWAL_NOT_FOUND"
        ) {
          return res.status(404).json({
            success:
              false,

            message:
              "Withdrawal not found.",
          });
        }

        if (
          error.message ===
          "WITHDRAWAL_NOT_PENDING"
        ) {
          return res.status(400).json({
            success:
              false,

            message:
              "Only pending withdrawals can be approved or rejected.",
          });
        }

        if (
          error.message ===
          "WITHDRAWAL_NOT_APPROVED"
        ) {
          return res.status(400).json({
            success:
              false,

            message:
              "Only approved withdrawals can be completed.",
          });
        }

        if (
          error.message ===
          "WALLET_NOT_FOUND"
        ) {
          return res.status(400).json({
            success:
              false,

            message:
              "Customer wallet not found.",
          });
        }

        throw error;
      } finally {
        await session.endSession();
      }

      return res.json({
        success:
          true,

        message:
          "Withdrawal updated successfully.",

        withdrawal:
          getSafeTransaction(
            updatedWithdrawal
          ),
      });
    } catch (error) {
      console.error(
        "❌ Withdrawal action error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to update withdrawal.",
      });
    }
  };

// =====================================================
// TDS REPORT
// =====================================================

export const getTdsReport =
  async (
    req,
    res
  ) => {
    try {
      const users =
        await User.find(
          customerFilter
        )
          .select(
            "_id memberId userCode name email panNumber panVerified totalIncome"
          )
          .sort({
            createdAt:
              -1,
          })
          .lean();

      const userIds =
        users.map(
          (user) =>
            user._id
        );

      const tdsResults =
        await Transaction.aggregate([
          {
            $match: {
              userId: {
                $in:
                  userIds,
              },

              type:
                "withdrawal",

              status: {
                $in: [
                  "approved",
                  "completed",
                ],
              },
            },
          },

          {
            $group: {
              _id:
                "$userId",

              totalTds: {
                $sum:
                  "$tdsAmount",
              },

              totalGrossWithdrawal: {
                $sum:
                  "$grossAmount",
              },

              totalNetWithdrawal: {
                $sum:
                  "$netAmount",
              },
            },
          },
        ]);

      const tdsMap =
        new Map(
          tdsResults.map(
            (item) => [
              String(
                item._id
              ),
              item,
            ]
          )
        );

      const report =
        users.map(
          (user) => {
            const tdsData =
              tdsMap.get(
                String(
                  user._id
                )
              );

            return {
              _id:
                user._id,

              memberId:
                user.memberId ||
                user.userCode ||
                "-",

              name:
                user.name,

              email:
                user.email,

              panNumber:
                user.panNumber ||
                "-",

              panVerified:
                Boolean(
                  user.panVerified
                ),

              totalIncome:
                toNumber(
                  user.totalIncome
                ),

              tds:
                toNumber(
                  tdsData?.totalTds
                ),

              totalGrossWithdrawal:
                toNumber(
                  tdsData?.totalGrossWithdrawal
                ),

              totalNetWithdrawal:
                toNumber(
                  tdsData?.totalNetWithdrawal
                ),
            };
          }
        );

      return res.json({
        success:
          true,

        count:
          report.length,

        report,
      });
    } catch (error) {
      console.error(
        "❌ Get TDS report error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to generate TDS report.",
      });
    }
  };

// =====================================================
// GET SITE CONTENT
// =====================================================

export const getSiteContent =
  async (
    req,
    res
  ) => {
    try {
      let siteContent =
        await SiteContent.findOne({
          key:
            "main",
        }).lean();

      if (!siteContent) {
        siteContent =
          await SiteContent.create({
            key:
              "main",

            isActive:
              true,

            settings: {
              captchaLength:
                6,

              captchaReward:
                0.5,

              dailyCaptchaLimit:
                50,

              tdsRateWithPan:
                5,

              tdsRateNoPan:
                20,

              adminFeeRate:
                5,

              minWithdrawalAmount:
                200,
            },
          });

        siteContent =
          siteContent.toObject();
      }

      const settings = {
        ...(siteContent.settings ||
          {}),

        captchaLength:
          Number(
            siteContent.settings
              ?.captchaLength ??
              6
          ),

        captchaReward:
          Number(
            siteContent.settings
              ?.captchaReward ??
              0.5
          ),

        dailyCaptchaLimit:
          Number(
            siteContent.settings
              ?.dailyCaptchaLimit ??
              50
          ),

        tdsRateWithPan:
          Number(
            siteContent.settings
              ?.tdsRateWithPan ??
              5
          ),

        tdsRateNoPan:
          Number(
            siteContent.settings
              ?.tdsRateNoPan ??
              20
          ),

        adminFeeRate:
          Number(
            siteContent.settings
              ?.adminFeeRate ??
              5
          ),

        minWithdrawalAmount:
          Number(
            siteContent.settings
              ?.minWithdrawalAmount ??
              200
          ),
      };

      return res.json({
        success:
          true,

        siteContent: {
          ...siteContent,

          settings,
        },
      });
    } catch (error) {
      console.error(
        "❌ Get site content error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to fetch site content.",
      });
    }
  };

// =====================================================
// UPDATE SITE CONTENT
// =====================================================

export const updateSiteContent =
  async (
    req,
    res
  ) => {
    try {
      let siteContent =
        await SiteContent.findOne({
          key:
            "main",
        });

      if (!siteContent) {
        siteContent =
          new SiteContent({
            key:
              "main",

            isActive:
              true,
          });
      }

      // -------------------------------------------------
      // UPDATE TOP-LEVEL CONTENT
      // -------------------------------------------------

      const allowedTopLevelFields = [
        "hero",
        "about",
        "contact",
        "footer",
        "socialLinks",
        "processSteps",
        "products",
        "faq",
        "seo",
        "branding",
        "navigation",
      ];

      for (
        const field of
          allowedTopLevelFields
      ) {
        if (
          req.body[field] !==
          undefined
        ) {
          siteContent[field] =
            req.body[field];
        }
      }

      // -------------------------------------------------
      // ACTIVE STATUS
      // -------------------------------------------------

      if (
        req.body.isActive !==
        undefined
      ) {
        siteContent.isActive =
          Boolean(
            req.body.isActive
          );
      }

      // -------------------------------------------------
      // SETTINGS
      // -------------------------------------------------

      const currentSettings =
        siteContent.settings
          ? siteContent.settings
              .toObject?.() ||
            siteContent.settings
          : {};

      const incomingSettings =
        req.body?.settings ||
        {};

      let captchaLength =
        Number(
          incomingSettings.captchaLength ??
            currentSettings.captchaLength ??
            6
        );

      if (
        !Number.isFinite(
          captchaLength
        )
      ) {
        captchaLength =
          6;
      }

      captchaLength =
        Math.floor(
          captchaLength
        );

      captchaLength =
        Math.min(
          10,
          Math.max(
            4,
            captchaLength
          )
        );

      let captchaReward =
        Number(
          incomingSettings.captchaReward ??
            currentSettings.captchaReward ??
            0.5
        );

      if (
        !Number.isFinite(
          captchaReward
        ) ||
        captchaReward < 0
      ) {
        captchaReward =
          0.5;
      }

      let dailyCaptchaLimit =
        Number(
          incomingSettings.dailyCaptchaLimit ??
            currentSettings.dailyCaptchaLimit ??
            50
        );

      if (
        !Number.isFinite(
          dailyCaptchaLimit
        ) ||
        dailyCaptchaLimit <
          1
      ) {
        dailyCaptchaLimit =
          50;
      }

      dailyCaptchaLimit =
        Math.floor(
          dailyCaptchaLimit
        );

      let tdsRateWithPan =
        Number(
          incomingSettings.tdsRateWithPan ??
            currentSettings.tdsRateWithPan ??
            5
        );

      if (
        !Number.isFinite(
          tdsRateWithPan
        ) ||
        tdsRateWithPan < 0
      ) {
        tdsRateWithPan =
          5;
      }

      let tdsRateNoPan =
        Number(
          incomingSettings.tdsRateNoPan ??
            currentSettings.tdsRateNoPan ??
            20
        );

      if (
        !Number.isFinite(
          tdsRateNoPan
        ) ||
        tdsRateNoPan < 0
      ) {
        tdsRateNoPan =
          20;
      }

      let adminFeeRate =
        Number(
          incomingSettings.adminFeeRate ??
            currentSettings.adminFeeRate ??
            5
        );

      if (
        !Number.isFinite(
          adminFeeRate
        ) ||
        adminFeeRate < 0
      ) {
        adminFeeRate =
          5;
      }

      let minWithdrawalAmount =
        Number(
          incomingSettings.minWithdrawalAmount ??
            currentSettings.minWithdrawalAmount ??
            200
        );

      if (
        !Number.isFinite(
          minWithdrawalAmount
        ) ||
        minWithdrawalAmount <
          0
      ) {
        minWithdrawalAmount =
          200;
      }

      // -------------------------------------------------
      // SAVE SETTINGS
      // -------------------------------------------------

      siteContent.settings =
        {
          ...currentSettings,

          ...incomingSettings,

          captchaLength,

          captchaReward,

          dailyCaptchaLimit,

          tdsRateWithPan,

          tdsRateNoPan,

          adminFeeRate,

          minWithdrawalAmount,
        };

      await siteContent.save();

      return res.json({
        success:
          true,

        message:
          "Site content updated successfully.",

        siteContent,
      });
    } catch (error) {
      console.error(
        "❌ Update site content error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Failed to update site content.",
      });
    }
  };