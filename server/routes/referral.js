import express from "express";
import mongoose from "mongoose";

import { User } from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js";

import {
  registerInactiveMember,
  isDbReady,
} from "../utils/memberRegistration.js";

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
//
// These fields are used for authenticated customer
// referral / binary network data.
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

  // Referral stats
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

  const userId = String(req.user.id);

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  return User.findById(userId)
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
      member.sponsorId ||
      null,

    sponsorCode:
      member.sponsorCode ||
      "",

    sponsorMemberId:
      member.sponsorMemberId ||
      "",

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
      member.position ||
      null,

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
      member.binaryPath ||
      "/",

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
      const dateA =
        new Date(
          a?.createdAt || 0
        ).getTime();

      const dateB =
        new Date(
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
// Returns the ACTUAL BINARY TREE.
//
// Sponsor relationship:
//   sponsorId
//
// Binary relationship:
//   binaryParentId
//   binaryPosition
//   binaryLeftId
//   binaryRightId
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
        String(
          user.status || ""
        ).toLowerCase() !== "active"
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

      const binaryCounts =
        await countBinaryTeam(
          user._id
        );

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
      // BINARY PARENT
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
      // RESPONSE
      // -------------------------------------------------

      return res.status(200).json({
        success: true,

        tree: binaryTree,

        binaryTree,

        left: binaryLeft,

        right: binaryRight,

        leftTeam: binaryLeft
          ? [binaryLeft]
          : [],

        rightTeam: binaryRight
          ? [binaryRight]
          : [],

        parent:
          binaryParent
            ? formatMember(
                binaryParent
              )
            : null,

        stats: {
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

          leftCount:
            binaryCounts.leftCount,

          rightCount:
            binaryCounts.rightCount,

          totalTeam:
            binaryCounts.totalCount,

          totalCount:
            binaryCounts.totalCount,

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
// SPONSOR / DIRECT REFERRALS
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
        String(
          user.status || ""
        ).toLowerCase() !== "active"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account is inactive.",
        });
      }

      // -------------------------------------------------
      // PRIMARY QUERY
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

        const fallbackCodes =
          [];

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
                    $in:
                      fallbackCodes,
                  },
                },
                {
                  sponsorMemberId: {
                    $in:
                      fallbackCodes,
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

// =====================================================
// POST /api/referral/register
// =====================================================
//
// LOGGED-IN CUSTOMER REGISTERS NEW MEMBER
//
// IMPORTANT:
//
// Sponsor is ALWAYS the authenticated customer:
//   req.user.id
//
// The frontend cannot choose another sponsor by sending:
//   sponsorId
//   sponsorCode
//   sponsorMemberId
//
// New member:
// - status = inactive
// - wallet = Rs 0
// - no automatic login
// - binary position = selected Left/Right
// - activation happens later using admin PIN
// =====================================================


/* =====================================================
   POST /api/referral/register
   LOGGED-IN CUSTOMER REGISTERS A NEW MEMBER
===================================================== */

router.post(
  "/register",
  authenticateToken,
  async (req, res) => {
    try {
      // -------------------------------------------------
      // DATABASE CHECK
      // -------------------------------------------------

      if (!isDbReady()) {
        return res.status(503).json({
          success: false,
          message:
            "Database is currently unavailable. Please try again later.",
        });
      }

      // -------------------------------------------------
      // VALIDATE AUTHENTICATED USER ID
      // -------------------------------------------------

      const authenticatedId = String(req.user?.id || "");

      if (
        !authenticatedId ||
        !mongoose.Types.ObjectId.isValid(authenticatedId)
      ) {
        return res.status(401).json({
          success: false,
          message: "Invalid user session.",
        });
      }

      // -------------------------------------------------
      // FETCH SPONSOR FROM DATABASE
      // Never trust sponsor details sent by the frontend.
      // -------------------------------------------------

      const sponsor = await User.findById(authenticatedId);

      if (!sponsor) {
        return res.status(404).json({
          success: false,
          message: "Sponsor account not found.",
        });
      }

      // -------------------------------------------------
      // ROLE VALIDATION
      // -------------------------------------------------

      if (
        String(sponsor.role || "")
          .trim()
          .toLowerCase() !== "user"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only customer accounts can register new members.",
        });
      }

      // -------------------------------------------------
      // ACTIVE STATUS VALIDATION
      // -------------------------------------------------

      if (
        String(sponsor.status || "")
          .trim()
          .toLowerCase() !== "active"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account must be active to register a new referral.",
        });
      }

      // -------------------------------------------------
      // PAID ACCOUNT VALIDATION
      // -------------------------------------------------

      if (
        String(sponsor.userType || "")
          .trim()
          .toUpperCase() !== "PAID"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only a PAID sponsor can register a new referral. Please activate your account with a valid Paid PIN.",
        });
      }

      // -------------------------------------------------
      // REGISTER MEMBER
      //
      // New member remains inactive and UNPAID.
      // Its wallet starts at ₹0.
      // Direct referral income is NOT credited here.
      // -------------------------------------------------

      const result = await registerInactiveMember(
        sponsor,
        req.body || {}
      );

      return res.status(result.status).json(result.body);
    } catch (error) {
      console.error(
        "Member registration route error:",
        error
      );

      if (error?.code === 11000) {
        return res.status(400).json({
          success: false,
          message:
            "A user with the same email, phone or member ID already exists.",
        });
      }

      if (error?.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Invalid member registration details.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Server error during member registration.",
      });
    }
  }
);


// =====================================================
// EXPORT
// =====================================================

export default router;