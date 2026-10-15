import mongoose from "mongoose";

import { User } from "../models/User.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";

import { countActiveBinaryTeam } from "./binaryTree.js";

// =====================================================
// BINARY INCOME SETTINGS
// =====================================================

export const BINARY_PAIR_INCOME = 450;

export const FIRST_QUALIFYING_DOWNLINE = 3;

// =====================================================
// DIRECT REFERRAL INCOME SETTINGS
// =====================================================

export const DIRECT_REFERRAL_INCOME = 100;

// =====================================================
// UNPAID PAIR MILESTONES
// =====================================================
//
// Pair #5 is unpaid.
// Pair #10, #20, #30, #40, #50 ... are unpaid.
//
// These milestone pairs are recorded with ₹0 payout.
// Every other eligible pair pays ₹450.
//
// Use isUnpaidPairMilestone() for the actual rule.
// The Set below lists common milestones for compatibility
// and display. The helper supports milestones beyond #100.
// =====================================================

export const UNPAID_PAIR_MILESTONES = new Set([
  5,
  10,
  20,
  30,
  40,
  50,
  60,
  70,
  80,
  90,
  100,
]);

export function isUnpaidPairMilestone(pairNumber) {
  const pair = Number(pairNumber);

  if (!Number.isInteger(pair) || pair < 1) {
    return false;
  }

  return pair === 5 || (pair >= 10 && pair % 10 === 0);
}

// =====================================================
// CALCULATE ELIGIBLE PAIRS
// =====================================================
//
// First qualification:
// - Minimum 3 active binary downline members.
// - At least one active member on LEFT.
// - At least one active member on RIGHT.
// - Qualification may be 2 LEFT + 1 RIGHT,
//   or 1 LEFT + 2 RIGHT.
//
// After qualification:
// - Every 1 LEFT + 1 RIGHT represents one pair.
// - Each eligible pair is processed only once.
// - Pair #5 and every multiple of 10 from #10 onward
//   are recorded as unpaid milestones.
// =====================================================

export function calculateEligiblePairCount({
  leftActiveCount = 0,
  rightActiveCount = 0,
} = {}) {
  const left = Math.max(0, Number(leftActiveCount) || 0);
  const right = Math.max(0, Number(rightActiveCount) || 0);

  const totalActive = left + right;

  if (totalActive < FIRST_QUALIFYING_DOWNLINE) {
    return 0;
  }

  if (left < 1 || right < 1) {
    return 0;
  }

  return Math.min(left, right);
}

// =====================================================
// BINARY PAIR REFERENCE KEY
// =====================================================

export function buildBinaryPairReferenceKey(
  parentId,
  pairNumber
) {
  return `BINARY_PAIR:${String(parentId)}:${Number(pairNumber)}`;
}

// =====================================================
// DIRECT REFERRAL REFERENCE KEY
// =====================================================

export function buildDirectReferralReferenceKey(
  sponsorId,
  referredUserId
) {
  return `DIRECT_REFERRAL:${String(sponsorId)}:${String(
    referredUserId
  )}`;
}

// =====================================================
// ESCAPE REGEXP VALUE
// =====================================================

function escapeRegExp(value) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

// =====================================================
// GET PROCESSED BINARY PAIR NUMBERS
// =====================================================

export async function getProcessedBinaryPairNumbers(
  parentId,
  { session = null } = {}
) {
  const parentIdString = String(parentId);

  const regex = new RegExp(
    `^BINARY_PAIR:${escapeRegExp(parentIdString)}:\\d+$`
  );

  let query = Transaction.find({
    type: "binary_income",
    referenceKey: {
      $regex: regex,
    },
  }).select(
    "referenceKey amount createdAt category grossAmount netAmount"
  );

  if (session) {
    query = query.session(session);
  }

  const transactions = await query.lean();
  const processedPairs = new Set();

  for (const transaction of transactions) {
    const referenceKey = transaction?.referenceKey;

    if (!referenceKey) {
      continue;
    }

    const parts = String(referenceKey).split(":");

    if (parts.length !== 3) {
      continue;
    }

    const pairNumber = Number(parts[2]);

    if (Number.isInteger(pairNumber) && pairNumber > 0) {
      processedPairs.add(pairNumber);
    }
  }

  return processedPairs;
}

// =====================================================
// GET BINARY PAIR HISTORY
// =====================================================

