import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import { store } from "../dataStore.js";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "samarth_jwt_secret_token_key_2026_prod";

// =====================================================
// HELPER
// =====================================================

const getSafeUser = (user) => {
  if (!user) {
    return null;
  }

  const safeUser = { ...user };

  delete safeUser.password;

  return safeUser;
};

// =====================================================
// ADMIN STATS
// =====================================================

export const getAdminStats = async (req, res) => {
  try {
    const users = store.data.users || [];
    const wallets = store.data.wallets || [];
    const withdrawals = store.data.withdrawals || [];
    const sales = store.data.sales || [];

    const customers = users.filter(
      (user) =>
        user.role !== "admin" &&
        user.role !== "superadmin"
    );

    const activeCustomers = customers.filter(
      (user) => user.status === "active"
    );

    const inactiveCustomers = customers.filter(
      (user) => user.status === "inactive"
    );

    const totalWalletBalance = wallets.reduce(
      (total, wallet) =>
        total + Number(wallet.currentBalance || 0),
      0
    );

    const pendingWithdrawals = withdrawals.filter(
      (withdrawal) =>
        withdrawal.status === "pending"
    );

    const completedWithdrawals = withdrawals.filter(
      (withdrawal) =>
        withdrawal.status === "approved" ||
        withdrawal.status === "completed"
    );

    const totalSalesAmount = sales.reduce(
      (total, sale) =>
        total +
        Number(
          sale.amount ||
            sale.totalAmount ||
            sale.price ||
            0
        ),
      0
    );

    return res.json({
      success: true,
      stats: {
        totalCustomers: customers.length,
        activeCustomers: activeCustomers.length,
        inactiveCustomers: inactiveCustomers.length,
        totalWalletBalance,
        totalSales: sales.length,
        totalSalesAmount,
        pendingWithdrawals: pendingWithdrawals.length,
        completedWithdrawals:
          completedWithdrawals.length,
      },
    });
  } catch (error) {
    console.error("Get admin stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin statistics.",
    });
  }
};

// =====================================================
// GET USERS
// =====================================================

