import { User } from "../../models/User.js";

import {
  findBinaryRoot,
  getBinaryTree,
  getBinaryChildren,
  getBinaryParent,
  getBinaryStatus,
  placeUserUnderParent,
  autoPlaceUser,
  syncBinaryTeamCounts,
  countBinaryTeam,
  isValidObjectId,
} from "../../utils/binaryTree.js";

// =========================================================
// HELPER - SAFE USER RESPONSE
// =========================================================

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const data = user.toObject
    ? user.toObject()
    : { ...user };

  delete data.password;

  return data;
};

// =========================================================
// GET BINARY ROOT
// =========================================================
// GET /api/admin/binary/root
// =========================================================

export const getBinaryRoot = async (req, res) => {
  try {
    const root = await findBinaryRoot();

    if (!root) {
      return res.status(404).json({
        success: false,
        message: "Binary tree root not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Binary root fetched successfully",
      data: sanitizeUser(root),
    });
  } catch (error) {
    console.error("❌ getBinaryRoot error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch binary root",
      error: error.message,
    });
  }
};

// =========================================================
// GET BINARY TREE
// =========================================================
// GET /api/admin/binary/tree/:userId?depth=5
// =========================================================

export const getAdminBinaryTree = async (req, res) => {
  try {
    const { userId } = req.params;

    const depth = Number(req.query.depth) || 5;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const tree = await getBinaryTree(userId, depth);

    return res.status(200).json({
      success: true,
      message: "Binary tree fetched successfully",
      data: tree,
    });
  } catch (error) {
    console.error("❌ getAdminBinaryTree error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch binary tree",
      error: error.message,
    });
  }
};

// =========================================================
// GET BINARY CHILDREN
// =========================================================
// GET /api/admin/binary/children/:userId
// =========================================================

export const getAdminBinaryChildren = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const children = await getBinaryChildren(userId);

    return res.status(200).json({
      success: true,
      message: "Binary children fetched successfully",
      data: {
        left: sanitizeUser(children.left),
        right: sanitizeUser(children.right),
      },
    });
  } catch (error) {
    console.error(
      "❌ getAdminBinaryChildren error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch binary children",
      error: error.message,
    });
  }
};

// =========================================================
// GET BINARY PARENT
// =========================================================
// GET /api/admin/binary/parent/:userId
// =========================================================

export const getAdminBinaryParent = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const parent = await getBinaryParent(userId);

    return res.status(200).json({
      success: true,
      message: "Binary parent fetched successfully",
      data: sanitizeUser(parent),
    });
  } catch (error) {
    console.error(
      "❌ getAdminBinaryParent error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch binary parent",
      error: error.message,
    });
  }
};

// =========================================================
// GET BINARY STATUS
// =========================================================
// GET /api/admin/binary/status/:userId
// =========================================================

export const getAdminBinaryStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const status = await getBinaryStatus(userId);

    return res.status(200).json({
      success: true,
      message: "Binary status fetched successfully",
      data: status,
    });
  } catch (error) {
    console.error(
      "❌ getAdminBinaryStatus error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch binary status",
      error: error.message,
    });
  }
};

// =========================================================
// MANUAL BINARY PLACEMENT
// =========================================================
// POST /api/admin/binary/place
//
// Body:
//
// {
//   "userId": "...",
//   "parentId": "...",
//   "position": "left"
// }
//
// =========================================================

