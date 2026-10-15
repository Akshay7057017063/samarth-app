import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { User } from "../models/User.js";
import { getBinaryIncomeStatus } from "../utils/binaryIncome.js";

async function main() {
  try {
    await connectDB();

    const members = await User.find({
      status: "active",
      $or: [
        { memberId: { $exists: true, $ne: "" } },
        { userCode: { $exists: true, $ne: "" } },
      ],
    })
      .select("_id memberId userCode name status binaryParentId")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    console.log("\nRecent active members (for identifying the correct upline):");
    console.table(
      members.map((u) => ({
        memberId: u.memberId || u.userCode || "",
        name: u.name || "",
        id: String(u._id),
        binaryParentId: u.binaryParentId ? String(u.binaryParentId) : "",
      }))
    );

    console.log(
      "\nThis script is READ-ONLY. It does not create transactions or change balances."
    );
  } catch (error) {
    console.error("Diagnostic failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

main();

