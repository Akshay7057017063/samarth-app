
import jwt from "jsonwebtoken";

// =====================================================
// JWT SECRET
// =====================================================

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn(
    "⚠️ JWT_SECRET is not defined in .env. Authentication will fail until it is configured."
  );
}

// =====================================================
// AUTHENTICATE JWT TOKEN
// =====================================================

export const authenticateToken = (req, res, next) => {
  try {
    // -------------------------------------------------
    // CHECK JWT SECRET
    // -------------------------------------------------

    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server authentication configuration is missing.",
      });
    }

    // -------------------------------------------------
    // GET AUTHORIZATION HEADER
    // -------------------------------------------------

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message:
          "Access denied. No authorization token provided.",
      });
    }

    // -------------------------------------------------
    // CHECK BEARER FORMAT
    // -------------------------------------------------

    const parts = authHeader.trim().split(/\s+/);

    if (
      parts.length !== 2 ||
      parts[0].toLowerCase() !== "bearer"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authorization format. Use Bearer token.",
      });
    }

    const token = parts[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token is missing.",
      });
    }

    // -------------------------------------------------
    // VERIFY JWT
    // -------------------------------------------------

    const decoded = jwt.verify(token, JWT_SECRET);

    // -------------------------------------------------
    // STORE DECODED USER INFORMATION
    // -------------------------------------------------

    req.user = decoded;

    console.log("🔐 Authenticated user:", {
      id: decoded.id,
      memberId: decoded.memberId,
      role: decoded.role,
      name: decoded.name,
    });

    next();
  } catch (error) {
    console.error(
      "❌ Authentication error:",
      error.message
    );

    // -------------------------------------------------
    // TOKEN EXPIRED
    // -------------------------------------------------

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message:
          "Session expired. Please login again.",
      });
    }

    // -------------------------------------------------
    // INVALID TOKEN
    // -------------------------------------------------

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid or expired authentication token.",
      });
    }

    // -------------------------------------------------
    // OTHER AUTH ERRORS
    // -------------------------------------------------

    return res.status(401).json({
      success: false,
      message:
        "Authentication failed.",
    });
  }
};

// =====================================================
// REQUIRE ADMIN
// =====================================================
//
// Allows:
// - admin
// - superadmin
//
// Must be used AFTER authenticateToken.
// =====================================================

export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const role = String(req.user.role || "")
      .trim()
      .toLowerCase();

    if (
      role !== "admin" &&
      role !== "superadmin"
    ) {
      console.log("❌ Admin access denied:", {
        id: req.user.id,
        memberId: req.user.memberId,
        role: req.user.role,
      });

      return res.status(403).json({
        success: false,
        message:
          "Access forbidden. Administrator privileges required.",
      });
    }

    next();
  } catch (error) {
    console.error(
      "❌ Admin authorization error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Authorization error.",
    });
  }
};

// =====================================================
// REQUIRE SUPERADMIN
// =====================================================
//
// Only superadmin can access the route.
// =====================================================

export const requireSuperAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const role = String(req.user.role || "")
      .trim()
      .toLowerCase();

    if (role !== "superadmin") {
      console.log("❌ Superadmin access denied:", {
        id: req.user.id,
        memberId: req.user.memberId,
        role: req.user.role,
      });

      return res.status(403).json({
        success: false,
        message:
          "Access forbidden. Superadmin privileges required.",
      });
    }

    next();
  } catch (error) {
    console.error(
      "❌ Superadmin authorization error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Authorization error.",
    });
  }
};

// =====================================================
// REQUIRE ADMIN OR SUPERADMIN
// =====================================================
//
// Compatibility helper for existing admin routes.
// =====================================================

export const requireSuperOrAdmin = (
  req,
  res,
  next
) => {
  return requireAdmin(req, res, next);
};