export const getUsers = async (req, res) => {
  try {
    const users = store.data.users || [];

    const safeUsers = users.map(getSafeUser);

    return res.json({
      success: true,
      count: safeUsers.length,
      users: safeUsers,
    });
  } catch (error) {
    console.error("Get users error:", error);

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
    const {
      name,
      email,
      phone,
      password,
      sponsorCode,
      position,
    } = req.body;

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone and password are required.",
      });
    }

    const cleanName = String(name).trim();

    const cleanEmail = String(email)
      .trim()
      .toLowerCase();

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

    if (!cleanPassword) {
      return res.status(400).json({
        success: false,
        message: "Customer password is required.",
      });
    }

    if (cleanPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Customer password must be at least 6 characters.",
      });
    }

    // -----------------------------------------------
    // DUPLICATE EMAIL CHECK
    // -----------------------------------------------

    const existingEmail = store.data.users.find(
      (user) =>
        user.email?.toLowerCase() === cleanEmail
    );

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message:
          "A customer with this email already exists.",
      });
    }

    // -----------------------------------------------
    // DUPLICATE PHONE CHECK
    // -----------------------------------------------

    const existingPhone = store.data.users.find(
      (user) => user.phone === cleanPhone
    );

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message:
          "A customer with this phone number already exists.",
      });
    }

    // -----------------------------------------------
    // GENERATE ACCOUNT ID
    // -----------------------------------------------

    let accountNumber = 1;

    const existingAccountIds =
      store.data.users
        .map((user) => user._id)
        .filter(
          (id) =>
            typeof id === "string" &&
            id.startsWith("user_downline_")
        );

    if (existingAccountIds.length > 0) {
      const accountNumbers =
        existingAccountIds
          .map((id) => {
            const number = Number(
              id.replace("user_downline_", "")
            );

            return Number.isFinite(number)
              ? number
              : 0;
          })
          .filter((number) => number > 0);

      if (accountNumbers.length > 0) {
        accountNumber =
          Math.max(...accountNumbers) + 1;
      }
    }

    let accountId = `user_downline_${accountNumber}`;

    while (
      store.data.users.some(
        (user) => user._id === accountId
      )
    ) {
      accountNumber++;
      accountId = `user_downline_${accountNumber}`;
    }

    // -----------------------------------------------
    // GENERATE MEMBER ID
    // -----------------------------------------------

    let memberNumber =
      681908 + store.data.users.length + 1;

    let memberCode = `SI${memberNumber}`;

    while (
      store.data.users.some(
        (user) =>
          user.memberId === memberCode ||
          user.userCode === memberCode
      )
    ) {
      memberNumber++;
      memberCode = `SI${memberNumber}`;
    }

    // -----------------------------------------------
    // HASH ADMIN CREATED PASSWORD
    // -----------------------------------------------

    const passwordHash = await bcrypt.hash(
      cleanPassword,
      10
    );

    // -----------------------------------------------
    // SPONSOR
    // -----------------------------------------------

    const sponsor =
      sponsorCode?.trim().toUpperCase() ||
      "SI107476";

    // -----------------------------------------------
    // CREATE USER
    // -----------------------------------------------

    const newUser = {
      // Automatically generated Account ID
      _id: accountId,

      // Member ID / User Code
      memberId: memberCode,
      userCode: memberCode,

      sponsorCode: sponsor,
      sponsorMemberId: sponsor,

      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,

      // Admin-created password stored as bcrypt hash
      password: passwordHash,

      role: "user",

      dateOfEntry:
        new Date().toLocaleDateString("en-GB"),

      userType: "UNPAID",

      activationDate: "-",
      joiningPackage: "-",

      rank: "Distributor",

      position: position || "left",

      leftCount: 0,
      rightCount: 0,

      leftBusiness: 0,
      rightBusiness: 0,

      totalReferral: 0,
      activeReferral: 0,

      leftPv: 0,
      rightPv: 0,

      leftCarryForwardPv: 0,
      rightCarryForwardPv: 0,

      totalTeam: 0,
      activeTeam: 0,

      teamPercent: "0%",

      matchingIncome: 0,
      todayMatchingIncome: 0,

      franchiseReferralIncome: 0,
      franchiseMatchingIncome: 0,

      totalIncome: 0,

      panNumber: "",
      panVerified: false,

      bankDetails: {
        accountHolderName: cleanName,
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        upiId: "",
      },

      status: "active",

      createdAt: new Date().toISOString(),
    };

    // -----------------------------------------------
    // CREATE WALLET
    // -----------------------------------------------

    const newWallet = {
      _id: `w_${Date.now()}`,

      userId: newUser._id,
      memberId: newUser.memberId,

      currentBalance: 50,

      captchaEarnings: 0,
      referralCommissions: 0,
      totalWithdrawn: 0,

      todayCaptchasSolved: 0,

      lastCaptchaDate:
        new Date().toISOString().split("T")[0],
    };

    // -----------------------------------------------
    // SAVE USER + WALLET
    // -----------------------------------------------

    store.data.users.push(newUser);
    store.data.wallets.push(newWallet);

    store.save();

    // -----------------------------------------------
    // RESPONSE
    // -----------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Customer created successfully.",
      user: {
        ...getSafeUser(newUser),

        // Return login Account ID
        accountId: newUser._id,

        // Return member ID
        memberId: newUser.memberId,

        // Return user code
        userCode: newUser.userCode,

        // Return password only in creation response.
        // It is NOT stored as plain text in database.
        password: cleanPassword,
      },
    });
  } catch (error) {
    console.error("Create customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create customer.",
    });
  }
};

// =====================================================
// RESET CUSTOMER PASSWORD
// =====================================================

