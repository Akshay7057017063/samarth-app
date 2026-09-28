
import { requireSuperOrAdmin } from "./auth.js";

// =====================================================
// ADMIN AUTHORIZATION COMPATIBILITY MIDDLEWARE
// =====================================================
//
// This file is kept because existing routes import:
//     ../middleware/adminAuth.js
//
// The actual authorization logic is maintained in:
//     middleware/auth.js
//
// Allowed roles:
// - admin
// - superadmin
// =====================================================

export { requireSuperOrAdmin };

export default requireSuperOrAdmin;

