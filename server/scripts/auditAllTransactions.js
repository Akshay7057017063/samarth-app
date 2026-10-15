import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Transaction from "../models/Transaction.js";
import Wallet from "../models/Wallet.js";

const userId = new mongoose.Types.ObjectId("6aca105edcba77276c2e68cc");

async function main() {
  try {
    await connectDB();

    const wallet = await Wallet.findOne({ userId }).lean();
    const transactions = await Transaction.find({ userId })
      .select("type category amount grossAmount netAmount balanceBefore balanceAfter status referenceKey description reason createdAt")
      .sort({ createdAt: 1 })
      .lean();

    console.log("\nWALLET:");
    console.dir(wallet, { depth: 2 });

    console.log("\nALL TRANSACTIONS:");
    console.table(transactions.map((t) => ({
      date: t.createdAt,
      type: t.type,
      category: t.category,
      amount: t.amount,
      netAmount: t.netAmount,
      before: t.balanceBefore,
      after: t.balanceAfter,
      status: t.status,
      referenceKey: t.referenceKey || "",
      description: t.description || t.reason || "",
    })));

    console.log("\nTransaction count:", transactions.length);
    console.log("READ-ONLY: no changes made.");
  } catch (e) {
    console.error("Audit failed:", e.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}
main();
