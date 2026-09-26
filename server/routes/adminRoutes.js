import express from "express";

import { authenticateToken } from "../middleware/auth.js";

import { requireSuperOrAdmin } from "../middleware/adminAuth.js";

import {
  getAdminStats,

  getUsers,

  createCustomer,

  getCustomerDetails,

  updateCustomer,

  resetCustomerPassword,

  adjustWallet,

  sellPackage,

  impersonateCustomer,

  deleteCustomer,

  getSales,

  toggleCustomerStatus,

  getWithdrawals,

  withdrawalAction,

  getTdsReport,

  getSiteContent,

  updateSiteContent,

  // Captcha statistics
  getCaptchaStats,

  getCustomerCaptchaStats,
} from "../controllers/adminController.js";

const router = express.Router();

// =====================================================
// Admin Authentication
// =====================================================

router.use(
  authenticateToken,
  requireSuperOrAdmin
);

// =====================================================
// Dashboard
// =====================================================

router.get(
  "/stats",
  getAdminStats
);

// =====================================================
// Captcha Statistics
// =====================================================

// Overall captcha statistics for admin dashboard
router.get(
  "/captcha/stats",
  getCaptchaStats
);

// Captcha statistics for a specific customer
router.get(
  "/users/:id/captcha-stats",
  getCustomerCaptchaStats
);

// =====================================================
// Customers
// =====================================================

router.get(
  "/users",
  getUsers
);

router.post(
  "/users",
  createCustomer
);

router.get(
  "/users/:id/details",
  getCustomerDetails
);

router.put(
  "/users/:id/update-all",
  updateCustomer
);

// Reset customer password
router.put(
  "/users/:id/reset-password",
  resetCustomerPassword
);

router.delete(
  "/users/:id",
  deleteCustomer
);

router.put(
  "/users/:id/toggle-status",
  toggleCustomerStatus
);

// =====================================================
// Customer Wallet / Package
// =====================================================

router.post(
  "/users/:id/adjust-wallet",
  adjustWallet
);

router.post(
  "/users/:id/sell-package",
  sellPackage
);

// =====================================================
// Customer Impersonation
// =====================================================

router.post(
  "/users/:id/impersonate",
  impersonateCustomer
);

// =====================================================
// Sales
// =====================================================

router.get(
  "/sales",
  getSales
);

// =====================================================
// Withdrawals
// =====================================================

router.get(
  "/withdrawals",
  getWithdrawals
);

router.put(
  "/withdrawals/:id/action",
  withdrawalAction
);

// =====================================================
// TDS
// =====================================================

router.get(
  "/tds-report",
  getTdsReport
);

// =====================================================
// Site Content
// =====================================================

router.get(
  "/site-content",
  getSiteContent
);

router.put(
  "/site-content",
  updateSiteContent
);

export default router;