export async function getBinaryPairHistory(
  parentId,
  { session = null } = {}
) {
  const parentIdString = String(parentId);

  const regex = new RegExp(
    `^BINARY_PAIR:${escapeRegExp(parentIdString)}:\\d+$`
  );

  let query = Transaction.find({
    type: "binary_income",
    referenceKey: {
      $regex: regex,
    },
  })
    .sort({
      createdAt: 1,
    })
    .lean();

  if (session) {
    query = query.session(session);
  }

  const transactions = await query;

  return transactions
    .map((transaction) => {
      const parts = String(
        transaction?.referenceKey || ""
      ).split(":");

      const pairNumber = Number(parts[2]);
      const amount = Number(transaction.amount || 0);

      return {
        pairNumber,
        amount,
        grossAmount: Number(
          transaction.grossAmount ?? amount
        ),
        netAmount: Number(
          transaction.netAmount ?? amount
        ),
        paid: amount > 0,
        milestone: isUnpaidPairMilestone(pairNumber),
        category: transaction.category || "referral",
        createdAt: transaction.createdAt || null,
        referenceKey: transaction.referenceKey,
      };
    })
    .filter(
      (item) =>
        Number.isInteger(item.pairNumber) &&
        item.pairNumber > 0
    )
    .sort((a, b) => a.pairNumber - b.pairNumber);
}

// =====================================================
// PROCESS DIRECT REFERRAL INCOME
// INTERNAL SESSION-BASED FUNCTION
// =====================================================
//
// Business rules:
// - Direct referral income = ₹100.
// - Sponsor must be active; PAID and UNPAID sponsors can qualify.
// - Referred member must be active and PAID.
// - Referred member's sponsorId must match the sponsor.
// - The same referral must not be credited twice.
// - Wallet and transaction changes use the same session.
// =====================================================

