import express from "express";
import mongoose from "mongoose";

import { User } from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js";

import {
  getMyBinaryTree,
  countBinaryTeam,
  getBinaryParent,
} from "../utils/binaryTree.js";

const router = express.Router();

// =====================================================
// SAFE CUSTOMER FIELDS
// =====================================================
//
// Never expose:
// - password
// - PAN
// - bank details
// - KYC private information
// - wallet financial information
// - other sensitive fields
//
// These fields are only for public/customer-network data.
// =====================================================

const CUSTOMER_PUBLIC_FIELDS = [
  "_id",

  "memberId",
  "userCode",

  "name",
  "email",
  "phone",

  "status",

  // Sponsor / Referral Tree
  "sponsorId",
  "sponsorCode",
  "sponsorMemberId",

  // Legacy referral structure
  "level",
  "position",

  // Binary Tree
  "binaryParentId",
  "binaryPosition",
  "binaryLeftId",
  "binaryRightId",
  "binaryLevel",
  "binaryPath",

  // Package / account
  "userType",
  "activationDate",
  "joiningPackage",
  "rank",

  // Referral counts
  "directReferralsCount",
  "teamCount",

  // Binary counts
  "leftCount",
  "rightCount",

  // Business
  "leftBusiness",
  "rightBusiness",

  // Referral counts
  "totalReferral",
  "activeReferral",

  // PV
  "leftPv",
  "rightPv",
  "leftCarryForwardPv",
  "rightCarryForwardPv",

  // Team
  "totalTeam",
  "activeTeam",
  "teamPercent",

  // Dates
  "createdAt",
  "updatedAt",
].join(" ");

// =====================================================
// HELPER: FIND AUTHENTICATED USER
// =====================================================

const findAuthenticatedUser = async (req) => {
  if (!req.user?.id) {
    return null;
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      String(req.user.id)
    )
  ) {
    return null;
  }

  return User.findById(req.user.id)
    .select(CUSTOMER_PUBLIC_FIELDS);
};

// =====================================================
// HELPER: NORMALIZE VALUE
// =====================================================

const normalize = (value) => {
  return String(value || "")
    .trim()
    .toUpperCase();
};

// =====================================================
// HELPER: FORMAT PUBLIC MEMBER
// =====================================================

const formatMember = (member) => {
  if (!member) {
    return null;
  }

  return {
    id: String(member._id),

    _id: member._id,

    // -------------------------------------------------
    // MEMBER IDENTIFIERS
    // -------------------------------------------------

    memberId:
      member.memberId ||
      member.userCode ||
      "—",

    userCode:
      member.userCode ||
      member.memberId ||
      "—",

    // -------------------------------------------------
    // BASIC INFO
    // -------------------------------------------------

    name:
      member.name ||
      "Unknown Member",

    email:
      member.email ||
      "",

    phone:
      member.phone ||
      "",

    status:
      member.status ||
      "active",

    rank:
      member.rank ||
      "Distributor",

    userType:
      member.userType ||
      "UNPAID",

    // -------------------------------------------------
    // SPONSOR / REFERRAL TREE
    // -------------------------------------------------

    sponsorId:
      member.sponsorId || null,

    sponsorCode:
      member.sponsorCode || "",

    sponsorMemberId:
      member.sponsorMemberId || "",

    level:
      Number(
        member.level || 1
      ),

    /*
     * Legacy referral position.
     *
     * IMPORTANT:
     * This is NOT binaryPosition.
     */
    position:
      member.position || null,

    // -------------------------------------------------
    // BINARY TREE
    // -------------------------------------------------

    binaryParentId:
      member.binaryParentId ||
      null,

    binaryPosition:
      member.binaryPosition ||
      null,

    binaryLeftId:
      member.binaryLeftId ||
      null,

    binaryRightId:
      member.binaryRightId ||
      null,

    binaryLevel:
      Number(
        member.binaryLevel || 1
      ),

    binaryPath:
      member.binaryPath || "/",

    // -------------------------------------------------
    // REFERRAL COUNTS
    // -------------------------------------------------

    directReferralsCount:
      Number(
        member.directReferralsCount || 0
      ),

    teamCount:
      Number(
        member.teamCount || 0
      ),

    // -------------------------------------------------
    // BINARY COUNTS
    // -------------------------------------------------

    leftCount:
      Number(
        member.leftCount || 0
      ),

    rightCount:
      Number(
        member.rightCount || 0
      ),

    totalTeam:
      Number(
        member.totalTeam || 0
      ),

    activeTeam:
      Number(
        member.activeTeam || 0
      ),

    teamPercent:
      Number(
        member.teamPercent || 0
      ),

    // -------------------------------------------------
    // BUSINESS
    // -------------------------------------------------

    leftBusiness:
      Number(
        member.leftBusiness || 0
      ),

    rightBusiness:
      Number(
        member.rightBusiness || 0
      ),

    // -------------------------------------------------
    // REFERRAL STATS
    // -------------------------------------------------

    totalReferral:
      Number(
        member.totalReferral || 0
      ),

    activeReferral:
      Number(
        member.activeReferral || 0
      ),

    // -------------------------------------------------
    // PV
    // -------------------------------------------------

    leftPv:
      Number(
        member.leftPv || 0
      ),

    rightPv:
      Number(
        member.rightPv || 0
      ),

    leftCarryForwardPv:
      Number(
        member.leftCarryForwardPv || 0
      ),

    rightCarryForwardPv:
      Number(
        member.rightCarryForwardPv || 0
      ),

    // -------------------------------------------------
    // PACKAGE
    // -------------------------------------------------

    activationDate:
      member.activationDate ||
      null,

    joiningPackage:
      member.joiningPackage ||
      "",

    // -------------------------------------------------
    // DATES
    // -------------------------------------------------

    createdAt:
      member.createdAt ||
      null,

    updatedAt:
      member.updatedAt ||
      null,

    // -------------------------------------------------
    // BINARY TREE CHILDREN
    // -------------------------------------------------

    children: {
      left: null,
      right: null,
    },
  };
};

