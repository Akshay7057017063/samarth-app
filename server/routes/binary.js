import express from "express";

import { authenticateToken } from "../middleware/auth.js";

import {
  getMyBinaryTree,
  getBinaryChildren,
  getBinaryParent,
  getBinaryStatus,
  countBinaryTeam,
} from "../utils/binaryTree.js";

const router = express.Router();

/* =========================================================
   HELPER: GET AUTHENTICATED USER ID
========================================================= */

const getAuthenticatedUserId = (req) => {
  return (
    req.user?.id ||
    req.user?._id ||
    null
  );
};

/* =========================================================
   HELPER: GET TREE DEPTH
========================================================= */

const getTreeDepth = (value) => {
  const depth = Number(value);

  if (!Number.isFinite(depth)) {
    return 5;
  }

  return Math.max(
    1,
    Math.min(
      Math.floor(depth),
      10
    )
  );
};

/* =========================================================
   GET MY BINARY TREE
========================================================= */
/*
 * GET /api/binary/tree
 * GET /api/binary/tree?depth=5
 */

router.get(
  "/tree",
  authenticateToken,
  async (req, res) => {
    try {
      const userId =
        getAuthenticatedUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "User authentication information not found.",
        });
      }

      const depth =
        getTreeDepth(
          req.query.depth
        );

      const tree =
        await getMyBinaryTree(
          userId,
          depth
        );

      if (!tree) {
        return res.status(404).json({
          success: false,
          message:
            "Binary tree not found.",
        });
      }

      return res.status(200).json({
        success: true,

        message:
          "Binary tree fetched successfully.",

        data: tree,

        // Frontend compatibility
        tree,

        binaryTree: tree,

        meta: {
          depth,

          rootId:
            String(tree._id),

          binaryLevel:
            Number(
              tree.binaryLevel || 1
            ),

          binaryPosition:
            tree.binaryPosition ||
            null,

          binaryPath:
            tree.binaryPath ||
            "/",
        },
      });
    } catch (error) {
      console.error(
        "❌ GET /api/binary/tree error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error?.message ||
          "Failed to fetch binary tree.",

        ...(process.env.NODE_ENV !==
        "production"
          ? {
              error:
                error?.message,
            }
          : {}),
      });
    }
  }
);

/* =========================================================
   GET MY BINARY CHILDREN
========================================================= */
/*
 * GET /api/binary/children
 */

router.get(
  "/children",
  authenticateToken,
  async (req, res) => {
    try {
      const userId =
        getAuthenticatedUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "User authentication information not found.",
        });
      }

      const children =
        await getBinaryChildren(
          userId
        );

      return res.status(200).json({
        success: true,

        message:
          "Binary children fetched successfully.",

        data: children,

        children,

        left:
          children?.left ||
          null,

        right:
          children?.right ||
          null,
      });
    } catch (error) {
      console.error(
        "❌ GET /api/binary/children error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error?.message ||
          "Failed to fetch binary children.",

        ...(process.env.NODE_ENV !==
        "production"
          ? {
              error:
                error?.message,
            }
          : {}),
      });
    }
  }
);

/* =========================================================
   GET MY BINARY PARENT
========================================================= */
/*
 * GET /api/binary/parent
 */

router.get(
  "/parent",
  authenticateToken,
  async (req, res) => {
    try {
      const userId =
        getAuthenticatedUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "User authentication information not found.",
        });
      }

      const parent =
        await getBinaryParent(
          userId
        );

      return res.status(200).json({
        success: true,

        message:
          "Binary parent fetched successfully.",

        data:
          parent || null,

        parent:
          parent || null,
      });
    } catch (error) {
      console.error(
        "❌ GET /api/binary/parent error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error?.message ||
          "Failed to fetch binary parent.",

        ...(process.env.NODE_ENV !==
        "production"
          ? {
              error:
                error?.message,
            }
          : {}),
      });
    }
  }
);

/* =========================================================
   GET MY BINARY STATUS
========================================================= */
/*
 * GET /api/binary/status
 */

router.get(
  "/status",
  authenticateToken,
  async (req, res) => {
    try {
      const userId =
        getAuthenticatedUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "User authentication information not found.",
        });
      }

      const status =
        await getBinaryStatus(
          userId
        );

      return res.status(200).json({
        success: true,

        message:
          "Binary status fetched successfully.",

        data: status,

        status,
      });
    } catch (error) {
      console.error(
        "❌ GET /api/binary/status error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error?.message ||
          "Failed to fetch binary status.",

        ...(process.env.NODE_ENV !==
        "production"
          ? {
              error:
                error?.message,
            }
          : {}),
      });
    }
  }
);

/* =========================================================
   GET MY BINARY TEAM COUNTS
========================================================= */
/*
 * GET /api/binary/counts
 */

router.get(
  "/counts",
  authenticateToken,
  async (req, res) => {
    try {
      const userId =
        getAuthenticatedUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "User authentication information not found.",
        });
      }

      const counts =
        await countBinaryTeam(
          userId
        );

      return res.status(200).json({
        success: true,

        message:
          "Binary team counts fetched successfully.",

        data: counts,

        counts: {
          left:
            Number(
              counts?.leftCount ||
                0
            ),

          right:
            Number(
              counts?.rightCount ||
                0
            ),

          total:
            Number(
              counts?.totalCount ||
                0
            ),
        },
      });
    } catch (error) {
      console.error(
        "❌ GET /api/binary/counts error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error?.message ||
          "Failed to fetch binary team counts.",

        ...(process.env.NODE_ENV !==
        "production"
          ? {
              error:
                error?.message,
            }
          : {}),
      });
    }
  }
);

/* =========================================================
   EXPORT ROUTER
========================================================= */

export default router;