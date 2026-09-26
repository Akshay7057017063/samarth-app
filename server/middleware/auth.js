import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "samarth_jwt_secret_token_key_2026_prod";

// =====================================================
// AUTHENTICATE JWT TOKEN
// =====================================================

export const authenticateToken = (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;

    // -----------------------------------------------
    // CHECK AUTHORIZATION HEADER
    // -----------------------------------------------

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message:
          "Access denied. No authorization token provided.",
      });
    }

    // -----------------------------------------------
    // CHECK BEARER FORMAT
    // -----------------------------------------------

    const parts =
      authHeader.trim().split(/\s+/);

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
        message:
          "Access denied. Token is missing.",
      });
    }

    // -----------------------------------------------
    // VERIFY TOKEN
    // -----------------------------------------------

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    // -----------------------------------------------
    // STORE USER INFORMATION
    // -----------------------------------------------

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

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message:
          "Session expired. Please login again.",
      });
    }

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired authentication token.",
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
// This keeps compatibility with existing routes.
// =====================================================

export const requireAdmin = (
  req,
  res,
  next
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const role = String(
      req.user.role || ""
    )
      .trim()
      .toLowerCase();

    if (
      role !== "admin" &&
      role !== "superadmin"
    ) {
      console.log(
        "❌ Admin access denied:",
        {
          id: req.user.id,
          memberId: req.user.memberId,
          role: req.user.role,
        }
      );

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
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Authorization error.",
    });
  }
};