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
// DIRECT REFERRAL / QUALIFICATION SETTINGS
// =====================================================

// Legacy constant retained for backward compatibility.
// New direct referral payout uses the qualification bonus.
export const DIRECT_REFERRAL_INCOME = 100;

export const REQUIRED_QUALIFIED_DIRECTS = 3;

export const FIRST_QUALIFICATION_REFERRAL_BONUS = 300;

export const BINARY_PAIR_REFERRAL_INCOME = 200;

// =====================================================
// ZERO PIN ACTIVATION RULE
// =====================================================
//
// A ZERO-PIN activated member:
// - Does not qualify as a PAID direct referral.
// - Does not receive CAPTCHA access through the existing
//   paid-account checks.
// - Does not trigger direct referral bonus for the sponsor.
//
// The sponsor may still be active without being PAID,
// preserving the existing sponsor eligibility behavior.
// =====================================================

export function isZeroPinActivatedUser(user) {
  if (!user) {
    return false;
  }

  if (user.activatedWithZeroPin === true) {
    return true;
  }

  const type = String(
    user.activationType ||
      user.activationPinType ||
      user.pinType ||
      ""
  )
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  return type === "ZERO_PIN" || type === "ZEROPIN";
}

// =====================================================
// COUNT QUALIFIED DIRECT REFERRALS
// Requires ACTIVE + PAID + NOT ZERO-PIN activated
// =====================================================

export async function countQualifiedDirectReferrals(
  sponsorId,
  { session = null } = {}
) {
  if (!sponsorId) {
    return 0;
  }

  let query = User.find({
    role: "user",
    sponsorId,
  }).select(
    "status userType activatedWithZeroPin activationType activationPinType pinType"
  );

  if (session) {
    query = query.session(session);
  }

  const directs = await query.lean();

  return directs.filter((user) => {
    const isActive =
      String(user.status || "")
        .trim()
        .toLowerCase() === "active";

    const isPaid =
      String(user.userType || "")
        .trim()
        .toUpperCase() === "PAID";

    const isZeroPin = isZeroPinActivatedUser(user);

    return isActive && isPaid && !isZeroPin;
  }).length;
}

// =====================================================
// UNPAID PAIR MILESTONES
// =====================================================
//
// Pair #5 is unpaid.
// Pair #10, #20, #30, #40, #50 ... are unpaid.
//
// These milestone pairs are recorded with Rs0 payout.
// The additional Rs200 pair referral bonus is also NOT
// credited for an unpaid milestone pair.
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
// First binary qualification:
// - At least 3 active binary downline members.
// - At least one active member on LEFT.
// - At least one active member on RIGHT.
//
// A 2 LEFT + 1 RIGHT OR 1 LEFT + 2 RIGHT placement
// qualifies for the first pair.
//
// After qualification:
// - Every 1 LEFT + 1 RIGHT represents one pair.
// - Each pair is processed at most once.
// - Pair #5 and each multiple of 10 from #10 onward
//   remain unpaid milestones.
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
// INCOME QUALIFICATION STATUS
// Requires 3 qualified direct referrals AND binary
// qualification (3 active members across both sides).
// =====================================================

