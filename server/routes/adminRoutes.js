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
  deleteCustomer,
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
// CUSTOMER ACTIVATION PIN CONTROLLERS
// =====================================================

import {
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

import {
  listDevices,
  getCustomerDevices,
  approveDevice,
  rejectDevice,
  revokeActiveDevice,
} from "../controllers/admin/device.controller.js";

const router = express.Router();

// =====================================================
// ADMIN AUTHENTICATION
// =====================================================

router.use(
  authenticateToken,
  requireSuperOrAdmin
);

// =====================================================
// DEVICE BINDING MANAGEMENT
// =====================================================

router.get("/devices", listDevices);
router.post("/devices/:deviceId/approve", approveDevice);
router.post("/devices/:deviceId/reject", rejectDevice);
router.get("/customers/:id/devices", getCustomerDevices);
router.post("/customers/:id/devices/revoke", revokeActiveDevice);

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
// CAPTCHA SETTINGS
// =====================================================
//
// GET /api/admin/captcha/settings
// PUT /api/admin/captcha/settings
//
// These routes are protected by:
// authenticateToken
// requireSuperOrAdmin
//
// Admin controls:
// - enabled
// - CAPTCHA type
// - length
// - character sets
// - symbols
// - case sensitivity
// - expiry
// - submit cooldown
// - daily limit
// - reward amount
// - max attempts
// - refresh behaviour
// - image settings
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

// Send new activation PIN
// POST /api/admin/users/:id/send-activation-pin
//
// Body:
// {
//   "pinType": "paid" | "unpaid"
// }

router.post(
  "/users/:id/send-activation-pin",
  generateActivationPin
);

// Resend activation PIN
// POST /api/admin/users/:id/resend-activation-pin
//
// Body:
// {
//   "pinType": "paid" | "unpaid"
// }

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
// SITE CONTENT
// =====================================================

// Get website + legacy settings
router.get(
  "/site-content",
  getSiteContent
);

// Update website + legacy settings
router.put(
  "/site-content",
  updateSiteContent
);

// =====================================================
// BINARY TREE MANAGEMENT
// =====================================================
//
// All routes below are automatically protected by:
//
// authenticateToken
// requireSuperOrAdmin
//
// because router.use() above applies to all routes.
// =====================================================

// -----------------------------------------------------
// Get Binary Tree Root
// GET /api/admin/binary/root
// -----------------------------------------------------

router.get(
  "/binary/root",
  getBinaryRoot
);

// -----------------------------------------------------
// Search Users for Binary Placement
// GET /api/admin/binary/users?search=ABC
// -----------------------------------------------------

router.get(
  "/binary/users",
  searchBinaryUsers
);

// -----------------------------------------------------
// Get Binary Tree
// GET /api/admin/binary/tree/:userId?depth=5
// -----------------------------------------------------

router.get(
  "/binary/tree/:userId",
  getAdminBinaryTree
);

// -----------------------------------------------------
// Get Binary Children
// GET /api/admin/binary/children/:userId
// -----------------------------------------------------

router.get(
  "/binary/children/:userId",
  getAdminBinaryChildren
);

// -----------------------------------------------------
// Get Binary Parent
// GET /api/admin/binary/parent/:userId
// -----------------------------------------------------

router.get(
  "/binary/parent/:userId",
  getAdminBinaryParent
);

// -----------------------------------------------------
// Get Binary Status
// GET /api/admin/binary/status/:userId
// -----------------------------------------------------

router.get(
  "/binary/status/:userId",
  getAdminBinaryStatus
);

// -----------------------------------------------------
// Get Binary Team Counts
// GET /api/admin/binary/counts/:userId
// -----------------------------------------------------

router.get(
  "/binary/counts/:userId",
  getBinaryTeamCounts
);

// -----------------------------------------------------
// Manual Binary Placement
// POST /api/admin/binary/place
//
// Body:
// {
//   "userId": "...",
//   "parentId": "...",
//   "position": "left"
// }
// -----------------------------------------------------

router.post(
  "/binary/place",
  placeBinaryUser
);

// -----------------------------------------------------
// Automatic Binary Placement
// POST /api/admin/binary/auto-place
//
// Body:
// {
//   "userId": "..."
// }
//
// Optional:
// {
//   "userId": "...",
//   "parentId": "..."
// }
// -----------------------------------------------------

router.post(
  "/binary/auto-place",
  autoPlaceBinaryUser
);

// -----------------------------------------------------
// Synchronize Binary Team Counts
// POST /api/admin/binary/sync-counts/:userId
// -----------------------------------------------------

router.post(
  "/binary/sync-counts/:userId",
  syncAdminBinaryCounts
);

// =====================================================
// EXPORT
// =====================================================

export default router;