export const resetCustomerPassword = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

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

    const cleanPassword = String(
      newPassword
    );

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

    // -------------------------------------------------
    // FIND CUSTOMER
    // -------------------------------------------------

    const user = store.data.users.find(
      (item) =>
        item._id === id ||
        item.memberId === id ||
        item.userCode === id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // -------------------------------------------------
    // PREVENT ADMIN PASSWORD RESET FROM CUSTOMER
    // -------------------------------------------------

    if (
      user.role === "admin" ||
      user.role === "superadmin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Admin account passwords cannot be changed from customer management.",
      });
    }

    // -------------------------------------------------
    // HASH NEW PASSWORD
    // -------------------------------------------------

    const passwordHash = await bcrypt.hash(
      cleanPassword,
      10
    );

    // -------------------------------------------------
    // UPDATE PASSWORD
    // -------------------------------------------------

    user.password = passwordHash;

    user.passwordUpdatedAt =
      new Date().toISOString();

    user.updatedAt =
      new Date().toISOString();

    // -------------------------------------------------
    // SAVE
    // -------------------------------------------------

    store.save();

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.json({
      success: true,
      message:
        "Customer password updated successfully.",
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error(
      "Reset customer password error:",
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

export const getCaptchaStats = async (req, res) => {
  try {
    const attempts = store.data.captchaAttempts || [];
    const users = store.data.users || [];
    const wallets = store.data.wallets || [];

    const totalAttempts = attempts.length;

    const correctAttempts = attempts.filter(
      (attempt) => attempt.result === "correct"
    );

    const wrongAttempts = attempts.filter(
      (attempt) => attempt.result === "wrong"
    );

    const totalCorrect = correctAttempts.length;
    const totalWrong = wrongAttempts.length;

    const accuracy =
      totalAttempts > 0
        ? Number(
            (
              (totalCorrect / totalAttempts) *
              100
            ).toFixed(2)
          )
        : 0;

    const totalCaptchaEarnings = wallets.reduce(
      (total, wallet) =>
        total + Number(wallet.captchaEarnings || 0),
      0
    );

    // Today's date
    const today = new Date()
      .toISOString()
      .split("T")[0];

    const todayAttempts = attempts.filter(
      (attempt) =>
        attempt.createdAt?.startsWith(today)
    );

    const todayCorrect = todayAttempts.filter(
      (attempt) =>
        attempt.result === "correct"
    ).length;

    const todayWrong = todayAttempts.filter(
      (attempt) =>
        attempt.result === "wrong"
    ).length;

    // Customer-wise captcha statistics
    const customers = users
      .filter(
        (user) =>
          user.role !== "admin" &&
          user.role !== "superadmin"
      )
      .map((user) => {
        const userAttempts = attempts.filter(
          (attempt) =>
            attempt.userId === user._id ||
            attempt.memberId === user.memberId
        );

        const correct = userAttempts.filter(
          (attempt) =>
            attempt.result === "correct"
        ).length;

        const wrong = userAttempts.filter(
          (attempt) =>
            attempt.result === "wrong"
        ).length;

        const total = userAttempts.length;

        const userAccuracy =
          total > 0
            ? Number(
                (
                  (correct / total) *
                  100
                ).toFixed(2)
              )
            : 0;

        const wallet =
          wallets.find(
            (item) =>
              item.userId === user._id ||
              item.memberId === user.memberId
          ) || null;

        return {
          _id: user._id,
          memberId:
            user.memberId ||
            user.userCode ||
            "-",
          name: user.name,
          email: user.email,
          status: user.status,

          totalAttempts: total,
          correctAttempts: correct,
          wrongAttempts: wrong,

          accuracy: userAccuracy,

          captchaEarnings: Number(
            wallet?.captchaEarnings || 0
          ),

          todayCaptchasSolved: Number(
            wallet?.todayCaptchasSolved || 0
          ),
        };
      });

    return res.json({
      success: true,

      stats: {
        totalAttempts,
        totalCorrect,
        totalWrong,
        accuracy,

        todayAttempts: todayAttempts.length,
        todayCorrect,
        todayWrong,

        totalCaptchaEarnings,
      },

      customers,
    });
  } catch (error) {
    console.error(
      "Get captcha stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch captcha statistics.",
    });
  }
};

// =====================================================
// CAPTCHA STATISTICS - SINGLE CUSTOMER
// =====================================================

export const getCustomerCaptchaStats = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const users = store.data.users || [];
    const attempts =
      store.data.captchaAttempts || [];
    const wallets = store.data.wallets || [];

    // Find customer
    const user = users.find(
      (item) =>
        item._id === id ||
        item.memberId === id ||
        item.userCode === id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // Get customer's captcha attempts
    const customerAttempts = attempts.filter(
      (attempt) =>
        attempt.userId === user._id ||
        attempt.memberId === user.memberId
    );

    const totalAttempts =
      customerAttempts.length;

    const correctAttempts =
      customerAttempts.filter(
        (attempt) =>
          attempt.result === "correct"
      );

    const wrongAttempts =
      customerAttempts.filter(
        (attempt) =>
          attempt.result === "wrong"
      );

    const totalCorrect =
      correctAttempts.length;

    const totalWrong =
      wrongAttempts.length;

    const accuracy =
      totalAttempts > 0
        ? Number(
            (
              (totalCorrect / totalAttempts) *
              100
            ).toFixed(2)
          )
        : 0;

    // Today's statistics
    const today = new Date()
      .toISOString()
      .split("T")[0];

    const todayAttempts =
      customerAttempts.filter(
        (attempt) =>
          attempt.createdAt?.startsWith(today)
      );

    const todayCorrect =
      todayAttempts.filter(
        (attempt) =>
          attempt.result === "correct"
      ).length;

    const todayWrong =
      todayAttempts.filter(
        (attempt) =>
          attempt.result === "wrong"
      ).length;

    // Wallet information
    const wallet =
      wallets.find(
        (item) =>
          item.userId === user._id ||
          item.memberId === user.memberId
      ) || null;

    // Recent captcha attempts
    const recentAttempts = [
      ...customerAttempts,
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      )
      .slice(0, 100);

    return res.json({
      success: true,

      customer: {
        _id: user._id,

        memberId:
          user.memberId ||
          user.userCode ||
          "-",

        name: user.name,

        email: user.email,

        phone: user.phone,

        status: user.status,

        userType: user.userType,

        createdAt: user.createdAt,
      },

      stats: {
        totalAttempts,

        totalCorrect,

        totalWrong,

        accuracy,

        todayAttempts:
          todayAttempts.length,

        todayCorrect,

        todayWrong,

        captchaEarnings: Number(
          wallet?.captchaEarnings || 0
        ),

        todayCaptchasSolved: Number(
          wallet?.todayCaptchasSolved || 0
        ),

        currentBalance: Number(
          wallet?.currentBalance || 0
        ),
      },

      attempts: recentAttempts,
    });
  } catch (error) {
    console.error(
      "Get customer captcha stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch customer captcha statistics.",
    });
  }
};

