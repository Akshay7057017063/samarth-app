import express from "express";
import mongoose from "mongoose";

import { User } from "../models/User.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// =====================================================
// SAFE CUSTOMER FIELDS
// =====================================================
// Never expose password, PAN, bank details or other
// private financial/KYC fields of other customers.
// =====================================================

const CUSTOMER_PUBLIC_FIELDS = [
  "_id",
  "memberId",
  "userCode",
  "name",
  "email",
  "phone",
  "status",
  "sponsorId",
  "sponsorCode",
  "sponsorMemberId",
  "level",
  "position",
  "userType",
  "activationDate",
  "joiningPackage",
  "rank",
  "directReferralsCount",
  "teamCount",
  "leftCount",
  "rightCount",
  "leftBusiness",
  "rightBusiness",
  "totalReferral",
  "activeReferral",
  "leftPv",
  "rightPv",
  "leftCarryForwardPv",
  "rightCarryForwardPv",
  "totalTeam",
  "activeTeam",
  "teamPercent",
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
      req.user.id
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

    memberId:
      member.userCode ||
      member.memberId ||
      "—",

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

    level:
      Number(member.level || 1),

    position:
      member.position === "right"
        ? "right"
        : "left",

    directReferralsCount:
      Number(
        member.directReferralsCount || 0
      ),

    teamCount:
      Number(
        member.teamCount || 0
      ),

    leftCount:
      Number(
        member.leftCount || 0
      ),

    rightCount:
      Number(
        member.rightCount || 0
      ),

    leftBusiness:
      Number(
        member.leftBusiness || 0
      ),

    rightBusiness:
      Number(
        member.rightBusiness || 0
      ),

    totalReferral:
      Number(
        member.totalReferral || 0
      ),

    activeReferral:
      Number(
        member.activeReferral || 0
      ),

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

    activationDate:
      member.activationDate || null,

    joiningPackage:
      member.joiningPackage || "",

    createdAt:
      member.createdAt || null,

    updatedAt:
      member.updatedAt || null,

    children: [],
  };
};

// =====================================================
// HELPER: BUILD RELATIONSHIP MAP
// =====================================================

const buildRelationshipMaps = (members) => {
  const bySponsorId = new Map();
  const bySponsorCode = new Map();

  const addToMap = (
    map,
    key,
    member
  ) => {
    if (!key) {
      return;
    }

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key).push(member);
  };

  for (const member of members) {
    // -------------------------------------------------
    // PRIMARY RELATIONSHIP: sponsorId
    // -------------------------------------------------

    if (member.sponsorId) {
      addToMap(
        bySponsorId,
        String(member.sponsorId),
        member
      );
    }

    // -------------------------------------------------
    // COMPATIBILITY RELATIONSHIPS
    // -------------------------------------------------

    const sponsorCode =
      normalize(
        member.sponsorCode
      );

    const sponsorMemberId =
      normalize(
        member.sponsorMemberId
      );

    if (sponsorCode) {
      addToMap(
        bySponsorCode,
        sponsorCode,
        member
      );
    }

    if (
      sponsorMemberId &&
      sponsorMemberId !== sponsorCode
    ) {
      addToMap(
        bySponsorCode,
        sponsorMemberId,
        member
      );
    }
  }

  return {
    bySponsorId,
    bySponsorCode,
  };
};

// =====================================================
// HELPER: FIND CHILDREN OF A MEMBER
// =====================================================

const getChildrenForMember = (
  member,
  relationshipMaps
) => {
  const {
    bySponsorId,
    bySponsorCode,
  } = relationshipMaps;

  const children = [];
  const seen = new Set();

  const addChildren = (list = []) => {
    for (const child of list) {
      const id = String(child._id);

      if (seen.has(id)) {
        continue;
      }

      seen.add(id);
      children.push(child);
    }
  };

  // -------------------------------------------------
  // PRIMARY: sponsorId
  // -------------------------------------------------

  addChildren(
    bySponsorId.get(
      String(member._id)
    ) || []
  );

  // -------------------------------------------------
  // FALLBACK: userCode / memberId
  // -------------------------------------------------

  const userCode =
    normalize(
      member.userCode
    );

  const memberId =
    normalize(
      member.memberId
    );

  if (userCode) {
    addChildren(
      bySponsorCode.get(
        userCode
      ) || []
    );
  }

  if (
    memberId &&
    memberId !== userCode
  ) {
    addChildren(
      bySponsorCode.get(
        memberId
      ) || []
    );
  }

  // Remove self if malformed data ever points back
  return children.filter(
    (child) =>
      String(child._id) !==
      String(member._id)
  );
};

// =====================================================
// HELPER: SORT CHILDREN
// =====================================================

const sortChildren = (children) => {
  return [...children].sort(
    (a, b) => {
      const dateA = new Date(
        a.createdAt || 0
      ).getTime();

      const dateB = new Date(
        b.createdAt || 0
      ).getTime();

      return dateA - dateB;
    }
  );
};

// =====================================================
// HELPER: BUILD COMPLETE TREE
// =====================================================