// =====================================================
// HELPER: SORT MEMBERS
// =====================================================

const sortMembersByCreatedAt = (
  members,
  direction = 1
) => {
  return [...members].sort(
    (a, b) => {
      const dateA = new Date(
        a?.createdAt || 0
      ).getTime();

      const dateB = new Date(
        b?.createdAt || 0
      ).getTime();

      return (
        (dateA - dateB) *
        direction
      );
    }
  );
};

// =====================================================
// GET /api/referral/tree
// =====================================================
//
// IMPORTANT:
//
// This endpoint now returns the ACTUAL BINARY TREE.
//
// Sponsor relationship:
//     sponsorId
//
// Binary relationship:
//     binaryParentId
//     binaryPosition
//     binaryLeftId
//     binaryRightId
//
// The binary tree is loaded from:
//     server/utils/binaryTree.js
//
// =====================================================

router.get(
  "/tree",
  authenticateToken,
  async (req, res) => {
    try {
      // -------------------------------------------------
      // FIND CURRENT USER
      // -------------------------------------------------

      const user =
        await findAuthenticatedUser(req);

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // -------------------------------------------------
      // CHECK ACCOUNT STATUS
      // -------------------------------------------------

      if (
        user.status &&
        String(
          user.status
        ).toLowerCase() !==
          "active"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account is inactive.",
        });
      }

      // -------------------------------------------------
      // LOAD ACTUAL BINARY TREE
      // -------------------------------------------------
      //
      // getMyBinaryTree() starts from the authenticated
      // customer and follows:
      //
      // binaryLeftId
      // binaryRightId
      //
      // It does NOT use sponsorId.
      // -------------------------------------------------

      const binaryTree =
        await getMyBinaryTree(
          user._id,
          5
        );

      if (!binaryTree) {
        return res.status(404).json({
          success: false,
          message:
            "Binary tree not found.",
        });
      }

      // -------------------------------------------------
      // CALCULATE LIVE ROOT COUNTS
      // -------------------------------------------------
      //
      // This calculates actual descendants from binary
      // child references instead of trusting potentially
      // stale stored counts.
      // -------------------------------------------------

      const binaryCounts =
        await countBinaryTeam(
          user._id
        );

      // -------------------------------------------------
      // OVERRIDE ROOT COUNTS WITH LIVE VALUES
      // -------------------------------------------------

      binaryTree.leftCount =
        binaryCounts.leftCount;

      binaryTree.rightCount =
        binaryCounts.rightCount;

      binaryTree.totalTeam =
        binaryCounts.totalCount;

      // -------------------------------------------------
      // BINARY DIRECT CHILDREN
      // -------------------------------------------------

      const binaryLeft =
        binaryTree?.children?.left ||
        null;

      const binaryRight =
        binaryTree?.children?.right ||
        null;

      // -------------------------------------------------
      // OPTIONAL BINARY PARENT
      // -------------------------------------------------

      const binaryParent =
        await getBinaryParent(
          user._id
        );

      // -------------------------------------------------
      // BINARY LEVEL
      // -------------------------------------------------

      const binaryLevel =
        Number(
          binaryTree?.binaryLevel ||
            user?.binaryLevel ||
            1
        );

      // -------------------------------------------------
      // RETURN RESPONSE
      // -------------------------------------------------

      return res.status(200).json({
        success: true,

        // -----------------------------------------------
        // Main binary tree
        // -----------------------------------------------

        tree: binaryTree,

        // -----------------------------------------------
        // Explicit binary tree alias
        //
        // Frontend can use either:
        // data.tree
        // or
        // data.binaryTree
        // -----------------------------------------------

        binaryTree,

        // -----------------------------------------------
        // Binary direct children
        // -----------------------------------------------

        left: binaryLeft,

        right: binaryRight,

        leftTeam: binaryLeft
          ? [binaryLeft]
          : [],

        rightTeam: binaryRight
          ? [binaryRight]
          : [],

        // -----------------------------------------------
        // Binary parent
        // -----------------------------------------------

        parent:
          binaryParent
            ? formatMember(
                binaryParent
              )
            : null,

        // -----------------------------------------------
        // Statistics
        // -----------------------------------------------

        stats: {
          // Sponsor/referral direct members
          // are intentionally NOT mixed into
          // binary counts.
          directCount:
            Number(
              user.directReferralsCount ||
                user.totalReferral ||
                0
            ),

          activeDirectCount:
            Number(
              user.activeReferral ||
                0
            ),

          // Actual binary descendants
          leftCount:
            binaryCounts.leftCount,

          rightCount:
            binaryCounts.rightCount,

          totalTeam:
            binaryCounts.totalCount,

          totalCount:
            binaryCounts.totalCount,

          // Useful UI data
          binaryLevel,

          binaryPosition:
            user.binaryPosition ||
            null,

          binaryPath:
            user.binaryPath ||
            "/",

          hasLeft:
            Boolean(binaryLeft),

          hasRight:
            Boolean(binaryRight),
        },
      });
    } catch (error) {
      console.error(
        "❌ Binary tree error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Failed to fetch binary tree.",
      });
    }
  }
);