// =====================================================
// GET CUSTOMER DETAILS
// =====================================================

export const getCustomerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = store.data.users.find(
      (item) =>
        item._id === id ||
        item.memberId === id ||
        item.userCode === id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const wallet =
      store.data.wallets.find(
        (item) =>
          item.userId === user._id ||
          item.memberId === user.memberId
      ) || null;

    const customerSales =
      (store.data.sales || []).filter(
        (sale) =>
          sale.userId === user._id ||
          sale.memberId === user.memberId
      );

    return res.json({
      success: true,
      user: getSafeUser(user),
      wallet,
      sales: customerSales,
    });
  } catch (error) {
    console.error(
      "Get customer details error:",
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

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const userIndex =
      store.data.users.findIndex(
        (user) =>
          user._id === id ||
          user.memberId === id ||
          user.userCode === id
      );

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const user = store.data.users[userIndex];

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

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    }

    if (req.body.bankDetails) {
      user.bankDetails = {
        ...(user.bankDetails || {}),
        ...req.body.bankDetails,
      };
    }

    user.updatedAt =
      new Date().toISOString();

    store.save();

    return res.json({
      success: true,
      message: "Customer updated successfully.",
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error(
      "Update customer error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update customer.",
    });
  }
};

// =====================================================
// ADJUST WALLET
// =====================================================

