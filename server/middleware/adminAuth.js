const requireSuperOrAdmin = (req, res, next) => {
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

    if (role !== "admin" && role !== "superadmin") {
      console.log("❌ Admin authorization failed:", {
        userId: req.user.id,
        memberId: req.user.memberId,
        role: req.user.role,
      });

      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin authorization error:", error);

    return res.status(500).json({
      success: false,
      message: "Authorization error.",
    });
  }
};

export { requireSuperOrAdmin };
export default requireSuperOrAdmin;