
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
  getCaptchaStats,
  getCustomerCaptchaStats,
} from "../controllers/adminController.js";

const router = express.Router();

// =====================================================
// ADMIN AUTHENTICATION
// =====================================================

router.use(
  authenticateToken,
  requireSuperOrAdmin
);

// =====================================================
// ADMIN DASHBOARD
// =====================================================

router.get(
  "/stats",
  getAdminStats
);

// =====================================================
// CAPTCHA STATISTICS
// =====================================================

// Overall CAPTCHA statistics
router.get(
  "/captcha/stats",
  getCaptchaStats
);

// Specific customer's CAPTCHA statistics
router.get(
  "/users/:id/captcha-stats",
  getCustomerCaptchaStats
);

// =====================================================
// CUSTOMER MANAGEMENT
// =====================================================

// Get all customers
router.get(
  "/users",
  getUsers
);

// Create customer
router.post(
  "/users",
  createCustomer
);

// Get customer details
router.get(
  "/users/:id/details",
  getCustomerDetails
);

// Update customer
router.put(
  "/users/:id/update-all",
  updateCustomer
);

// Reset customer password
router.put(
  "/users/:id/reset-password",
  resetCustomerPassword
);

// Delete customer
router.delete(
  "/users/:id",
  deleteCustomer
);

// Activate / deactivate customer
router.put(
  "/users/:id/toggle-status",
  toggleCustomerStatus
);

// =====================================================
// CUSTOMER WALLET / PACKAGE
// =====================================================

// Adjust wallet
router.post(
  "/users/:id/adjust-wallet",
  adjustWallet
);

// Sell package
router.post(
  "/users/:id/sell-package",
  sellPackage
);

// =====================================================
// CUSTOMER IMPERSONATION
// =====================================================

router.post(
  "/users/:id/impersonate",
  impersonateCustomer
);

// =====================================================
// SALES
// =====================================================

router.get(
  "/sales",
  getSales
);

// =====================================================
// WITHDRAWALS
// =====================================================

router.get(
  "/withdrawals",
  getWithdrawals
);

// Withdrawal action
router.put(
  "/withdrawals/:id/action",
  withdrawalAction
);

// =====================================================
// TDS REPORT
// =====================================================

router.get(
  "/tds-report",
  getTdsReport
);

// =====================================================
// SITE CONTENT / CAPTCHA SETTINGS
// =====================================================

// Get website + CAPTCHA settings
router.get(
  "/site-content",
  getSiteContent
);

// Update website + CAPTCHA settings
router.put(
  "/site-content",
  updateSiteContent
);

export default router;

