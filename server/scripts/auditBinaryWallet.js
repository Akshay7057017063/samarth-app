import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { User } from "../models/User.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";

const parentId = "6aca105edcba77276c2e68cc";
const memberId = "SI681909";

async function main() {
  try {
    await connectDB();

    const user = await User.findById(parentId)
      .select("_id memberId name status matchingIncome todayMatchingIncome totalIncome")
      .lean();

    const wallet = await Wallet.findOne({
      userId: new mongoose.Types.ObjectId(parentId),
    }).lean();

    const transactions = await Transaction.find({
      referenceKey: {
        $regex: `^BINARY_PAIR:${parentId}:\\d+$`,
      },
    })
      .select("userId memberId type category referenceKey amount grossAmount netAmount balanceBefore balanceAfter status description createdAt")
      .sort({ createdAt: 1 })
      .lean();

    console.log(`\n========== USER: ${memberId} ==========`);
    console.dir(user, { depth: null });

    console.log("\n========== WALLET ==========");
    console.dir(
      wallet
        ? {
            userId: wallet.userId,
            memberId: wallet.memberId,
            currentBalance: wallet.currentBalance,
            totalEarnings: wallet.totalEarnings,
            referralCommissions: wallet.referralCommissions,
            totalWithdrawn: wallet.totalWithdrawn,
          }
        : "NO WALLET FOUND",
      { depth: null }
    );

    console.log("\n========== BINARY TRANSACTIONS ==========");
    console.table(
      transactions.map((t) => ({
        memberId: t.memberId,
        type: t.type,
        amount: t.amount,
        grossAmount: t.grossAmount,
        netAmount: t.netAmount,
        balanceBefore: t.balanceBefore,
        balanceAfter: t.balanceAfter,
        status: t.status,
        referenceKey: t.referenceKey,
        createdAt: t.createdAt,
      }))
    );

    console.log("\nTransaction count:", transactions.length);
    console.log(
      "Sum of transaction amounts:",
      transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0)
    );
    console.log("\nREAD-ONLY AUDIT COMPLETE. No data was changed.");
  } catch (error) {
    console.error("Audit failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

main();