async function processDirectReferralIncomeInSession({
  sponsorId,
  referredUserId,
  session,
}) {
  if (!sponsorId) {
    throw new Error(
      "sponsorId is required for direct referral income."
    );
  }

  if (!referredUserId) {
    throw new Error(
      "referredUserId is required for direct referral income."
    );
  }

  if (!session) {
    throw new Error(
      "MongoDB session is required for direct referral income processing."
    );
  }

  const referenceKey = buildDirectReferralReferenceKey(
    sponsorId,
    referredUserId
  );

  // ---------------------------------------------------
  // CHECK PREVIOUS PAYOUT
  // ---------------------------------------------------

  const existingTransaction = await Transaction.findOne({
    referenceKey,
    type: "referral_bonus",
  })
    .session(session)
    .lean();

  if (existingTransaction) {
    return {
      success: true,
      alreadyProcessed: true,
      amount: 0,
      referenceKey,
      transaction: existingTransaction,
    };
  }

  // ---------------------------------------------------
  // FIND AND VALIDATE SPONSOR
  // ---------------------------------------------------

  const sponsor = await User.findById(sponsorId).session(
    session
  );

  if (!sponsor) {
    throw new Error("Sponsor account not found.");
  }

  if (
    String(sponsor.status || "")
      .trim()
      .toLowerCase() !== "active"
  ) {
    throw new Error("Sponsor account must be active.");
  }

  // ---------------------------------------------------
  // FIND AND VALIDATE REFERRED MEMBER
  // ---------------------------------------------------

  const referredUser = await User.findById(
    referredUserId
  ).session(session);

  if (!referredUser) {
    throw new Error("Referred member not found.");
  }

  if (
    String(referredUser.status || "")
      .trim()
      .toLowerCase() !== "active"
  ) {
    throw new Error("Referred member must be active.");
  }

  if (
    String(referredUser.userType || "")
      .trim()
      .toUpperCase() !== "PAID"
  ) {
    throw new Error(
      "Direct referral income requires a PAID activated member."
    );
  }

  // ---------------------------------------------------
  // VERIFY DIRECT REFERRAL RELATIONSHIP
  // ---------------------------------------------------

  if (
    String(referredUser.sponsorId || "") !==
    String(sponsor._id)
  ) {
    throw new Error(
      "Invalid direct referral relationship."
    );
  }

  // ---------------------------------------------------
  // GET OR CREATE SPONSOR WALLET
  // ---------------------------------------------------

  let wallet = await Wallet.findOne({
    userId: sponsor._id,
  }).session(session);

  if (!wallet) {
    wallet = new Wallet({
      userId: sponsor._id,
      memberId:
        sponsor.memberId || sponsor.userCode || "UNKNOWN",
      currentBalance: 0,
      totalEarnings: 0,
      captchaEarnings: 0,
      referralCommissions: 0,
      totalWithdrawn: 0,
      todayCaptchasSolved: 0,
      lastCaptchaDate: null,
    });

    await wallet.save({
      session,
    });
  }

  // ---------------------------------------------------
  // NORMALIZE WALLET VALUES
  // ---------------------------------------------------

  wallet.currentBalance = Number(wallet.currentBalance || 0);
  wallet.totalEarnings = Number(wallet.totalEarnings || 0);
  wallet.referralCommissions = Number(
    wallet.referralCommissions || 0
  );

  // ---------------------------------------------------
  // CALCULATE BALANCE
  // ---------------------------------------------------

  const amount = DIRECT_REFERRAL_INCOME;
  const balanceBefore = wallet.currentBalance;

  const balanceAfter = Number(
    (balanceBefore + amount).toFixed(2)
  );

  // ---------------------------------------------------
  // UPDATE WALLET
  // ---------------------------------------------------

  wallet.currentBalance = balanceAfter;

  wallet.totalEarnings = Number(
    (wallet.totalEarnings + amount).toFixed(2)
  );

  wallet.referralCommissions = Number(
    (wallet.referralCommissions + amount).toFixed(2)
  );

  await wallet.save({
    session,
  });

  // ---------------------------------------------------
  // CREATE TRANSACTION
  // ---------------------------------------------------

  const transaction = new Transaction({
    userId: sponsor._id,
    memberId:
      sponsor.memberId || sponsor.userCode || "UNKNOWN",
    type: "referral_bonus",
    category: "referral",
    amount,
    grossAmount: amount,
    tdsPercentage: 0,
    tdsAmount: 0,
    adminFeePercentage: 0,
    adminFeeAmount: 0,
    netAmount: amount,
    balanceBefore,
    balanceAfter,
    referenceKey,
    status: "completed",
    payoutMethod: "WALLET_CREDIT",
    payoutDetails: "",
    description:
      `Direct referral income of ₹${amount} for referring ${
        referredUser.memberId ||
        referredUser.userCode ||
        referredUser._id
      }.`,
    reason: "Direct referral income",
    timestamp: new Date(),
  });

  // ---------------------------------------------------
  // SAVE TRANSACTION
  //
  // If saving fails, propagate the error. The caller's
  // transaction must roll back the wallet changes too.
  // Duplicate protection for concurrent requests also
  // depends on the appropriate unique index in the
  // Transaction model.
  // ---------------------------------------------------

  await transaction.save({
    session,
  });

  return {
    success: true,
    alreadyProcessed: false,
    amount,
    referenceKey,
    transaction,
  };
}

// =====================================================
// PUBLIC DIRECT REFERRAL INCOME PROCESSOR
// =====================================================

export async function processDirectReferralIncome({
  sponsorId,
  referredUserId,
  session = null,
} = {}) {
  if (!sponsorId) {
    throw new Error("sponsorId is required.");
  }

  if (!referredUserId) {
    throw new Error("referredUserId is required.");
  }

  // ---------------------------------------------------
  // USE CALLER'S SESSION
  // ---------------------------------------------------

  if (session) {
    return processDirectReferralIncomeInSession({
      sponsorId,
      referredUserId,
      session,
    });
  }

  // ---------------------------------------------------
  // CREATE A NEW TRANSACTION
  // ---------------------------------------------------

  const transactionSession = await mongoose.startSession();

  try {
    let result;

    await transactionSession.withTransaction(async () => {
      result = await processDirectReferralIncomeInSession({
        sponsorId,
        referredUserId,
        session: transactionSession,
      });
    });

    return result;
  } finally {
    await transactionSession.endSession();
  }
}

// =====================================================
// PROCESS ONE BINARY PAIR
// =====================================================