// =====================================================
// GET /api/referral/directs
// =====================================================
//
// This endpoint remains the SPONSOR / REFERRAL TREE.
//
// It is intentionally separate from binary placement.
//
// sponsorId = direct referral relationship
//
// binaryParentId = binary placement relationship
// =====================================================

router.get(
  "/directs",
  authenticateToken,
  async (req, res) => {
    try {
      // -------------------------------------------------
      // FIND CURRENT USER
      // -------------------------------------------------

      const user =
        await findAuthenticatedUser(req);

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // -------------------------------------------------
      // CHECK ACCOUNT STATUS
      // -------------------------------------------------

      if (
        user.status &&
        String(
          user.status
        ).toLowerCase() !==
          "active"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account is inactive.",
        });
      }

      // -------------------------------------------------
      // PRIMARY QUERY
      // sponsorId
      // -------------------------------------------------

      let directMembers =
        await User.find({
          role: "user",
          sponsorId: user._id,
        })
          .select(
            CUSTOMER_PUBLIC_FIELDS
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      // -------------------------------------------------
      // LEGACY FALLBACK
      // -------------------------------------------------
      //
      // Older records may not have sponsorId populated.
      // Use sponsorCode / sponsorMemberId as fallback.
      //
      // This does NOT affect binary tree placement.
      // -------------------------------------------------

      if (
        directMembers.length === 0
      ) {
        const userCode =
          normalize(
            user.userCode
          );

        const memberId =
          normalize(
            user.memberId
          );

        const fallbackCodes = [];

        if (userCode) {
          fallbackCodes.push(
            userCode
          );
        }

        if (
          memberId &&
          memberId !== userCode
        ) {
          fallbackCodes.push(
            memberId
          );
        }

        if (
          fallbackCodes.length > 0
        ) {
          directMembers =
            await User.find({
              role: "user",
              $or: [
                {
                  sponsorCode: {
                    $in: fallbackCodes,
                  },
                },
                {
                  sponsorMemberId: {
                    $in: fallbackCodes,
                  },
                },
              ],
            })
              .select(
                CUSTOMER_PUBLIC_FIELDS
              )
              .sort({
                createdAt: -1,
              })
              .lean();
        }
      }

      // -------------------------------------------------
      // REMOVE DUPLICATES
      // -------------------------------------------------

      const uniqueMembers =
        new Map();

      for (
        const member of directMembers
      ) {
        uniqueMembers.set(
          String(member._id),
          member
        );
      }

      // -------------------------------------------------
      // FORMAT DIRECT MEMBERS
      // -------------------------------------------------

      const sortedMembers =
        sortMembersByCreatedAt(
          Array.from(
            uniqueMembers.values()
          ),
          -1
        );

      const directs =
        sortedMembers.map(
          (member) => {
            const formatted =
              formatMember(
                member
              );

            return {
              ...formatted,

              // Direct referral endpoint
              // does not return recursive children.
              children: {
                left: null,
                right: null,
              },
            };
          }
        );

      // -------------------------------------------------
      // DIRECT STATS
      // -------------------------------------------------

      const activeDirectCount =
        directs.filter(
          (member) =>
            String(
              member.status || ""
            ).toLowerCase() ===
            "active"
        ).length;

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.status(200).json({
        success: true,

        directs,

        stats: {
          directCount:
            directs.length,

          activeDirectCount,

          totalDirects:
            directs.length,

          activeDirects:
            activeDirectCount,
        },
      });
    } catch (error) {
      console.error(
        "❌ Referral directs error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          "Failed to fetch direct referrals.",
      });
    }
  }
);

export default router;