const buildTreeNode = (
  member,
  relationshipMaps,
  visited = new Set()
) => {
  const memberId = String(
    member._id
  );

  // -------------------------------------------------
  // Prevent malformed circular relationships
  // -------------------------------------------------

  if (visited.has(memberId)) {
    const safeMember =
      formatMember(member);

    return safeMember;
  }

  const nextVisited =
    new Set(visited);

  nextVisited.add(memberId);

  const safeMember =
    formatMember(member);

  const children =
    sortChildren(
      getChildrenForMember(
        member,
        relationshipMaps
      )
    );

  safeMember.children =
    children.map((child) =>
      buildTreeNode(
        child,
        relationshipMaps,
        nextVisited
      )
    );

  return safeMember;
};

// =====================================================
// HELPER: FLATTEN TREE COUNT
// =====================================================

const countDescendants = (node) => {
  if (
    !node ||
    !Array.isArray(node.children)
  ) {
    return 0;
  }

  let count = node.children.length;

  for (const child of node.children) {
    count += countDescendants(child);
  }

  return count;
};

// =====================================================
// HELPER: FIND MAX LEVEL
// =====================================================

const findMaxLevel = (node) => {
  if (
    !node ||
    !Array.isArray(node.children) ||
    node.children.length === 0
  ) {
    return Number(node?.level || 1);
  }

  return Math.max(
    Number(node.level || 1),
    ...node.children.map(
      findMaxLevel
    )
  );
};

// =====================================================
// GET /api/referral/tree
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
          message: "User not found.",
        });
      }

      // -------------------------------------------------
      // CHECK ACCOUNT STATUS
      // -------------------------------------------------

      if (
        user.status &&
        String(user.status).toLowerCase() !==
          "active"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account is inactive.",
        });
      }

      // -------------------------------------------------
      // LOAD CUSTOMER NETWORK DATA
      // -------------------------------------------------
      //
      // Only safe customer fields are selected.
      // Password, PAN, bank details and private
      // financial information are NOT loaded.
      // -------------------------------------------------

      const members =
        await User.find({
          role: "user",
        })
          .select(
            CUSTOMER_PUBLIC_FIELDS
          )
          .sort({
            createdAt: 1,
          })
          .lean();

      // -------------------------------------------------
      // BUILD RELATIONSHIP MAPS
      // -------------------------------------------------

      const relationshipMaps =
        buildRelationshipMaps(
          members
        );

      // -------------------------------------------------
      // BUILD COMPLETE RECURSIVE TREE
      // -------------------------------------------------

      const tree =
        buildTreeNode(
          user,
          relationshipMaps
        );

      // -------------------------------------------------
      // DIRECT CHILDREN
      // -------------------------------------------------

      const directChildren =
        Array.isArray(tree.children)
          ? tree.children
          : [];

      // -------------------------------------------------
      // LEFT / RIGHT DIRECT CHILDREN
      // -------------------------------------------------

      const leftTeam =
        directChildren.filter(
          (child) =>
            child.position !== "right"
        );

      const rightTeam =
        directChildren.filter(
          (child) =>
            child.position === "right"
        );

      // -------------------------------------------------
      // NETWORK STATISTICS
      // -------------------------------------------------

      const totalDownline =
        countDescendants(tree);

      const maxLevel =
        findMaxLevel(tree);

      // Count direct active members from
      // actual tree data.
      const activeDirects =
        directChildren.filter(
          (child) =>
            String(
              child.status || ""
            ).toLowerCase() ===
            "active"
        ).length;

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.status(200).json({
        success: true,

        tree,

        leftTeam,

        rightTeam,

        stats: {
          directCount:
            directChildren.length,

          activeDirectCount:
            activeDirects,

          totalDownline,

          maxLevel,

          leftDirectCount:
            leftTeam.length,

          rightDirectCount:
            rightTeam.length,
        },
      });
    } catch (error) {
      console.error(
        "❌ Referral tree error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch referral tree.",
      });
    }
  }
);

// =====================================================
// GET /api/referral/directs
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
          message: "User not found.",
        });
      }

      // -------------------------------------------------
      // CHECK ACCOUNT STATUS
      // -------------------------------------------------

      if (
        user.status &&
        String(user.status).toLowerCase() !==
          "active"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account is inactive.",
        });
      }

      // -------------------------------------------------
      // LOAD CUSTOMER NETWORK
      // -------------------------------------------------

      const members =
        await User.find({
          role: "user",
        })
          .select(
            CUSTOMER_PUBLIC_FIELDS
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      // -------------------------------------------------
      // RELATIONSHIP MAP
      // -------------------------------------------------

      const relationshipMaps =
        buildRelationshipMaps(
          members
        );

      // -------------------------------------------------
      // CURRENT USER'S DIRECTS
      // -------------------------------------------------

      const directMembers =
        sortChildren(
          getChildrenForMember(
            user,
            relationshipMaps
          )
        ).reverse();

      // -------------------------------------------------
      // SAFE RESPONSE
      // -------------------------------------------------

      const directs =
        directMembers.map(
          (member) => {
            const formatted =
              formatMember(member);

            return {
              ...formatted,

              // Direct page does not need
              // recursive tree children.
              children: [],
            };
          }
        );

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.status(200).json({
        success: true,

        directs,

        stats: {
          directCount:
            directs.length,

          activeDirectCount:
            directs.filter(
              (member) =>
                String(
                  member.status || ""
                ).toLowerCase() ===
                "active"
            ).length,
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
          "Failed to fetch direct referrals.",
      });
    }
  }
);

export default router;