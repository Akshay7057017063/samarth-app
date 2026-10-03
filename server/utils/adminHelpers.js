import mongoose from "mongoose";

import { User } from "../models/User.js";
import { SiteContent } from "../models/SiteContent.js";

// =====================================================
// SAFE NUMBER
// =====================================================

export const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

// =====================================================
// ESCAPE HTML
// =====================================================

export const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

// =====================================================
// SAFE USER (password removed)
// =====================================================

export const getSafeUser = (user) => {
  if (!user) return null;

  const safeUser =
    typeof user.toObject === "function" ? user.toObject() : { ...user };

  delete safeUser.password;

  return safeUser;
};

// =====================================================
// SAFE TRANSACTION
// =====================================================

export const getSafeTransaction = (transaction) => {
  if (!transaction) return null;

  return typeof transaction.toObject === "function"
    ? transaction.toObject()
    : { ...transaction };
};

// =====================================================
// CUSTOMER FILTER (admins are never customers)
// =====================================================

export const customerFilter = {
  role: { $nin: ["admin", "superadmin"] },
};

// =====================================================
// ADMIN ID FROM REQUEST (for createdBy / processedBy)
// =====================================================

export const getAdminId = (req) =>
  mongoose.Types.ObjectId.isValid(req.user?.id) ? req.user.id : null;

// =====================================================
// FIND CUSTOMER BY MONGO ID / MEMBER ID / USER CODE
// =====================================================

export const findCustomerByIdentifier = async (identifier) => {
  if (identifier === undefined || identifier === null) return null;

  const value = String(identifier).trim();
  if (!value) return null;

  let user = null;

  // 1. Try MongoDB _id first
  if (mongoose.Types.ObjectId.isValid(value)) {
    user = await User.findById(value);
  }

  // 2. Try member ID / user code
  if (!user) {
    const normalizedValue = value.toUpperCase();

    user = await User.findOne({
      $or: [{ memberId: normalizedValue }, { userCode: normalizedValue }],
    });
  }

  if (!user) return null;

  // 3. Admin accounts must never be treated as customers
  const role = String(user.role || "user")
    .trim()
    .toLowerCase();

  if (role === "admin" || role === "superadmin") return null;

  return user;
};

// =====================================================
// TODAY DATE KEY (YYYY-MM-DD)
// =====================================================

export const getTodayDateKey = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// =====================================================
// DEFAULT CMS SETTINGS
// =====================================================

export const DEFAULT_SITE_SETTINGS = {
  captchaLength: 6,
  captchaReward: 0.5,
  dailyCaptchaLimit: 50,
  tdsRateWithPan: 5,
  tdsRateNoPan: 20,
  adminFeeRate: 5,
  minWithdrawalAmount: 200,
};

// =====================================================
// GET CMS SETTINGS (validated)
// =====================================================

export const getSiteSettings = async () => {
  const content = await SiteContent.findOne({ key: "main" }).lean();
  const settings = content?.settings || {};
  const d = DEFAULT_SITE_SETTINGS;

  return {
    captchaLength: Math.min(
      10,
      Math.max(4, Math.floor(toNumber(settings.captchaLength, d.captchaLength)))
    ),
    captchaReward: Math.max(0, toNumber(settings.captchaReward, d.captchaReward)),
    dailyCaptchaLimit: Math.max(
      1,
      Math.floor(toNumber(settings.dailyCaptchaLimit, d.dailyCaptchaLimit))
    ),
    tdsRateWithPan: Math.max(0, toNumber(settings.tdsRateWithPan, d.tdsRateWithPan)),
    tdsRateNoPan: Math.max(0, toNumber(settings.tdsRateNoPan, d.tdsRateNoPan)),
    adminFeeRate: Math.max(0, toNumber(settings.adminFeeRate, d.adminFeeRate)),
    minWithdrawalAmount: Math.max(
      0,
      toNumber(settings.minWithdrawalAmount, d.minWithdrawalAmount)
    ),
  };
};