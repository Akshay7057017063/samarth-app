import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Wallet from "../models/Wallet.js";

const userId = new mongoose.Types.ObjectId("6aca105edcba77276c2e68cc");

async function main() {
  try {
    await connectDB();

    const wallets = await Wallet.find({ userId }).sort({ createdAt: 1 }).lean();

    console.log("Wallet documents found:", wallets.length);
    console.table(wallets.map((w) => ({
      walletId: String(w._id),
      userId: String(w.userId),
      memberId: w.memberId,
      currentBalance: w.currentBalance,
      totalEarnings: w.totalEarnings,
      referralCommissions: w.referralCommissions,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    })));

    console.log("READ-ONLY AUDIT: no data changed.");
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
