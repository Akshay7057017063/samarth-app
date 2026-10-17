// =====================================================
// MIGRATION: bankdetails collection
// =====================================================
//
// Kya karta hai:
// 1. "bankdetails" collection create karta hai (agar nahi hai)
// 2. Indexes banata hai (userId unique, memberId)
// 3. Purane User documents ka PAN + bank data
//    BankDetails me copy karta hai
//
// Safe hai: baar-baar chalane par kuch duplicate nahi hota,
// aur jo BankDetails record pehle se hai usse overwrite nahi karta.
// User collection me kuch change/delete nahi hota.
//
// Run (backend folder se):
//   node scripts/migrateBankDetails.js --dry   (sirf check, kuch save nahi)
//   node scripts/migrateBankDetails.js         (asli migration)
//
// =====================================================

import "dotenv/config";
import mongoose from "mongoose";

import { User } from "../models/User.js";
import { BankDetails } from "../models/BankDetails.js";

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGO_URL ||
  process.env.DATABASE_URL;

const DRY_RUN = process.argv.includes("--dry");

const str = (v) => (v === undefined || v === null ? "" : String(v).trim());

const run = async () => {
  if (!MONGO_URI) {
    console.error(
      "❌ MongoDB URI nahi mila. .env me MONGODB_URI (ya MONGO_URI) set karein."
    );
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB connected");
  console.log(DRY_RUN ? "🔍 DRY RUN mode (kuch save nahi hoga)" : "🚀 LIVE mode");

  // -------------------------------------------------
  // 1. COLLECTION + INDEXES
  // -------------------------------------------------

  if (!DRY_RUN) {
    const existing = await mongoose.connection.db
      .listCollections({ name: "bankdetails" })
      .toArray();

    if (existing.length === 0) {
      await BankDetails.createCollection();
      console.log("📁 'bankdetails' collection create ho gayi");
    } else {
      console.log("📁 'bankdetails' collection pehle se hai");
    }

    await BankDetails.syncIndexes();
    console.log("🔑 Indexes ready (userId unique, memberId)");
  }

  // -------------------------------------------------
  // 2. COPY OLD DATA FROM USERS
  // -------------------------------------------------

  const users = await User.collection
    .find(
      {
        role: "user",
        $or: [
          { panNumber: { $exists: true, $nin: ["", null] } },
          { "bankDetails.accountNumber": { $exists: true, $nin: ["", null] } },
          { "bankDetails.upiId": { $exists: true, $nin: ["", null] } },
          { "bankDetails.bankName": { $exists: true, $nin: ["", null] } },
        ],
      },
      {
        projection: {
          _id: 1,
          memberId: 1,
          userCode: 1,
          name: 1,
          panNumber: 1,
          panVerified: 1,
          bankDetails: 1,
        },
      }
    )
    .toArray();

  console.log(`👥 KYC data wale users mile: ${users.length}`);

  const ops = [];
  let skippedNoMemberId = 0;

  for (const u of users) {
    const memberId = str(u.memberId || u.userCode).toUpperCase();

    if (!memberId) {
      skippedNoMemberId += 1;
      continue;
    }

    const b = u.bankDetails || {};

    ops.push({
      updateOne: {
        filter: { userId: u._id },
        // $setOnInsert: agar record pehle se hai to overwrite nahi hoga
        update: {
          $setOnInsert: {
            userId: u._id,
            memberId,
            panNumber: str(u.panNumber).toUpperCase(),
            panVerified: Boolean(u.panVerified),
            accountHolderName: str(b.accountHolderName),
            accountNumber: str(b.accountNumber),
            ifscCode: str(b.ifscCode).toUpperCase(),
            bankName: str(b.bankName),
            upiId: str(b.upiId).toLowerCase(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        upsert: true,
      },
    });
  }

  if (skippedNoMemberId > 0) {
    console.warn(
      `⚠️ ${skippedNoMemberId} user(s) skip hue (memberId/userCode nahi tha)`
    );
  }

  if (ops.length === 0) {
    console.log("ℹ️ Copy karne ke liye kuch nahi mila.");
  } else if (DRY_RUN) {
    console.log(`🔍 DRY RUN: ${ops.length} record(s) copy hote.`);
  } else {
    const result = await BankDetails.collection.bulkWrite(ops, {
      ordered: false,
    });

    console.log(
      `✅ Migration complete. Naye records: ${result.upsertedCount}, pehle se maujood (skip): ${
        ops.length - result.upsertedCount
      }`
    );
  }

  const total = await BankDetails.countDocuments();
  console.log(`📊 bankdetails me total records: ${total}`);

  await mongoose.disconnect();
  console.log("👋 Done");
};

run().catch(async (error) => {
  console.error("❌ Migration failed:", error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});