export const adjustWallet = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      amount,
      type,
      reason,
    } = req.body;

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet amount.",
      });
    }

    const user = store.data.users.find(
      (item) =>
        item._id === id ||
        item.memberId === id ||
        item.userCode === id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    let wallet =
      store.data.wallets.find(
        (item) =>
          item.userId === user._id ||
          item.memberId === user.memberId
      );

    if (!wallet) {
      wallet = {
        _id: `w_${Date.now()}`,
        userId: user._id,
        memberId: user.memberId,
        currentBalance: 0,
        captchaEarnings: 0,
        referralCommissions: 0,
        totalWithdrawn: 0,
        todayCaptchasSolved: 0,
        lastCaptchaDate: null,
      };

      store.data.wallets.push(wallet);
    }

    if (type === "debit") {
      if (
        Number(wallet.currentBalance || 0) <
        Math.abs(numericAmount)
      ) {
        return res.status(400).json({
          success: false,
          message: "Insufficient wallet balance.",
        });
      }

      wallet.currentBalance -= Math.abs(
        numericAmount
      );
    } else {
      wallet.currentBalance += Math.abs(
        numericAmount
      );
    }

    if (!store.data.transactions) {
      store.data.transactions = [];
    }

    store.data.transactions.push({
      _id: `txn_${Date.now()}`,
      userId: user._id,
      memberId: user.memberId,
      type: type || "credit",
      amount: Math.abs(numericAmount),
      reason:
        reason || "Admin wallet adjustment",
      balanceAfter: wallet.currentBalance,
      createdAt: new Date().toISOString(),
      createdBy: req.user?.id || "admin",
    });

    store.save();

    return res.json({
      success: true,
      message: "Wallet updated successfully.",
      wallet,
    });
  } catch (error) {
    console.error(
      "Adjust wallet error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to adjust wallet.",
    });
  }
};

// =====================================================
// SELL PACKAGE
// =====================================================

export const sellPackage = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      packageName,
      amount,
      pv,
    } = req.body;

    const user = store.data.users.find(
      (item) =>
        item._id === id ||
        item.memberId === id ||
        item.userCode === id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const numericAmount = Number(amount || 0);
    const numericPv = Number(pv || 0);

    user.joiningPackage =
      packageName || user.joiningPackage;

    user.userType = "PAID";

    user.activationDate =
      new Date().toLocaleDateString("en-GB");

    if (numericPv > 0) {
      user.leftPv =
        Number(user.leftPv || 0) + numericPv;
    }

    if (!store.data.sales) {
      store.data.sales = [];
    }

    const sale = {
      _id: `sale_${Date.now()}`,
      userId: user._id,
      memberId: user.memberId,
      customerName: user.name,
      packageName:
        packageName || "Package",
      amount: numericAmount,
      pv: numericPv,
      status: "completed",
      createdAt: new Date().toISOString(),
    };

    store.data.sales.push(sale);

    store.save();

    return res.json({
      success: true,
      message: "Package sold successfully.",
      user: getSafeUser(user),
      sale,
    });
  } catch (error) {
    console.error(
      "Sell package error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to sell package.",
    });
  }
};

// =====================================================
// IMPERSONATE CUSTOMER
// =====================================================

export const impersonateCustomer = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const user = store.data.users.find(
      (item) =>
        item._id === id ||
        item.memberId === id ||
        item.userCode === id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        memberId:
          user.memberId || user.userCode,
        userCode:
          user.userCode || user.memberId,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.json({
      success: true,
      message:
        "Customer impersonation token generated.",
      token,
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error(
      "Impersonate customer error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to impersonate customer.",
    });
  }
};

// =====================================================
// DELETE CUSTOMER
// =====================================================

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const userIndex =
      store.data.users.findIndex(
        (user) =>
          user._id === id ||
          user.memberId === id ||
          user.userCode === id
      );

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const user = store.data.users[userIndex];

    // Prevent accidental deletion of admins
    if (
      user.role === "admin" ||
      user.role === "superadmin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Admin accounts cannot be deleted from customer management.",
      });
    }

    // Delete user
    store.data.users.splice(userIndex, 1);

    // Delete wallet
    store.data.wallets =
      (store.data.wallets || []).filter(
        (wallet) =>
          wallet.userId !== user._id &&
          wallet.memberId !== user.memberId
      );

    // Delete sales
    store.data.sales =
      (store.data.sales || []).filter(
        (sale) =>
          sale.userId !== user._id &&
          sale.memberId !== user.memberId
      );

    // Delete captcha attempts
    store.data.captchaAttempts =
      (store.data.captchaAttempts || []).filter(
        (attempt) =>
          attempt.userId !== user._id &&
          attempt.memberId !== user.memberId
      );

    store.save();

    return res.json({
      success: true,
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete customer error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete customer.",
    });
  }
};