async function processSingleBinaryPair({
  parent,
  wallet,
  pairNumber,
  session,
}) {
  if (!session) {
    throw new Error(
      "MongoDB session is required for binary pair processing."
    );
  }

  const parentId = parent._id;

  const referenceKey = buildBinaryPairReferenceKey(
    parentId,
    pairNumber
  );

  // ---------------------------------------------------
  // CHECK EXISTING PAIR
  // ---------------------------------------------------

  const existingTransaction = await Transaction.findOne({
    referenceKey,
    type: "binary_income",
  })
    .session(session)
    .lean();

  if (existingTransaction) {
    return {
      pairNumber,
      paid: Number(existingTransaction.amount || 0) > 0,
      amount: Number(existingTransaction.amount || 0),
      milestone: isUnpaidPairMilestone(pairNumber),
      referenceKey,
      skipped: true,
    };
  }

  // ---------------------------------------------------
  // MILESTONE PAIR: RECORD, BUT DO NOT PAY
  // ---------------------------------------------------

  const milestone = isUnpaidPairMilestone(pairNumber);

  if (milestone) {
    const balance = Number(wallet.currentBalance || 0);

    const transaction = new Transaction({
      userId: parentId,
      memberId:
        parent.memberId || parent.userCode || "UNKNOWN",
      type: "binary_income",
      category: "referral",
      amount: 0,
      grossAmount: 0,
      netAmount: 0,
      balanceBefore: balance,
      balanceAfter: balance,
      referenceKey,
      description:
        `Binary pair #${pairNumber} completed - milestone pair, no payout`,
      status: "completed",
    });

    await transaction.save({
      session,
    });

    return {
      pairNumber,
      paid: false,
      amount: 0,
      milestone: true,
      referenceKey,
      skipped: false,
    };
  }

  // ---------------------------------------------------
  // PAID BINARY PAIR: ₹450
  // ---------------------------------------------------

  const amount = BINARY_PAIR_INCOME;

  const balanceBefore = Number(wallet.currentBalance || 0);

  const balanceAfter = Number(
    (balanceBefore + amount).toFixed(2)
  );

  // ---------------------------------------------------
  // UPDATE WALLET
  // ---------------------------------------------------

  wallet.currentBalance = balanceAfter;

  wallet.totalEarnings = Number(
    (Number(wallet.totalEarnings || 0) + amount).toFixed(2)
  );

  await wallet.save({
    session,
  });

  // ---------------------------------------------------
  // UPDATE USER INCOME TOTALS
  // ---------------------------------------------------

  await User.findByIdAndUpdate(
    parentId,
    {
      $inc: {
        matchingIncome: amount,
        todayMatchingIncome: amount,
        totalIncome: amount,
      },
    },
    {
      new: true,
      session,
    }
  );

  // ---------------------------------------------------
  // CREATE BINARY TRANSACTION
  // ---------------------------------------------------

  const transaction = new Transaction({
    userId: parentId,
    memberId:
      parent.memberId || parent.userCode || "UNKNOWN",
    type: "binary_income",
    category: "referral",
    amount,
    grossAmount: amount,
    netAmount: amount,
    balanceBefore,
    balanceAfter,
    referenceKey,
    description: `Binary pair #${pairNumber} income`,
    status: "completed",
  });

  await transaction.save({
    session,
  });

  return {
    pairNumber,
    paid: true,
    amount,
    milestone: false,
    referenceKey,
    skipped: false,
  };
}

// =====================================================
// INTERNAL BINARY INCOME PROCESSOR
// ALWAYS RUNS INSIDE A TRANSACTION
// =====================================================

