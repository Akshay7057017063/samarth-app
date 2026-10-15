
import express from "express";

import { authenticateToken } from "../middleware/auth.js";
import { requireSuperOrAdmin } from "../middleware/adminAuth.js";

// =====================================================
// EXISTING ADMIN CONTROLLERS
// =====================================================

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
  getSales,
  toggleCustomerStatus,
  getWithdrawals,
  withdrawalAction,
  getTdsReport,
  getSiteContent,
  updateSiteContent,

  // CAPTCHA
  getCaptchaStats,
  getCustomerCaptchaStats,
  getCaptchaSettings,
  updateCaptchaSettings,
} from "../controllers/adminController.js";

// =====================================================
// CUSTOMER MANAGEMENT CONTROLLERS
// =====================================================

import {
  deleteCustomer,
  generateActivationPin,
  resendActivationPin,
} from "../controllers/admin/customer.controller.js";

// =====================================================
// BINARY TREE CONTROLLERS
// =====================================================

import {
  getBinaryRoot,
  getAdminBinaryTree,
  getAdminBinaryChildren,
  getAdminBinaryParent,
  getAdminBinaryStatus,
  placeBinaryUser,
  autoPlaceBinaryUser,
  getBinaryTeamCounts,
  syncAdminBinaryCounts,
  searchBinaryUsers,
} from "../controllers/admin/binary.controller.js";

// =====================================================
// DEVICE BINDING CONTROLLERS
// =====================================================

import {
  listDevices,
  getCustomerDevices,
  approveDevice,
  rejectDevice,
  revokeActiveDevice,
} from "../controllers/admin/device.controller.js";

// =====================================================
// ROUTER
// =====================================================

const router = express.Router();

// =====================================================
// ADMIN AUTHENTICATION
// All routes below require admin/superadmin access.
// =====================================================

router.use(
  authenticateToken,
  requireSuperOrAdmin
);

// =====================================================
// DEVICE BINDING MANAGEMENT
// =====================================================

router.get("/devices", listDevices);

router.post(
  "/devices/:deviceId/approve",
  approveDevice
);

router.post(
  "/devices/:deviceId/reject",
  rejectDevice
);

router.get(
  "/customers/:id/devices",
  getCustomerDevices
);

router.post(
  "/customers/:id/devices/revoke",
  revokeActiveDevice
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

router.get(
  "/captcha/stats",
  getCaptchaStats
);

router.get(
  "/users/:id/captcha-stats",
  getCustomerCaptchaStats
);

// =====================================================
// CAPTCHA SETTINGS
// =====================================================

router.get(
  "/captcha/settings",
  getCaptchaSettings
);

router.put(
  "/captcha/settings",
  updateCaptchaSettings
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
// CUSTOMER ACTIVATION PIN
// =====================================================

router.post(
  "/users/:id/send-activation-pin",
  generateActivationPin
);

router.post(
  "/users/:id/resend-activation-pin",
  resendActivationPin
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
// SITE CONTENT
// =====================================================

router.get(
  "/site-content",
  getSiteContent
);

router.put(
  "/site-content",
  updateSiteContent
);

// =====================================================
// BINARY TREE MANAGEMENT
// =====================================================

// Get binary root
router.get(
  "/binary/root",
  getBinaryRoot
);

// Search users for binary placement
router.get(
  "/binary/users",
  searchBinaryUsers
);

// Get binary tree
router.get(
  "/binary/tree/:userId",
  getAdminBinaryTree
);

// Get binary children
router.get(
  "/binary/children/:userId",
  getAdminBinaryChildren
);

// Get binary parent
router.get(
  "/binary/parent/:userId",
  getAdminBinaryParent
);

// Get binary status
router.get(
  "/binary/status/:userId",
  getAdminBinaryStatus
);

// Get binary team counts
router.get(
  "/binary/counts/:userId",
  getBinaryTeamCounts
);

// Manual binary placement
router.post(
  "/binary/place",
  placeBinaryUser
);

// Automatic binary placement
router.post(
  "/binary/auto-place",
  autoPlaceBinaryUser
);

// Synchronize binary team counts
router.post(
  "/binary/sync-counts/:userId",
  syncAdminBinaryCounts
);

// =====================================================
// EXPORT
// =====================================================

export default router;