// =====================================================
// TOGGLE CUSTOMER STATUS
// =====================================================

export const toggleCustomerStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const user = store.data.users.find(
      (item) =>
        item._id === id ||
        item.memberId === id ||
        item.userCode === id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    user.status =
      user.status === "active"
        ? "inactive"
        : "active";

    user.updatedAt =
      new Date().toISOString();

    store.save();

    return res.json({
      success: true,
      message: `Customer ${
        user.status === "active"
          ? "activated"
          : "deactivated"
      } successfully.`,
      user: getSafeUser(user),
    });
  } catch (error) {
    console.error(
      "Toggle customer status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update customer status.",
    });
  }
};

// =====================================================
// GET SALES
// =====================================================

export const getSales = async (req, res) => {
  try {
    const sales = store.data.sales || [];

    return res.json({
      success: true,
      count: sales.length,
      sales,
    });
  } catch (error) {
    console.error("Get sales error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch sales.",
    });
  }
};

// =====================================================
// GET WITHDRAWALS
// =====================================================

export const getWithdrawals = async (
  req,
  res
) => {
  try {
    const withdrawals =
      store.data.withdrawals || [];

    return res.json({
      success: true,
      count: withdrawals.length,
      withdrawals,
    });
  } catch (error) {
    console.error(
      "Get withdrawals error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch withdrawals.",
    });
  }
};

// =====================================================
// WITHDRAWAL ACTION
// =====================================================

export const withdrawalAction = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      action,
      remark,
      reason,
    } = req.body;

    const withdrawals =
      store.data.withdrawals || [];

    const withdrawal =
      withdrawals.find(
        (item) => item._id === id
      );

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found.",
      });
    }

    if (
      ![
        "approve",
        "reject",
        "complete",
      ].includes(action)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid withdrawal action.",
      });
    }

    if (action === "approve") {
      withdrawal.status = "approved";
    }

    if (action === "complete") {
      withdrawal.status = "completed";
    }

    if (action === "reject") {
      withdrawal.status = "rejected";
    }

    withdrawal.remark =
      remark || reason || "";

    withdrawal.updatedAt =
      new Date().toISOString();

    withdrawal.processedBy =
      req.user?.id || "admin";

    store.save();

    return res.json({
      success: true,
      message:
        "Withdrawal updated successfully.",
      withdrawal,
    });
  } catch (error) {
    console.error(
      "Withdrawal action error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update withdrawal.",
    });
  }
};

// =====================================================
// TDS REPORT
// =====================================================

export const getTdsReport = async (
  req,
  res
) => {
  try {
    const users = store.data.users || [];

    const report = users
      .filter(
        (user) =>
          user.role !== "admin" &&
          user.role !== "superadmin"
      )
      .map((user) => ({
        _id: user._id,

        memberId:
          user.memberId ||
          user.userCode ||
          "-",

        name: user.name,
        email: user.email,

        panNumber:
          user.panNumber || "-",

        panVerified:
          Boolean(user.panVerified),

        totalIncome:
          Number(user.totalIncome || 0),

        tds:
          Number(user.tds || 0),
      }));

    return res.json({
      success: true,
      count: report.length,
      report,
    });
  } catch (error) {
    console.error(
      "Get TDS report error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate TDS report.",
    });
  }
};

// =====================================================
// GET SITE CONTENT
// =====================================================

export const getSiteContent = async (
  req,
  res
) => {
  try {
    const siteContent =
      store.data.siteContent || {};

    return res.json({
      success: true,
      siteContent,
    });
  } catch (error) {
    console.error(
      "Get site content error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch site content.",
    });
  }
};

// =====================================================
// UPDATE SITE CONTENT
// =====================================================

export const updateSiteContent = async (
  req,
  res
) => {
  try {
    store.data.siteContent = {
      ...(store.data.siteContent || {}),
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    store.save();

    return res.json({
      success: true,
      message:
        "Site content updated successfully.",
      siteContent:
        store.data.siteContent,
    });
  } catch (error) {
    console.error(
      "Update site content error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update site content.",
    });
  }
};