async function processCompletedBinaryPairIncomeInSession({
  parentId,
  session,
}) {
  if (!parentId) {
    throw new Error("parentId is required.");
  }

  if (!session) {
    throw new Error("MongoDB session is required.");
  }

  // ---------------------------------------------------
  // GET PARENT
  // ---------------------------------------------------

  const parent = await User.findById(parentId).session(
    session
  );

  if (!parent) {
    return {
      success: false,
      message: "Parent user not found.",
      processedPairs: [],
      paidPairs: [],
      unpaidPairs: [],
      totalPaid: 0,
    };
  }

  // ---------------------------------------------------
  // PARENT MUST BE ACTIVE
  // ---------------------------------------------------

  if (
    String(parent.status || "")
      .trim()
      .toLowerCase() !== "active"
  ) {
    return {
      success: false,
      message:
        "Binary income can only be processed for an active user.",
      processedPairs: [],
      paidPairs: [],
      unpaidPairs: [],
      totalPaid: 0,
    };
  }

  // ---------------------------------------------------
  // COUNT ACTIVE DOWNLINE
  // ---------------------------------------------------

  const activeCounts = await countActiveBinaryTeam(
    parentId,
    {
      session,
    }
  );

  const leftCount = Number(
    activeCounts.leftActiveCount || 0
  );

  const rightCount = Number(
    activeCounts.rightActiveCount || 0
  );

  const totalActive = Number(
    activeCounts.totalActiveCount ??
      (leftCount + rightCount)
  );

  // ---------------------------------------------------
  // CALCULATE ELIGIBLE PAIRS
  // ---------------------------------------------------

  const eligiblePairCount = calculateEligiblePairCount({
    leftActiveCount: leftCount,
    rightActiveCount: rightCount,
  });

  // ---------------------------------------------------
  // NOT QUALIFIED
  // ---------------------------------------------------

  if (eligiblePairCount <= 0) {
    return {
      success: true,
      leftActiveCount: leftCount,
      rightActiveCount: rightCount,
      totalActiveDownline: totalActive,
      firstQualificationRequired:
        FIRST_QUALIFYING_DOWNLINE,
      firstQualificationMet: false,
      eligiblePairCount: 0,
      processedPairs: [],
      paidPairs: [],
      unpaidPairs: [],
      totalPaid: 0,
    };
  }

  // ---------------------------------------------------
  // GET OR CREATE WALLET
  // ---------------------------------------------------

  let wallet = await Wallet.findOne({
    userId: parentId,
  }).session(session);

  if (!wallet) {
    wallet = new Wallet({
      userId: parentId,
      memberId:
        parent.memberId || parent.userCode || "UNKNOWN",
      currentBalance: 0,
      totalEarnings: 0,
      captchaEarnings: 0,
      referralCommissions: 0,
    });

    await wallet.save({
      session,
    });
  }

  // ---------------------------------------------------
  // NORMALIZE WALLET VALUES
  // ---------------------------------------------------

  wallet.currentBalance = Number(wallet.currentBalance || 0);
  wallet.totalEarnings = Number(wallet.totalEarnings || 0);
  wallet.captchaEarnings = Number(wallet.captchaEarnings || 0);

  // ---------------------------------------------------
  // FIND ALREADY PROCESSED PAIRS
  // ---------------------------------------------------

  const processedPairNumbers =
    await getProcessedBinaryPairNumbers(parentId, {
      session,
    });

  const processedPairs = [];
  const paidPairs = [];
  const unpaidPairs = [];

  let totalPaid = 0;

  // ---------------------------------------------------
  // PROCESS EVERY ELIGIBLE PAIR NOT ALREADY RECORDED
  // ---------------------------------------------------

  for (
    let pairNumber = 1;
    pairNumber <= eligiblePairCount;
    pairNumber += 1
  ) {
    if (processedPairNumbers.has(pairNumber)) {
      continue;
    }

    const result = await processSingleBinaryPair({
      parent,
      wallet,
      pairNumber,
      session,
    });

    if (result.skipped) {
      continue;
    }

    processedPairs.push(result);

    if (result.paid) {
      paidPairs.push(result);
      totalPaid += Number(result.amount || 0);
    } else {
      unpaidPairs.push(result);
    }

    processedPairNumbers.add(pairNumber);
  }

  return {
    success: true,
    leftActiveCount: leftCount,
    rightActiveCount: rightCount,
    totalActiveDownline: totalActive,
    firstQualificationRequired:
      FIRST_QUALIFYING_DOWNLINE,
    firstQualificationMet:
      totalActive >= FIRST_QUALIFYING_DOWNLINE &&
      leftCount >= 1 &&
      rightCount >= 1,
    eligiblePairCount,
    processedPairs,
    paidPairs,
    unpaidPairs,
    totalPaid,
  };
}

// =====================================================
// PROCESS COMPLETED BINARY PAIRS
// PUBLIC PROCESSOR
// =====================================================

export async function processCompletedBinaryPairIncome({
  parentId,
  session = null,
} = {}) {
  if (!parentId) {
    throw new Error("parentId is required.");
  }

  // ---------------------------------------------------
  // USE AN EXISTING SESSION
  // ---------------------------------------------------

  if (session) {
    return processCompletedBinaryPairIncomeInSession({
      parentId,
      session,
    });
  }

  // ---------------------------------------------------
  // CREATE A NEW TRANSACTION
  // ---------------------------------------------------

  const transactionSession = await mongoose.startSession();

  try {
    let result;

    await transactionSession.withTransaction(async () => {
      result = await processCompletedBinaryPairIncomeInSession({
        parentId,
        session: transactionSession,
      });
    });

    return result;
  } finally {
    await transactionSession.endSession();
  }
}

