import "dotenv/config";

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import readline from "readline";

import { User } from "../models/User.js";

const MEMBER_ID = "SA268191";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);

    const stdin = process.stdin;

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let password = "";

    const onData = (char) => {
      if (char === "\r" || char === "\n") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(password);
        return;
      }

      if (char === "\u0003") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        process.exit(0);
      }

      if (char === "\u007f") {
        password = password.slice(0, -1);
        return;
      }

      password += char;
    };

    stdin.on("data", onData);
  });
}

async function main() {
  try {
    console.log("");
    console.log("======================================");
    console.log("   SET SUPER ADMIN PASSWORD");
    console.log("======================================");
    console.log("");

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("🟢 MongoDB connected.");
    console.log(`🗄️ Database: ${mongoose.connection.name}`);
    console.log("");

    const user = await User.findOne({
      memberId: MEMBER_ID,
      role: "superadmin",
    });

    if (!user) {
      throw new Error(
        `Super Admin with Member ID ${MEMBER_ID} was not found.`
      );
    }

    console.log(`Super Admin: ${user.name}`);
    console.log(`Email      : ${user.email}`);
    console.log(`Member ID  : ${user.memberId}`);
    console.log("");

    const password = await askHidden("Enter new password: ");

    if (!password || password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    const confirmPassword = await askHidden("Confirm new password: ");

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;
    user.status = "active";
    user.role = "superadmin";

    await user.save();

    console.log("");
    console.log("======================================");
    console.log("   ✅ PASSWORD UPDATED SUCCESSFULLY");
    console.log("======================================");
    console.log("");
    console.log(`Name       : ${user.name}`);
    console.log(`Email      : ${user.email}`);
    console.log(`Member ID  : ${user.memberId}`);
    console.log(`Role       : ${user.role}`);
    console.log(`Status     : ${user.status}`);
    console.log("");
    console.log("Admin Login:");
    console.log(`Login ID   : ${user.email}`);
    console.log("Password   : the new password you just entered");
    console.log("");
    console.log("⚠️ Keep your password private.");
    console.log("======================================");
  } catch (error) {
    console.error("");
    console.error("❌ ERROR:", error.message);
  } finally {
    rl.close();

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

main();
