import express from "express";
import mongoose from "mongoose";

import { User } from "../models/User.js";
import { BankDetails } from "../models/BankDetails.js";

import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// =====================================================
// ADMIN: EDIT CUSTOMER (profile + KYC + bank details)
// =====================================================
//
// GET /api/admin/customer-edit/:id
// PUT /api/admin/customer-edit/:id
//
// Used by admin/src/pages/customer/EditCustomer.jsx
//
// - Admin / superadmin only.
// - Name, mobile and email are saved on the User document.
// - PAN + bank / UPI details are saved in the BankDetails
//   collection and mirrored on the User document (same as
//   the customer's own /auth/kyc route).
// - Admin may change a verified PAN and may mark PAN
//   verified / unverified.
// - Same email / mobile on several accounts is allowed.
//
// =====================================================

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_REGEX = /^\d{6,18}$/;
const UPI_REGEX = /^[a-z0-9._-]{2,256}@[a-z][a-z0-9]{1,63}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10,15}$/;
const TEXT_MAX_LENGTH = 100;

const requireAdmin = (req, res, next) => {
  const role = String(req.user?.role || "").toLowerCase();

  if (!["admin", "superadmin"].includes(role)) {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }

  next();
};

const clean = (value) =>
  value === undefined || value === null
    ? undefined
    : String(value).trim();

// Current KYC: BankDetails record first, old User data as fallback.
const loadKyc = async (user) => {
  const record = await BankDetails.findOne({
    userId: user._id,
  }).lean();

  const legacy = user.bankDetails || {};

  if (record) {
    return {
      panNumber: record.panNumber || "",
      panVerified: Boolean(record.panVerified),
      accountHolderName: record.accountHolderName || "",
      accountNumber: record.accountNumber || "",
      ifscCode: record.ifscCode || "",
      bankName: record.bankName || "",
      upiId: record.upiId || "",
    };
  }

  return {
    panNumber: user.panNumber || "",
    panVerified: Boolean(user.panVerified),
    accountHolderName: legacy.accountHolderName || "",
    accountNumber: legacy.accountNumber || "",
    ifscCode: legacy.ifscCode || "",
    bankName: legacy.bankName || "",
    upiId: legacy.upiId || "",
  };
};

const buildCustomerResponse = async (user) => {
  const kyc = await loadKyc(user);

  return {
    _id: String(user._id),
    memberId: user.memberId || user.userCode || "",
    name: user.name || "",
    phone: user.phone || user.mobile || "",
    email: user.email || "",
    status: user.status || "",
    userType: user.userType || "",
    ...kyc,
  };
};

// =====================================================
// GET /:id
// =====================================================

router.get(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          success: false,
          message: "Database is currently unavailable.",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID.",
        });
      }

      const user = await User.findById(req.params.id)
        .select("-password")
        .lean();

      if (!user || user.role !== "user") {
        return res.status(404).json({
          success: false,
          message: "Customer not found.",
        });
      }

      return res.json({
        success: true,
        customer: await buildCustomerResponse(user),
      });
    } catch (error) {
      console.error("❌ Admin get customer error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to load customer.",
      });
    }
  }
);

// =====================================================
// PUT /:id
// =====================================================