// =====================================================
// GET BINARY INCOME STATUS
// READ-ONLY: DOES NOT CREATE OR PAY INCOME
// =====================================================

export async function getBinaryIncomeStatus(
  parentId,
  { session = null } = {}
) {
  if (!parentId) {
    throw new Error("parentId is required.");
  }

  // ---------------------------------------------------
  // GET PARENT
  // ---------------------------------------------------

  let parentQuery = User.findById(parentId).select(
    "_id name memberId userCode status matchingIncome todayMatchingIncome totalIncome"
  );

  if (session) {
    parentQuery = parentQuery.session(session);
  }

  const parent = await parentQuery.lean();

  if (!parent) {
    return null;
  }

  // ---------------------------------------------------
  // ACTIVE COUNTS
  // ---------------------------------------------------

  const activeCounts = await countActiveBinaryTeam(
    parentId,
    {
      session,
    }
  );

  const leftCount = Number(
    activeCounts.leftActiveCount || 0
  );

  const rightCount = Number(
    activeCounts.rightActiveCount || 0
  );

  const totalActive = Number(
    activeCounts.totalActiveCount ??
      (leftCount + rightCount)
  );

  // ---------------------------------------------------
  // ELIGIBLE PAIRS
  // ---------------------------------------------------

  const eligiblePairCount = calculateEligiblePairCount({
    leftActiveCount: leftCount,
    rightActiveCount: rightCount,
  });

  // ---------------------------------------------------
  // PROCESSED PAIRS
  // ---------------------------------------------------

  const processedPairNumbers =
    await getProcessedBinaryPairNumbers(parentId, {
      session,
    });

  // ---------------------------------------------------
  // PAIR HISTORY
  // ---------------------------------------------------

  const history = await getBinaryPairHistory(parentId, {
    session,
  });

  const paidPairCount = history.filter(
    (item) => item.paid
  ).length;

  const unpaidPairCount = history.filter(
    (item) => item.milestone && !item.paid
  ).length;

  // ---------------------------------------------------
  // FIRST QUALIFICATION
  // ---------------------------------------------------

  const firstQualificationMet =
    totalActive >= FIRST_QUALIFYING_DOWNLINE &&
    leftCount >= 1 &&
    rightCount >= 1;

  // ---------------------------------------------------
  // NEXT PAIR
  // ---------------------------------------------------

  const nextPairNumber = eligiblePairCount + 1;

  // ---------------------------------------------------
  // RESPONSE
  // ---------------------------------------------------

  return {
    parentId: parent._id,
    memberId: parent.memberId || parent.userCode || null,
    name: parent.name || "",
    status: parent.status || "inactive",

    leftActiveCount: leftCount,
    rightActiveCount: rightCount,
    totalActiveDownline: totalActive,

    firstQualificationRequired:
      FIRST_QUALIFYING_DOWNLINE,
    firstQualificationMet,

    eligiblePairCount,

    processedPairNumbers: Array.from(
      processedPairNumbers
    ).sort((a, b) => a - b),

    paidPairCount,
    unpaidPairCount,
    nextPairNumber,

    binaryPairIncome: BINARY_PAIR_INCOME,
    directReferralIncome: DIRECT_REFERRAL_INCOME,

    matchingIncome: Number(parent.matchingIncome || 0),
    todayMatchingIncome: Number(
      parent.todayMatchingIncome || 0
    ),
    totalIncome: Number(parent.totalIncome || 0),

    history,
  };
}

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
  BINARY_PAIR_INCOME,
  DIRECT_REFERRAL_INCOME,
  FIRST_QUALIFYING_DOWNLINE,
  UNPAID_PAIR_MILESTONES,
  isUnpaidPairMilestone,
  calculateEligiblePairCount,
  buildBinaryPairReferenceKey,
  buildDirectReferralReferenceKey,
  getProcessedBinaryPairNumbers,
  getBinaryPairHistory,
  processDirectReferralIncome,
  processCompletedBinaryPairIncome,
  getBinaryIncomeStatus,
};