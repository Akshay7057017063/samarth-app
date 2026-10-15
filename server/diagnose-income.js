import "dotenv/config";
import mongoose from "mongoose";

import { User } from "./models/User.js";
import { Wallet } from "./models/Wallet.js";
import { Transaction } from "./models/Transaction.js";
import { countActiveBinaryTeam } from "./utils/binaryTree.js";

const memberCode = String(process.argv[2] || "").trim();

if (!memberCode) {
  console.error(
    "Usage: node diagnose-income.js <ROOT_MEMBER_CODE>"
  );
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: "samarth_platform",
  });

  const user = await User.findOne({
    role: "user",
    $or: [
      { memberId: memberCode },
      { userCode: memberCode },
    ],
  })
    .select(
      "_id memberId userCode name status userType matchingIncome todayMatchingIncome totalIncome"
    )
    .lean();

  if (!user) {
    throw new Error(`Root customer not found: ${memberCode}`);
  }

  const [wallet, transactions, activeCounts] = await Promise.all([
    Wallet.findOne({ userId: user._id }).lean(),

    Transaction.find({
      userId: user._id,
      type: "binary_income",
    })
      .select(
        "type amount netAmount status referenceKey description createdAt"
      )
      .sort({ createdAt: 1 })
      .lean(),

    countActiveBinaryTeam(user._id),
  ]);

  const paidTransactions = transactions.filter(
    (transaction) =>
      String(transaction.status).toLowerCase() === "completed" &&
      Number(transaction.amount ?? transaction.netAmount ?? 0) > 0
  );

  const transactionIncome = paidTransactions.reduce(
    (sum, transaction) =>
      sum + Number(transaction.amount ?? transaction.netAmount ?? 0),
    0
  );

  console.log(
    JSON.stringify(
      {
        user: {
          memberId: user.memberId,
          name: user.name,
          status: user.status,
          userType: user.userType,
          matchingIncome: user.matchingIncome,
          todayMatchingIncome: user.todayMatchingIncome,
          totalIncome: user.totalIncome,
        },
        wallet: wallet
          ? {
              currentBalance: wallet.currentBalance,
              totalEarnings: wallet.totalEarnings,
              captchaEarnings: wallet.captchaEarnings,
              referralCommissions: wallet.referralCommissions,
              totalWithdrawn: wallet.totalWithdrawn,
            }
          : null,
        activeBinaryTeam: activeCounts,
        binaryLedger: {
          transactionCount: transactions.length,
          paidTransactionCount: paidTransactions.length,
          paidTransactionTotal: transactionIncome,
          transactions: transactions.map((transaction) => ({
            amount: transaction.amount,
            status: transaction.status,
            referenceKey: transaction.referenceKey,
            description: transaction.description,
            createdAt: transaction.createdAt,
          })),
        },
      },
      null,
      2
    )
  );
} catch (error) {
  console.error("Income diagnostic failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}