export async function getIncomeQualificationStatus(
  parentId,
  { session = null } = {}
) {
  if (!parentId) {
    return {
      qualified: false,
      qualifyingDirectCount: 0,
      requiredDirectCount: REQUIRED_QUALIFIED_DIRECTS,
      eligiblePairCount: 0,
      leftActiveCount: 0,
      rightActiveCount: 0,
      hasRequiredDirects: false,
      hasBinaryQualification: false,
    };
  }

  const qualifyingDirectCount =
    await countQualifiedDirectReferrals(parentId, { session });

  const activeCounts = await countActiveBinaryTeam(parentId, {
    session,
  });

  const leftActiveCount = Number(
    activeCounts?.leftActiveCount || 0
  );

  const rightActiveCount = Number(
    activeCounts?.rightActiveCount || 0
  );

  const eligiblePairCount = calculateEligiblePairCount({
    leftActiveCount,
    rightActiveCount,
  });

  const hasRequiredDirects =
    qualifyingDirectCount >= REQUIRED_QUALIFIED_DIRECTS;

  const hasBinaryQualification = eligiblePairCount >= 1;

  return {
    qualified: hasRequiredDirects && hasBinaryQualification,

    qualifyingDirectCount,
    requiredDirectCount: REQUIRED_QUALIFIED_DIRECTS,

    leftActiveCount,
    rightActiveCount,
    eligiblePairCount,

    hasRequiredDirects,
    hasBinaryQualification,
  };
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
// LEGACY DIRECT REFERRAL REFERENCE KEY
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
// FIRST QUALIFICATION BONUS REFERENCE KEY
// One qualification bonus per parent.
// =====================================================

export function buildDirectQualificationReferenceKey(parentId) {
  return `DIRECT_QUALIFICATION:${String(parentId)}`;
}

// =====================================================
// BINARY PAIR REFERRAL BONUS REFERENCE KEY
// One Rs200 bonus per eligible pair after the first pair.
// =====================================================

export function buildBinaryPairReferralReferenceKey(
  parentId,
  pairNumber
) {
  return `BINARY_PAIR_REFERRAL:${String(parentId)}:${Number(
    pairNumber
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
// New rule:
// - No Rs100 direct payout for each customer.
// - Sponsor must be active.
// - Referred user must be active and PAID.
// - ZERO-PIN members never qualify.
// - Relationship must match the sponsor.
// - The same legacy referral must not be processed twice.
//
// The Rs300 first qualification bonus is credited by the
// binary processor after both qualification conditions
// are met. Later eligible pairs may earn the additional
// Rs200 pair referral bonus.
// =====================================================

async function processDirectReferralIncomeInSession({
  sponsorId,
  referredUserId,
  session,
}) {
  if (!sponsorId || !referredUserId) {
    throw new Error(
      "Sponsor ID and referred user ID are required."
    );
  }

  if (!session) {
    throw new Error(
      "MongoDB session is required for referral processing."
    );
  }

  const referenceKey = buildDirectReferralReferenceKey(
    sponsorId,
    referredUserId
  );

  // ---------------------------------------------------
  // CHECK PREVIOUS LEGACY PAYOUT
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
      skipped: true,
      amount: 0,
      referenceKey,
      transaction: existingTransaction,
    };
  }

  // ---------------------------------------------------
  // FIND AND VALIDATE SPONSOR
  // ---------------------------------------------------

  const sponsor = await User.findById(sponsorId).session(session);

  if (!sponsor) {
    throw new Error("Sponsor account not found.");
  }

  if (
    String(sponsor.status || "").trim().toLowerCase() !==
    "active"
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
    String(referredUser.status || "").trim().toLowerCase() !==
    "active"
  ) {
    throw new Error("Referred member must be active.");
  }

  if (
    String(referredUser.userType || "").trim().toUpperCase() !==
    "PAID"
  ) {
    throw new Error(
      "Direct referral qualification requires a PAID member."
    );
  }

  if (isZeroPinActivatedUser(referredUser)) {
    return {
      success: true,
      skipped: true,
      reason: "ZERO_PIN_ACTIVATION",
      amount: 0,
      referenceKey,
      transaction: null,
    };
  }

  if (
    String(referredUser.sponsorId || "") !== String(sponsor._id)
  ) {
    throw new Error("Invalid direct referral relationship.");
  }

  const qualifyingDirectCount =
    await countQualifiedDirectReferrals(sponsor._id, {
      session,
    });

  // Individual Rs100 payouts are deliberately disabled.
  // The bonus will be issued by the qualification processor.
  return {
    success: true,
    alreadyProcessed: false,
    skipped: true,

    reason:
      qualifyingDirectCount < REQUIRED_QUALIFIED_DIRECTS
        ? "THREE_QUALIFIED_DIRECTS_REQUIRED"
        : "WAITING_FOR_BINARY_QUALIFICATION_OR_PAIR_BONUS",

    qualifyingDirectCount,
    requiredDirectCount: REQUIRED_QUALIFIED_DIRECTS,

    amount: 0,
    referenceKey,
    transaction: null,
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
  // USE AN EXISTING SESSION
  // ---------------------------------------------------

  if (session) {
    return processDirectReferralIncomeInSession({
      sponsorId,
      referredUserId,
      session,
    });
  }

  // ---------------------------------------------------
  // CREATE A NEW TRANSACTION SESSION
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
// CREDIT REFERRAL BONUS WITH TRANSACTION AUDIT
// =====================================================
//
// Wallet update and transaction record use the same
// MongoDB session. Unique referenceKey protects against
// crediting the same bonus more than once.
// =====================================================

async function creditReferralLedgerBonus({
  parent,
  wallet,
  amount,
  referenceKey,
  description,
  session,
}) {
  if (!session) {
    throw new Error("MongoDB session is required.");
  }

  const existing = await Transaction.findOne({
    referenceKey,
    type: "referral_bonus",
  })
    .session(session)
    .lean();

  if (existing) {
    return 0;
  }

  const creditAmount = Number(amount);

  if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
    throw new Error("Invalid referral bonus amount.");
  }

  const balanceBefore = Number(wallet.currentBalance || 0);

  const balanceAfter = Number(
    (balanceBefore + creditAmount).toFixed(2)
  );

  // ---------------------------------------------------
  // UPDATE WALLET
  // ---------------------------------------------------

  wallet.currentBalance = balanceAfter;

  wallet.totalEarnings = Number(
    (Number(wallet.totalEarnings || 0) + creditAmount).toFixed(2)
  );

  wallet.referralCommissions = Number(
    (Number(wallet.referralCommissions || 0) + creditAmount)
      .toFixed(2)
  );

  await wallet.save({
    session,
  });

  // ---------------------------------------------------
  // UPDATE USER TOTAL INCOME
  // ---------------------------------------------------

  await User.findByIdAndUpdate(
    parent._id,
    {
      $inc: {
        totalIncome: creditAmount,
      },
    },
    {
      new: true,
      session,
    }
  );

  // ---------------------------------------------------
  // CREATE REFERRAL TRANSACTION
  // ---------------------------------------------------

  const transaction = new Transaction({
    userId: parent._id,

    memberId: parent.memberId || parent.userCode || "UNKNOWN",

    type: "referral_bonus",
    category: "referral",

    amount: creditAmount,
    grossAmount: creditAmount,

    tdsPercentage: 0,
    tdsAmount: 0,

    adminFeePercentage: 0,
    adminFeeAmount: 0,

    netAmount: creditAmount,

    balanceBefore,
    balanceAfter,

    referenceKey,

    status: "completed",

    payoutMethod: "WALLET_CREDIT",
    payoutDetails: "",

    description,
    reason: "Referral income bonus",
    timestamp: new Date(),
  });

  await transaction.save({
    session,
  });

  return creditAmount;
}

// =====================================================
// FIRST QUALIFICATION BONUS: Rs300, ONCE ONLY
// =====================================================

async function processFirstQualificationReferralBonus({
  parent,
  wallet,
  session,
}) {
  return creditReferralLedgerBonus({
    parent,
    wallet,

    amount: FIRST_QUALIFICATION_REFERRAL_BONUS,

    referenceKey: buildDirectQualificationReferenceKey(
      parent._id
    ),

    description:
      "First qualification referral bonus after 3 qualified directs and binary qualification.",

    session,
  });
}

// =====================================================
// BINARY PAIR REFERRAL BONUS: Rs200 FROM PAIR #2 ONWARD
// =====================================================

async function processBinaryPairReferralBonus({
  parent,
  wallet,
  pairNumber,
  session,
}) {
  // The first qualifying pair receives the separate Rs300
  // qualification bonus, not the additional Rs200 bonus.
  if (Number(pairNumber) <= 1) {
    return 0;
  }

  return creditReferralLedgerBonus({
    parent,
    wallet,

    amount: BINARY_PAIR_REFERRAL_INCOME,

    referenceKey: buildBinaryPairReferralReferenceKey(
      parent._id,
      pairNumber
    ),

    description: `Rs200 referral bonus for binary pair #${pairNumber}.`,

    session,
  });
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
    const existingAmount = Number(existingTransaction.amount || 0);

    return {
      pairNumber,

      paid: existingAmount > 0,
      amount: existingAmount,
      binaryAmount: existingAmount,
      referralAmount: 0,
      pairTotalIncome: existingAmount,

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
      binaryAmount: 0,
      referralAmount: 0,
      pairTotalIncome: 0,

      milestone: true,
      referenceKey,
      skipped: false,
    };
  }

  // ---------------------------------------------------
  // PAID BINARY PAIR: Rs450
  // ---------------------------------------------------

  const amount = BINARY_PAIR_INCOME;

  const balanceBefore = Number(wallet.currentBalance || 0);

  const balanceAfter = Number(
    (balanceBefore + amount).toFixed(2)
  );

  // ---------------------------------------------------
  // UPDATE WALLET FOR BINARY INCOME
  // ---------------------------------------------------

  wallet.currentBalance = balanceAfter;

  wallet.totalEarnings = Number(
    (Number(wallet.totalEarnings || 0) + amount).toFixed(2)
  );

  await wallet.save({
    session,
  });

  // ---------------------------------------------------
  // UPDATE USER BINARY INCOME TOTALS
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

  // ---------------------------------------------------
  // ADD Rs200 REFERRAL BONUS FOR PAIR #2 ONWARD
  // ---------------------------------------------------

  const referralAmount =
    await processBinaryPairReferralBonus({
      parent,
      wallet,
      pairNumber,
      session,
    });

  const pairTotalIncome = Number(
    (amount + referralAmount).toFixed(2)
  );

  return {
    pairNumber,

    paid: true,

    // Keep amount as the actual binary amount so existing
    // consumers still see Rs450 as the binary pair amount.
    amount,
    binaryAmount: amount,

    referralAmount,
    pairTotalIncome,

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
  // COUNT ACTIVE BINARY DOWNLINE
  // ---------------------------------------------------

  const activeCounts = await countActiveBinaryTeam(
    parentId,
    {
      session,
    }
  );

  const leftCount = Number(
    activeCounts?.leftActiveCount || 0
  );

  const rightCount = Number(
    activeCounts?.rightActiveCount || 0
  );

  const totalActive = Number(
    activeCounts?.totalActiveCount ??
      (leftCount + rightCount)
  );

  // ---------------------------------------------------
  // CALCULATE BINARY PAIRS
  // ---------------------------------------------------

  const eligiblePairCount = calculateEligiblePairCount({
    leftActiveCount: leftCount,
    rightActiveCount: rightCount,
  });

  // ---------------------------------------------------
  // REQUIRE 3 QUALIFIED DIRECT REFERRALS
  // AND THE FIRST QUALIFYING BINARY PAIR
  // ---------------------------------------------------

  const qualifyingDirectCount =
    await countQualifiedDirectReferrals(parentId, {
      session,
    });

  if (qualifyingDirectCount < REQUIRED_QUALIFIED_DIRECTS) {
    return {
      success: true,

      message:
        "Income requires 3 active PAID direct referrals and binary qualification.",

      reason: "THREE_QUALIFIED_DIRECTS_REQUIRED",

      qualifyingDirectCount,
      requiredDirectCount: REQUIRED_QUALIFIED_DIRECTS,

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
  // NOT BINARY-QUALIFIED YET
  // ---------------------------------------------------

  if (eligiblePairCount <= 0) {
    return {
      success: true,

      message:
        "Binary income requires at least 3 active downline members, with members on both sides.",

      reason: "BINARY_QUALIFICATION_REQUIRED",

      qualifyingDirectCount,
      requiredDirectCount: REQUIRED_QUALIFIED_DIRECTS,

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
  wallet.captchaEarnings = Number(wallet.captchaEarnings || 0);
  wallet.referralCommissions = Number(
    wallet.referralCommissions || 0
  );

  // ---------------------------------------------------
  // FIRST QUALIFICATION BONUS: Rs300 ONCE
  //
  // The direct count and binary qualification have already
  // been checked. The unique reference key prevents repeat
  // credits on subsequent processor runs.
  // ---------------------------------------------------

  const qualificationBonusPaid =
    await processFirstQualificationReferralBonus({
      parent,
      wallet,
      session,
    });

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

  // Include the qualification bonus in the total credited
  // by this run when this was the first successful credit.
  let totalPaid = Number(qualificationBonusPaid || 0);

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

      totalPaid += Number(
        result.pairTotalIncome ?? result.amount ?? 0
      );
    } else {
      unpaidPairs.push(result);
    }

    processedPairNumbers.add(pairNumber);
  }

  return {
    success: true,

    qualifyingDirectCount,
    requiredDirectCount: REQUIRED_QUALIFIED_DIRECTS,

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

    qualificationBonusPaid,

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
  // CREATE A NEW TRANSACTION SESSION
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
  // QUALIFIED DIRECT REFERRALS
  // ---------------------------------------------------

  const qualifyingDirectCount =
    await countQualifiedDirectReferrals(parentId, {
      session,
    });

  // ---------------------------------------------------
  // ACTIVE BINARY COUNTS
  // ---------------------------------------------------

  const activeCounts = await countActiveBinaryTeam(
    parentId,
    {
      session,
    }
  );

  const leftCount = Number(
    activeCounts?.leftActiveCount || 0
  );

  const rightCount = Number(
    activeCounts?.rightActiveCount || 0
  );

  const totalActive = Number(
    activeCounts?.totalActiveCount ??
      (leftCount + rightCount)
  );

  // ---------------------------------------------------
  // ELIGIBLE PAIRS
  // ---------------------------------------------------

  const eligiblePairCount = calculateEligiblePairCount({
    leftActiveCount: leftCount,
    rightActiveCount: rightCount,
  });

  const hasRequiredDirects =
    qualifyingDirectCount >= REQUIRED_QUALIFIED_DIRECTS;

  const incomeQualified =
    hasRequiredDirects && eligiblePairCount >= 1;

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
  // FIRST BINARY QUALIFICATION
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

    qualifyingDirectCount,
    requiredDirectCount: REQUIRED_QUALIFIED_DIRECTS,

    hasRequiredDirects,
    firstQualificationMet,
    incomeQualified,

    leftActiveCount: leftCount,
    rightActiveCount: rightCount,
    totalActiveDownline: totalActive,

    firstQualificationRequired:
      FIRST_QUALIFYING_DOWNLINE,

    eligiblePairCount,

    processedPairNumbers: Array.from(
      processedPairNumbers
    ).sort((a, b) => a - b),

    paidPairCount,
    unpaidPairCount,
    nextPairNumber,

    binaryPairIncome: BINARY_PAIR_INCOME,

    // Legacy constant retained in the response for consumers
    // that still read this field. New logic does not pay
    // individual Rs100 referrals.
    directReferralIncome: DIRECT_REFERRAL_INCOME,

    firstQualificationReferralBonus:
      FIRST_QUALIFICATION_REFERRAL_BONUS,

    binaryPairReferralIncome:
      BINARY_PAIR_REFERRAL_INCOME,

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
// Keep existing exports and expose the new helpers.
// =====================================================

export default {
  BINARY_PAIR_INCOME,
  DIRECT_REFERRAL_INCOME,
  FIRST_QUALIFYING_DOWNLINE,

  REQUIRED_QUALIFIED_DIRECTS,
  FIRST_QUALIFICATION_REFERRAL_BONUS,
  BINARY_PAIR_REFERRAL_INCOME,

  UNPAID_PAIR_MILESTONES,

  isZeroPinActivatedUser,
  isUnpaidPairMilestone,

  countQualifiedDirectReferrals,
  calculateEligiblePairCount,
  getIncomeQualificationStatus,

  buildBinaryPairReferenceKey,
  buildDirectReferralReferenceKey,
  buildDirectQualificationReferenceKey,
  buildBinaryPairReferralReferenceKey,

  getProcessedBinaryPairNumbers,
  getBinaryPairHistory,

  processDirectReferralIncome,
  processCompletedBinaryPairIncome,

  getBinaryIncomeStatus,
};