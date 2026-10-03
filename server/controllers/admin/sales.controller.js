import mongoose from "mongoose";

import { Transaction } from "../../models/Transaction.js";

import {
  findCustomerByIdentifier,
  getAdminId,
  getSafeTransaction,
  getSafeUser,
  toNumber,
} from "../../utils/adminHelpers.js";

// =====================================================
// SELL PACKAGE
// =====================================================

export const sellPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { packageName, amount, pv } = req.body;

    const user = await findCustomerByIdentifier(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const numericAmount = Math.max(0, toNumber(amount));
    const numericPv = Math.max(0, toNumber(pv));
    const cleanPackageName = String(packageName || "Package").trim();

    const session = await mongoose.startSession();

    let updatedUser;
    let sale;

    try {
      await session.withTransaction(async () => {
        user.joiningPackage = cleanPackageName;
        user.userType = "PAID";
        user.activationDate = new Date();

        if (numericPv > 0) {
          user.leftPv = Number(user.leftPv || 0) + numericPv;
        }

        await user.save({ session });

        sale = new Transaction({
          userId: user._id,
          memberId: user.memberId,
          type: "credit",
          category: "package",
          amount: numericAmount,
          grossAmount: numericAmount,
          netAmount: numericAmount,
          balanceAfter: 0,
          status: "completed",
          description: `Package sale: ${cleanPackageName}`,
          reason: `Package sale: ${cleanPackageName}`,
          createdBy: getAdminId(req),
          timestamp: new Date(),
        });

        await sale.save({ session });

        updatedUser = user;
      });
    } finally {
      await session.endSession();
    }

    return res.json({
      success: true,
      message: "Package sold successfully.",
      user: getSafeUser(updatedUser),
      sale: getSafeTransaction(sale),
    });
  } catch (error) {
    console.error("❌ Sell package error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to sell package.",
    });
  }
};

// =====================================================
// GET SALES
// =====================================================

export const getSales = async (req, res) => {
  try {
    const sales = await Transaction.find({ category: "package" })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, count: sales.length, sales });
  } catch (error) {
    console.error("❌ Get sales error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch sales.",
    });
  }
};