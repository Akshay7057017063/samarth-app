import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { getBinaryIncomeStatus } from "../utils/binaryIncome.js";

const targets = [
  { memberId: "SI688926", id: "6ad0a328f58067e893ee6da5" },
  { memberId: "SI681909", id: "6aca105edcba77276c2e68cc" },
];

async function main() {
  try {
    await connectDB();

    for (const target of targets) {
      console.log(`\n========== ${target.memberId} ==========`);

      const status = await getBinaryIncomeStatus(target.id);

      if (!status) {
        console.log("Member not found.");
        continue;
      }

      console.dir(
        {
          memberId: status.memberId,
          name: status.name,
          status: status.status,
          leftActiveCount: status.leftActiveCount,
          rightActiveCount: status.rightActiveCount,
          totalActiveDownline: status.totalActiveDownline,
          firstQualificationMet: status.firstQualificationMet,
          eligiblePairCount: status.eligiblePairCount,
          processedPairNumbers: status.processedPairNumbers,
          paidPairCount: status.paidPairCount,
          unpaidPairCount: status.unpaidPairCount,
          matchingIncome: status.matchingIncome,
          todayMatchingIncome: status.todayMatchingIncome,
          totalIncome: status.totalIncome,
          history: status.history,
        },
        { depth: null, colors: false }
      );
    }
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