router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          success: false,
          message: "Database is currently unavailable.",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID.",
        });
      }

      const user = await User.findById(req.params.id)
        .select(
          "role memberId userCode name phone mobile email panNumber panVerified bankDetails"
        )
        .lean();

      if (!user || user.role !== "user") {
        return res.status(404).json({
          success: false,
          message: "Customer not found.",
        });
      }

      const body = req.body || {};

      const fail = (message) =>
        res.status(400).json({ success: false, message });

      const name = clean(body.name);
      const phone = clean(body.phone)?.replace(/[\s-]/g, "");
      const email = clean(body.email)?.toLowerCase();

      const pan = clean(body.panNumber)?.toUpperCase();
      const holder = clean(body.accountHolderName);
      const accountNumber = clean(body.accountNumber);
      const ifsc = clean(body.ifscCode)?.toUpperCase();
      const bank = clean(body.bankName);
      const upi = clean(body.upiId)?.toLowerCase();

      // -----------------------------------------------
      // VALIDATION
      // -----------------------------------------------

      if (name !== undefined && !name) {
        return fail("Customer name is required.");
      }

      if (name && name.length > TEXT_MAX_LENGTH) {
        return fail("Customer name is too long.");
      }

      if (phone && !PHONE_REGEX.test(phone)) {
        return fail("Mobile number must be 10 to 15 digits.");
      }

      if (email && !EMAIL_REGEX.test(email)) {
        return fail("Please enter a valid email address.");
      }

      if (pan && !PAN_REGEX.test(pan)) {
        return fail("Invalid PAN format. It should look like ABCDE1234F.");
      }

      if (accountNumber && !ACCOUNT_REGEX.test(accountNumber)) {
        return fail("Account number must be 6 to 18 digits.");
      }

      if (ifsc && !IFSC_REGEX.test(ifsc)) {
        return fail("Invalid IFSC code. It should look like SBIN0001234.");
      }

      if (upi && !UPI_REGEX.test(upi)) {
        return fail("Invalid UPI ID. It should look like username@bank.");
      }

      if (holder && holder.length > TEXT_MAX_LENGTH) {
        return fail("Account holder name is too long.");
      }

      if (bank && bank.length > TEXT_MAX_LENGTH) {
        return fail("Bank name is too long.");
      }

      // -----------------------------------------------
      // MERGE WITH CURRENT KYC
      // Fields that were not sent keep their old value.
      // An empty string clears the field.
      // -----------------------------------------------

      const current = await loadKyc(user);

      const next = {
        panNumber: pan !== undefined ? pan : current.panNumber,
        accountHolderName:
          holder !== undefined ? holder : current.accountHolderName,
        accountNumber:
          accountNumber !== undefined
            ? accountNumber
            : current.accountNumber,
        ifscCode: ifsc !== undefined ? ifsc : current.ifscCode,
        bankName: bank !== undefined ? bank : current.bankName,
        upiId: upi !== undefined ? upi : current.upiId,
      };

      let panVerified =
        body.panVerified === undefined
          ? current.panVerified
          : Boolean(body.panVerified);

      // A PAN that was changed is unverified unless the admin
      // explicitly marks it verified in the same save.
      if (
        next.panNumber !== current.panNumber &&
        body.panVerified === undefined
      ) {
        panVerified = false;
      }

      if (!next.panNumber) {
        panVerified = false;
      }

      const hasAnyBankField = Boolean(
        next.accountNumber || next.ifscCode || next.bankName
      );

      if (
        hasAnyBankField &&
        (!next.accountHolderName ||
          !next.accountNumber ||
          !next.ifscCode ||
          !next.bankName)
      ) {
        return fail(
          "Please provide account holder name, bank name, account number and IFSC code together."
        );
      }

      const memberId = String(user.memberId || user.userCode || "")
        .trim()
        .toUpperCase();

      if (!memberId) {
        return fail("Member ID not found for this customer.");
      }

      // -----------------------------------------------
      // SAVE 1: BankDetails collection
      // -----------------------------------------------

      await BankDetails.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            memberId,
            panNumber: next.panNumber,
            panVerified,
            accountHolderName: next.accountHolderName,
            accountNumber: next.accountNumber,
            ifscCode: next.ifscCode,
            bankName: next.bankName,
            upiId: next.upiId,
          },
          $setOnInsert: { userId: user._id },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      // -----------------------------------------------
      // SAVE 2: User document (profile + KYC mirror)
      // -----------------------------------------------

      const userUpdate = {
        panNumber: next.panNumber,
        panVerified,
        bankDetails: {
          accountHolderName: next.accountHolderName,
          accountNumber: next.accountNumber,
          ifscCode: next.ifscCode,
          bankName: next.bankName,
          upiId: next.upiId,
        },
      };

      if (name !== undefined) userUpdate.name = name;
      if (email !== undefined) userUpdate.email = email;

      if (phone !== undefined) {
        // The schema uses one of these; unknown fields are
        // ignored by Mongoose, so setting both is safe.
        userUpdate.phone = phone;
        userUpdate.mobile = phone;
      }

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $set: userUpdate },
        { new: true, runValidators: true }
      )
        .select("-password")
        .lean();

      console.log(
        `🛠️ Admin ${req.user?.memberId || req.user?.id} updated customer ${memberId}`
      );

      return res.json({
        success: true,
        message: "Customer updated successfully.",
        customer: await buildCustomerResponse(updatedUser),
      });
    } catch (error) {
      console.error("❌ Admin update customer error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update customer.",
      });
    }
  }
);

export default router;