export const placeBinaryUser = async (req, res) => {
  try {
    const {
      userId,
      parentId,
      position,
    } = req.body;

    // -----------------------------------------------
    // Validation
    // -----------------------------------------------

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    if (!parentId) {
      return res.status(400).json({
        success: false,
        message: "parentId is required",
      });
    }

    if (!["left", "right"].includes(position)) {
      return res.status(400).json({
        success: false,
        message: 'position must be "left" or "right"',
      });
    }

    if (
      !isValidObjectId(userId) ||
      !isValidObjectId(parentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId or parentId",
      });
    }

    // -----------------------------------------------
    // Check user exists
    // -----------------------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // -----------------------------------------------
    // Check parent exists
    // -----------------------------------------------

    const parent = await User.findById(parentId);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Binary parent not found",
      });
    }

    // -----------------------------------------------
    // Place user
    // -----------------------------------------------

    const placedUser = await placeUserUnderParent({
      userId,
      parentId,
      position,
    });

    return res.status(200).json({
      success: true,
      message: `User successfully placed on ${position} side`,
      data: {
        user: sanitizeUser(placedUser),
        parent: sanitizeUser(parent),
        position,
      },
    });
  } catch (error) {
    console.error(
      "❌ placeBinaryUser error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to place user",
    });
  }
};

// =========================================================
// AUTO PLACE USER
// =========================================================
// POST /api/admin/binary/auto-place
//
// Body:
//
// {
//   "userId": "..."
// }
//
// OR:
//
// {
//   "userId": "...",
//   "parentId": "..."
// }
//
// =========================================================

export const autoPlaceBinaryUser = async (req, res) => {
  try {
    const {
      userId,
      parentId = null,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    if (
      parentId &&
      !isValidObjectId(parentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid parentId",
      });
    }

    const result = await autoPlaceUser({
      userId,
      parentId,
    });

    return res.status(200).json({
      success: true,
      message: result.isRoot
        ? "User created as binary tree root"
        : `User automatically placed on ${result.position} side`,
      data: {
        user: sanitizeUser(result.user),
        parent: sanitizeUser(result.parent),
        position: result.position,
        isRoot: result.isRoot,
      },
    });
  } catch (error) {
    console.error(
      "❌ autoPlaceBinaryUser error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to automatically place user",
    });
  }
};

// =========================================================
// GET TEAM COUNTS
// =========================================================
// GET /api/admin/binary/counts/:userId
// =========================================================

export const getBinaryTeamCounts = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const counts = await countBinaryTeam(userId);

    return res.status(200).json({
      success: true,
      message: "Binary team counts fetched successfully",
      data: counts,
    });
  } catch (error) {
    console.error(
      "❌ getBinaryTeamCounts error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch binary team counts",
      error: error.message,
    });
  }
};

// =========================================================
// SYNC TEAM COUNTS
// =========================================================
// POST /api/admin/binary/sync-counts/:userId
// =========================================================

export const syncAdminBinaryCounts = async (
  req,
  res
) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const result = await syncBinaryTeamCounts(userId);

    return res.status(200).json({
      success: true,
      message: "Binary team counts synchronized successfully",
      data: {
        counts: result.counts,
        user: sanitizeUser(result.user),
      },
    });
  } catch (error) {
    console.error(
      "❌ syncAdminBinaryCounts error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to synchronize binary counts",
      error: error.message,
    });
  }
};

// =========================================================
// SEARCH USERS FOR BINARY PLACEMENT
// =========================================================
// GET /api/admin/binary/users?search=...
//
// This will be useful for admin placement UI.
// =========================================================

export const searchBinaryUsers = async (req, res) => {
  try {
    const search = String(
      req.query.search || ""
    ).trim();

    const query = {
      role: "user",
    };

    if (search) {
      query.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          memberId: {
            $regex: search,
            $options: "i",
          },
        },
        {
          userCode: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const users = await User.find(query)
      .select(
        "_id memberId userCode name email phone status userType binaryParentId binaryPosition binaryLeftId binaryRightId binaryLevel binaryPath"
      )
      .sort({
        createdAt: -1,
      })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Binary users fetched successfully",
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error(
      "❌ searchBinaryUsers error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to search binary users",
      error: error.message,
    });
  }
};

// =========================================================
// EXPORT CHECK
// =========================================================
//
// All functions below are explicitly exported.
// This helps prevent:
// "argument handler must be a function"
// errors when connecting routes.
// =========================================================

export default {
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
};