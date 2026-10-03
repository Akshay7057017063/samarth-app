import mongoose from "mongoose";
import { User } from "../models/User.js";

import {
  processCompletedBinaryPairIncome,
} from "./binaryIncome.js";

/**
 * =========================================================
 * BINARY TREE UTILITY
 * =========================================================
 *
 * Binary Tree:
 *
 *                  ROOT
 *                 /    \
 *              LEFT    RIGHT
 *              /  \    /  \
 *             ... ...  ... ...
 *
 * Important:
 *
 * sponsorId       = Sponsor / Referral Tree
 * binaryParentId  = Binary Tree Parent
 * binaryPosition  = left / right
 * binaryLeftId    = Left Child
 * binaryRightId   = Right Child
 *
 * Sponsor/Referral Tree and Binary Tree are independent.
 * =========================================================
 */

/* =========================================================
   SAFE BINARY PUBLIC FIELDS
========================================================= */

/*
 * These fields are safe to return from binary APIs.
 *
 * DO NOT include:
 * - password
 * - PAN
 * - Aadhaar
 * - bankDetails
 * - KYC documents
 * - wallet financial data
 */

const BINARY_PUBLIC_FIELDS = [
  "_id",

  "memberId",
  "userCode",

  "name",
  "email",
  "phone",

  "status",

  "userType",
  "activationDate",
  "joiningPackage",
  "rank",

  "binaryParentId",
  "binaryPosition",
  "binaryLevel",
  "binaryPath",

  "binaryLeftId",
  "binaryRightId",

  "leftCount",
  "rightCount",

  "leftBusiness",
  "rightBusiness",

  "leftPv",
  "rightPv",

  "leftCarryForwardPv",
  "rightCarryForwardPv",

  "totalTeam",
  "activeTeam",
  "teamPercent",

  "directReferralsCount",
  "teamCount",

  "createdAt",
  "updatedAt",
].join(" ");

/* =========================================================
   SAFE MEMBER SUMMARY FIELDS
========================================================= */

const BINARY_MEMBER_SUMMARY_FIELDS = [
  "_id",

  "memberId",
  "userCode",

  "name",
  "email",
  "phone",

  "status",

  "userType",
  "rank",

  "binaryParentId",
  "binaryPosition",
  "binaryLevel",
  "binaryPath",

  "leftCount",
  "rightCount",
  "totalTeam",

  "createdAt",
  "updatedAt",
].join(" ");

/* =========================================================
   VALIDATE OBJECT ID
========================================================= */

export const isValidObjectId = (id) => {
  if (!id) {
    return false;
  }

  return mongoose.Types.ObjectId.isValid(
    String(id)
  );
};

/* =========================================================
   GET USER
========================================================= */

export const getUserById = async (
  userId
) => {
  if (
    !userId ||
    !isValidObjectId(userId)
  ) {
    throw new Error(
      "Invalid user ID"
    );
  }

  const user =
    await User.findById(
      userId
    );

  if (!user) {
    throw new Error(
      "User not found"
    );
  }

  return user;
};

/* =========================================================
   FIND BINARY ROOT
========================================================= */

/*
 * Root = customer whose binaryParentId is null.
 *
 * Normally there should be only one binary root.
 *
 * Earliest customer is selected when more than one root
 * exists because of legacy/manual data.
 */

export const findBinaryRoot =
  async () => {
    const root =
      await User.findOne({
        role: "user",
        binaryParentId: null,
      }).sort({
        createdAt: 1,
      });

    return root;
  };

/* =========================================================
   GET BINARY CHILDREN
========================================================= */

export const getBinaryChildren =
  async (
    userId
  ) => {
    const user =
      await getUserById(
        userId
      );

    let left = null;
    let right = null;

    if (
      user.binaryLeftId
    ) {
      left =
        await User.findById(
          user.binaryLeftId
        ).select(
          BINARY_MEMBER_SUMMARY_FIELDS
        );
    }

    if (
      user.binaryRightId
    ) {
      right =
        await User.findById(
          user.binaryRightId
        ).select(
          BINARY_MEMBER_SUMMARY_FIELDS
        );
    }

    return {
      left,
      right,
    };
  };

/* =========================================================
   CHECK POSITION AVAILABILITY
========================================================= */

export const isBinaryPositionAvailable =
  async (
    parentId,
    position
  ) => {
    if (
      !["left", "right"].includes(
        position
      )
    ) {
      throw new Error(
        "Position must be left or right"
      );
    }

    const parent =
      await getUserById(
        parentId
      );

    if (
      parent.role !== "user"
    ) {
      throw new Error(
        "Binary parent must be a customer/user account"
      );
    }

    if (
      position === "left"
    ) {
      return !parent.binaryLeftId;
    }

    return !parent.binaryRightId;
  };

/* =========================================================
   GET AVAILABLE POSITION
========================================================= */

export const getAvailablePosition =
  async (
    parentId
  ) => {
    const parent =
      await getUserById(
        parentId
      );

    if (
      parent.role !== "user"
    ) {
      throw new Error(
        "Binary parent must be a customer/user account"
      );
    }

    if (
      !parent.binaryLeftId
    ) {
      return "left";
    }

    if (
      !parent.binaryRightId
    ) {
      return "right";
    }

    return null;
  };

/* =========================================================
   FIND FIRST AVAILABLE SLOT - BFS
========================================================= */

/*
 * Breadth First Search.
 *
 * Example:
 *
 *             A
 *            / \
 *           B   C
 *          / \
 *         D   E
 *
 * Search:
 *
 * A
 * B
 * C
 * D
 * E
 *
 * LEFT is always checked before RIGHT.
 *
 * This function searches the subtree starting from rootId.
 */

export const findFirstAvailableSlot =
  async (
    rootId
  ) => {
    if (
      !rootId ||
      !isValidObjectId(
        rootId
      )
    ) {
      throw new Error(
        "Invalid root ID"
      );
    }

    const queue = [
      String(rootId),
    ];

    let queueIndex = 0;

    const visited =
      new Set();

    while (
      queueIndex <
      queue.length
    ) {
      const currentId =
        queue[
          queueIndex++
        ];

      if (
        !currentId ||
        visited.has(
          currentId
        )
      ) {
        continue;
      }

      visited.add(
        currentId
      );

      const currentUser =
        await User.findById(
          currentId
        );

      if (!currentUser) {
        continue;
      }

      // Only customers can participate
      // in binary tree.
      if (
        currentUser.role !==
        "user"
      ) {
        continue;
      }

      // ====================================================
      // LEFT FIRST
      // ====================================================

      if (
        !currentUser.binaryLeftId
      ) {
        return {
          parent:
            currentUser,
          position:
            "left",
        };
      }

      // ====================================================
      // RIGHT SECOND
      // ====================================================

      if (
        !currentUser.binaryRightId
      ) {
        return {
          parent:
            currentUser,
          position:
            "right",
        };
      }

      // ====================================================
      // BOTH OCCUPIED
      // Continue BFS.
      // ====================================================

      const leftId =
        currentUser.binaryLeftId
          ? String(
              currentUser.binaryLeftId
            )
          : null;

      const rightId =
        currentUser.binaryRightId
          ? String(
              currentUser.binaryRightId
            )
          : null;

      if (
        leftId &&
        !visited.has(
          leftId
        )
      ) {
        queue.push(
          leftId
        );
      }

      if (
        rightId &&
        !visited.has(
          rightId
        )
      ) {
        queue.push(
          rightId
        );
      }
    }

    return null;
  };

/* =========================================================
   CALCULATE BINARY PATH
========================================================= */

/*
 * ROOT
 *  |
 *  L
 *  |
 *  R
 *  |
 *  L
 *
 * Path:
 *
 * /L/R/L
 */

export const buildBinaryPath =
  (
    parentPath,
    position
  ) => {
    if (
      !["left", "right"].includes(
        position
      )
    ) {
      throw new Error(
        "Position must be left or right"
      );
    }

    const basePath =
      typeof parentPath ===
        "string" &&
      parentPath.trim()
        ? parentPath.trim()
        : "/";

    let cleanPath =
      basePath;

    if (
      cleanPath !== "/" &&
      cleanPath.endsWith(
        "/"
      )
    ) {
      cleanPath =
        cleanPath.slice(
          0,
          -1
        );
    }

    if (
      cleanPath === "/"
    ) {
      cleanPath = "";
    }

    const direction =
      position === "left"
        ? "L"
        : "R";

    if (!cleanPath) {
      return `/${direction}`;
    }

    return `${cleanPath}/${direction}`;
  };

/* =========================================================
   CALCULATE BINARY LEVEL
========================================================= */

export const calculateBinaryLevel =
  (
    parent
  ) => {
    if (!parent) {
      return 1;
    }

    const parentLevel =
      Number(
        parent.binaryLevel
      );

    if (
      !Number.isFinite(
        parentLevel
      ) ||
      parentLevel < 1
    ) {
      return 2;
    }

    return parentLevel + 1;
  };

/* =========================================================
   UPDATE PARENT CHILD REFERENCE
========================================================= */

/*
 * session is optional so this helper remains compatible
 * with existing code.
 */

export const attachChildToParent =
  async (
    parent,
    child,
    position,
    session = null
  ) => {
    if (!parent) {
      throw new Error(
        "Binary parent is required"
      );
    }

    if (!child) {
      throw new Error(
        "Binary child is required"
      );
    }

    if (
      !["left", "right"].includes(
        position
      )
    ) {
      throw new Error(
        "Position must be left or right"
      );
    }

    if (
      parent.role !== "user"
    ) {
      throw new Error(
        "Only customer/user accounts can be binary parents"
      );
    }

    if (
      child.role &&
      child.role !== "user"
    ) {
      throw new Error(
        "Only customer/user accounts can be binary children"
      );
    }

    if (
      String(parent._id) ===
      String(child._id)
    ) {
      throw new Error(
        "User cannot be its own binary child"
      );
    }

    // ====================================================
    // PREVENT OVERWRITE
    // ====================================================

    if (
      position === "left" &&
      parent.binaryLeftId
    ) {
      throw new Error(
        "Left position is already occupied"
      );
    }

    if (
      position === "right" &&
      parent.binaryRightId
    ) {
      throw new Error(
        "Right position is already occupied"
      );
    }

    // ====================================================
    // ATTACH CHILD
    // ====================================================

    if (
      position === "left"
    ) {
      parent.binaryLeftId =
        child._id;
    } else {
      parent.binaryRightId =
        child._id;
    }

    if (session) {
      await parent.save({
        session,
      });
    } else {
      await parent.save();
    }

    return parent;
  };

/* =========================================================
   UPDATE USER BINARY INFORMATION
========================================================= */

/*
 * IMPORTANT:
 *
 * Binary placement + binary pair income are processed
 * inside ONE MongoDB transaction.
 *
 * Therefore:
 *
 * Placement successful
 *       +
 * ₹450 income successful
 *       ↓
 * COMMIT
 *
 * Any failure
 *       ↓
 * ROLLBACK
 */

export const setBinaryPlacement =
  async ({
    user,
    parent,
    position,
  }) => {
    if (!user) {
      throw new Error(
        "User is required"
      );
    }

    if (!parent) {
      throw new Error(
        "Binary parent is required"
      );
    }

    if (
      !["left", "right"].includes(
        position
      )
    ) {
      throw new Error(
        "Position must be left or right"
      );
    }

    if (
      user.role !== "user"
    ) {
      throw new Error(
        "Only customer/user accounts can be placed in binary tree"
      );
    }

    if (
      parent.role !== "user"
    ) {
      throw new Error(
        "Binary parent must be a customer/user account"
      );
    }

    if (
      String(user._id) ===
      String(parent._id)
    ) {
      throw new Error(
        "User cannot be placed under itself"
      );
    }

    // =====================================================
    // START MONGODB SESSION
    // =====================================================

    const session =
      await mongoose.startSession();

    try {
      // ===================================================
      // START TRANSACTION
      // ===================================================

      session.startTransaction();

      // ===================================================
      // RELOAD USER INSIDE TRANSACTION
      // ===================================================
      //
      // This prevents stale data issues.
      // ===================================================

      const freshUser =
        await User.findById(
          user._id
        ).session(
          session
        );

      if (!freshUser) {
        throw new Error(
          "User not found"
        );
      }

      if (
        freshUser.role !==
        "user"
      ) {
        throw new Error(
          "Only customer/user accounts can be placed in binary tree"
        );
      }

      // ===================================================
      // PREVENT DOUBLE PLACEMENT
      // ===================================================

      if (
        freshUser.binaryParentId
      ) {
        throw new Error(
          "User is already placed in the binary tree"
        );
      }

      // ===================================================
      // RELOAD PARENT INSIDE TRANSACTION
      // ===================================================

      const freshParent =
        await User.findById(
          parent._id
        ).session(
          session
        );

      if (!freshParent) {
        throw new Error(
          "Binary parent not found"
        );
      }

      if (
        freshParent.role !==
        "user"
      ) {
        throw new Error(
          "Binary parent must be a customer/user account"
        );
      }

      // ===================================================
      // PREVENT SELF PLACEMENT
      // ===================================================

      if (
        String(
          freshUser._id
        ) ===
        String(
          freshParent._id
        )
      ) {
        throw new Error(
          "User cannot be placed under itself"
        );
      }

      // ===================================================
      // CHECK LIVE SLOT
      // ===================================================
      //
      // Important because another request could have
      // occupied the slot after the original read.
      // ===================================================

      if (
        position === "left" &&
        freshParent.binaryLeftId
      ) {
        throw new Error(
          "LEFT position is already occupied"
        );
      }

      if (
        position === "right" &&
        freshParent.binaryRightId
      ) {
        throw new Error(
          "RIGHT position is already occupied"
        );
      }

      // ===================================================
      // CALCULATE USER BINARY INFORMATION
      // ===================================================

      freshUser.binaryParentId =
        freshParent._id;

      freshUser.binaryPosition =
        position;

      freshUser.binaryLevel =
        calculateBinaryLevel(
          freshParent
        );

      freshUser.binaryPath =
        buildBinaryPath(
          freshParent.binaryPath,
          position
        );

      // ===================================================
      // SAVE USER PLACEMENT
      // ===================================================

      await freshUser.save({
        session,
      });

      // ===================================================
      // ATTACH USER TO PARENT
      // ===================================================

      await attachChildToParent(
        freshParent,
        freshUser,
        position,
        session
      );

      // ===================================================
      // PROCESS BINARY PAIR INCOME
      // ===================================================
      //
      // Rule:
      //
      // Parent
      //    ├── LEFT
      //    └── RIGHT
      //
      // BOTH EXIST
      //     ↓
      //   ₹450
      //
      // Duplicate protection is handled by
      // Transaction.referenceKey.
      // ===================================================

      const binaryIncome =
        await processCompletedBinaryPairIncome(
          {
            parentId:
              freshParent._id,

            session,
          }
        );

      // ===================================================
      // LOG RESULT
      // ===================================================

      if (
        binaryIncome?.paid
      ) {
        console.log(
          "💰 BINARY INCOME CREDITED",
          {
            memberId:
              binaryIncome.memberId,

            amount:
              binaryIncome.amount,

            leftId:
              binaryIncome.leftId,

            rightId:
              binaryIncome.rightId,

            transactionId:
              binaryIncome.transactionId,

            referenceKey:
              binaryIncome.referenceKey,
          }
        );
      } else if (
        binaryIncome?.duplicate
      ) {
        console.log(
          "ℹ️ BINARY INCOME ALREADY PROCESSED",
          {
            memberId:
              binaryIncome.memberId,

            referenceKey:
              binaryIncome.referenceKey,
          }
        );
      } else {
        console.log(
          "ℹ️ BINARY PAIR NOT COMPLETE",
          {
            memberId:
              freshParent.memberId,

            reason:
              binaryIncome?.reason ||
              "Pair not complete.",
          }
        );
      }

      // ===================================================
      // COMMIT EVERYTHING
      // ===================================================

      await session.commitTransaction();

      // ===================================================
      // RETURN FRESHLY PLACED USER
      // ===================================================

      return freshUser;

    } catch (error) {
      // ===================================================
      // ROLLBACK TRANSACTION
      // ===================================================

      try {
        await session.abortTransaction();
      } catch (
        rollbackError
      ) {
        console.error(
          "❌ Binary transaction rollback error:",
          rollbackError?.message ||
            rollbackError
        );
      }

      throw error;

    } finally {
      // ===================================================
      // END SESSION
      // ===================================================

      await session.endSession();
    }
  };

/* =========================================================
   PLACE USER UNDER SPECIFIC PARENT
========================================================= */

export const placeUserUnderParent =
  async ({
    userId,
    parentId,
    position,
  }) => {
    if (!userId) {
      throw new Error(
        "User ID is required"
      );
    }

    if (!parentId) {
      throw new Error(
        "Parent ID is required"
      );
    }

    const user =
      await getUserById(
        userId
      );

    const parent =
      await getUserById(
        parentId
      );

    if (
      user.role !== "user"
    ) {
      throw new Error(
        "Only customer/user accounts can be placed in binary tree"
      );
    }

    if (
      parent.role !== "user"
    ) {
      throw new Error(
        "Binary parent must be a customer/user account"
      );
    }

    if (
      String(user._id) ===
      String(parent._id)
    ) {
      throw new Error(
        "User cannot be placed under itself"
      );
    }

    if (
      user.binaryParentId
    ) {
      throw new Error(
        "User is already placed in the binary tree"
      );
    }

    if (
      !["left", "right"].includes(
        position
      )
    ) {
      throw new Error(
        "Position must be left or right"
      );
    }

    return setBinaryPlacement({
      user,
      parent,
      position,
    });
  };

/* =========================================================
   AUTO PLACE USER
========================================================= */

/*
 * Supports BOTH:
 *
 * 1. autoPlaceUser(userId, parentId)
 *
 * 2. autoPlaceUser({
 *      userId,
 *      parentId
 *    })
 *
 * Behavior:
 *
 * parentId supplied:
 *     Search starts inside supplied parent's subtree.
 *
 * parentId not supplied:
 *     Search starts from global binary root.
 *
 * BFS:
 *     LEFT first
 *     RIGHT second
 *     Next level afterwards
 */

export const autoPlaceUser =
  async (
    userOrOptions,
    parentIdArg = null
  ) => {
    let userId;
    let parentId;

    // ====================================================
    // OBJECT STYLE
    //
    // autoPlaceUser({
    //   userId,
    //   parentId
    // })
    // ====================================================

    if (
      userOrOptions &&
      typeof userOrOptions ===
        "object" &&
      Object.prototype.hasOwnProperty.call(
        userOrOptions,
        "userId"
      )
    ) {
      userId =
        userOrOptions.userId;

      parentId =
        userOrOptions.parentId ||
        null;
    } else {
      // ==================================================
      // POSITIONAL STYLE
      //
      // autoPlaceUser(
      //   userId,
      //   parentId
      // )
      // ==================================================

      userId =
        userOrOptions;

      parentId =
        parentIdArg ||
        null;
    }

    // ====================================================
    // GET NEW USER
    // ====================================================

    const user =
      await getUserById(
        userId
      );

    if (
      user.role !== "user"
    ) {
      throw new Error(
        "Only customer/user accounts can be placed in binary tree"
      );
    }

    if (
      user.binaryParentId
    ) {
      throw new Error(
        "User is already placed in the binary tree"
      );
    }

    let searchRoot;

    // ====================================================
    // SEARCH FROM SPECIFIC PARENT
    // ====================================================

    if (parentId) {
      searchRoot =
        await getUserById(
          parentId
        );

      if (
        searchRoot.role !==
        "user"
      ) {
        throw new Error(
          "Binary placement parent must be a customer/user account"
        );
      }

      if (
        String(
          searchRoot._id
        ) ===
        String(
          user._id
        )
      ) {
        throw new Error(
          "User cannot be its own binary parent"
        );
      }
    } else {
      // ==================================================
      // SEARCH FROM GLOBAL ROOT
      // ==================================================

      searchRoot =
        await findBinaryRoot();
    }

    // ====================================================
    // NO ROOT EXISTS
    // ====================================================

    if (!searchRoot) {
      user.binaryParentId =
        null;

      user.binaryPosition =
        null;

      user.binaryLevel =
        1;

      user.binaryPath =
        "/";

      await user.save();

      return {
        user,

        isRoot: true,

        parent: null,

        position: null,
      };
    }

    // ====================================================
    // FIND FIRST AVAILABLE SLOT
    // ====================================================

    const slot =
      await findFirstAvailableSlot(
        searchRoot._id
      );

    if (!slot) {
      throw new Error(
        "No available binary placement slot found"
      );
    }

    // ====================================================
    // PLACE USER
    // ====================================================

    const placedUser =
      await setBinaryPlacement({
        user,

        parent:
          slot.parent,

        position:
          slot.position,
      });

    return {
      user:
        placedUser,

      isRoot: false,

      parent:
        slot.parent,

      position:
        slot.position,
    };
  };

/* =========================================================
   GET USER'S BINARY PARENT
========================================================= */

export const getBinaryParent =
  async (
    userId
  ) => {
    const user =
      await getUserById(
        userId
      );

    if (
      !user.binaryParentId
    ) {
      return null;
    }

    return User.findById(
      user.binaryParentId
    ).select(
      BINARY_MEMBER_SUMMARY_FIELDS
    );
  };

/* =========================================================
   GET BINARY TREE
========================================================= */

/*
 * maxDepth prevents unlimited recursive loading.
 *
 * Allowed depth:
 *     1 -> 10
 *
 * Frontend normally uses 5.
 */

export const getBinaryTree =
  async (
    rootId,
    maxDepth = 5
  ) => {
    if (
      !rootId ||
      !isValidObjectId(
        rootId
      )
    ) {
      throw new Error(
        "Invalid root ID"
      );
    }

    const parsedDepth =
      Number(
        maxDepth
      );

    const depth =
      Math.max(
        1,
        Math.min(
          Number.isFinite(
            parsedDepth
          )
            ? parsedDepth
            : 5,
          10
        )
      );

    const root =
      await User.findById(
        rootId
      ).select(
        BINARY_PUBLIC_FIELDS
      );

    if (!root) {
      throw new Error(
        "Binary root not found"
      );
    }

    if (
      root.role &&
      root.role !== "user"
    ) {
      throw new Error(
        "Only customer/user accounts can be binary tree roots"
      );
    }

    // ====================================================
    // RECURSIVE NODE BUILDER
    // ====================================================

    const buildNode =
      async (
        userId,
        currentDepth,
        visited =
          new Set()
      ) => {
        if (!userId) {
          return null;
        }

        const currentId =
          String(
            userId
          );

        // Prevent malformed cyclic references.
        if (
          visited.has(
            currentId
          )
        ) {
          return null;
        }

        const nextVisited =
          new Set(
            visited
          );

        nextVisited.add(
          currentId
        );

        const user =
          await User.findById(
            userId
          ).select(
            BINARY_PUBLIC_FIELDS
          );

        if (!user) {
          return null;
        }

        if (
          user.role &&
          user.role !== "user"
        ) {
          return null;
        }

        // ==================================================
        // NODE DATA
        // ==================================================

        const node = {
          _id:
            user._id,

          memberId:
            user.memberId ||
            user.userCode ||
            "—",

          userCode:
            user.userCode ||
            user.memberId ||
            "—",

          name:
            user.name ||
            "Unknown Member",

          email:
            user.email ||
            "",

          phone:
            user.phone ||
            "",

          status:
            user.status ||
            "active",

          userType:
            user.userType ||
            "UNPAID",

          rank:
            user.rank ||
            "Distributor",

          // ------------------------------------------------
          // BINARY RELATIONSHIP
          // ------------------------------------------------

          binaryParentId:
            user.binaryParentId ||
            null,

          binaryPosition:
            user.binaryPosition ||
            null,

          binaryLevel:
            Number(
              user.binaryLevel ||
                1
            ),

          binaryPath:
            user.binaryPath ||
            "/",

          // ------------------------------------------------
          // BINARY COUNTS
          // ------------------------------------------------

          leftCount:
            Number(
              user.leftCount ||
                0
            ),

          rightCount:
            Number(
              user.rightCount ||
                0
            ),

          totalTeam:
            Number(
              user.totalTeam ||
                0
            ),

          // ------------------------------------------------
          // BUSINESS
          // ------------------------------------------------

          leftBusiness:
            Number(
              user.leftBusiness ||
                0
            ),

          rightBusiness:
            Number(
              user.rightBusiness ||
                0
            ),

          // ------------------------------------------------
          // PV
          // ------------------------------------------------

          leftPv:
            Number(
              user.leftPv ||
                0
            ),

          rightPv:
            Number(
              user.rightPv ||
                0
            ),

          // ------------------------------------------------
          // CHILDREN
          // ------------------------------------------------

          children: {
            left: null,
            right: null,
          },
        };

        // ==================================================
        // STOP AT MAX DEPTH
        // ==================================================

        if (
          currentDepth >=
          depth
        ) {
          return node;
        }

        // ==================================================
        // LEFT CHILD
        // ==================================================

        if (
          user.binaryLeftId
        ) {
          node.children.left =
            await buildNode(
              user.binaryLeftId,
              currentDepth +
                1,
              nextVisited
            );
        }

        // ==================================================
        // RIGHT CHILD
        // ==================================================

        if (
          user.binaryRightId
        ) {
          node.children.right =
            await buildNode(
              user.binaryRightId,
              currentDepth +
                1,
              nextVisited
            );
        }

        return node;
      };

    return buildNode(
      root._id,
      1,
      new Set()
    );
  };

/* =========================================================
   GET BINARY TREE FOR CURRENT USER
========================================================= */

export const getMyBinaryTree =
  async (
    userId,
    maxDepth = 5
  ) => {
    return getBinaryTree(
      userId,
      maxDepth
    );
  };

/* =========================================================
   COUNT BINARY CHILDREN
========================================================= */

/*
 * Counts all descendants below the requested root.
 *
 * Example:
 *
 *              ROOT
 *             /    \
 *            A      B
 *           / \    / \
 *          C   D  E   F
 *
 * Result:
 *
 * leftCount  = 3
 * rightCount = 3
 * totalCount = 6
 *
 * Side is determined by the first branch under root.
 */

export const countBinaryTeam =
  async (
    userId
  ) => {
    const root =
      await getUserById(
        userId
      );

    let leftCount = 0;
    let rightCount = 0;

    const queue = [];

    const visited =
      new Set();

    // ====================================================
    // ROOT LEFT
    // ====================================================

    if (
      root.binaryLeftId
    ) {
      queue.push({
        id: String(
          root.binaryLeftId
        ),

        side: "left",
      });
    }

    // ====================================================
    // ROOT RIGHT
    // ====================================================

    if (
      root.binaryRightId
    ) {
      queue.push({
        id: String(
          root.binaryRightId
        ),

        side: "right",
      });
    }

    let queueIndex = 0;

    // ====================================================
    // BFS
    // ====================================================

    while (
      queueIndex <
      queue.length
    ) {
      const item =
        queue[
          queueIndex++
        ];

      if (
        !item?.id ||
        !isValidObjectId(
          item.id
        )
      ) {
        continue;
      }

      const key =
        `${item.id}:${item.side}`;

      if (
        visited.has(
          key
        )
      ) {
        continue;
      }

      visited.add(
        key
      );

      const user =
        await User.findById(
          item.id
        ).select(
          "_id role binaryLeftId binaryRightId"
        );

      if (
        !user ||
        user.role !== "user"
      ) {
        continue;
      }

      // ==================================================
      // COUNT CURRENT NODE
      // ==================================================

      if (
        item.side ===
        "left"
      ) {
        leftCount++;
      } else {
        rightCount++;
      }

      // ==================================================
      // ADD LEFT DESCENDANT
      //
      // Keep original root side.
      // ==================================================

      if (
        user.binaryLeftId
      ) {
        queue.push({
          id: String(
            user.binaryLeftId
          ),

          side:
            item.side,
        });
      }

      // ==================================================
      // ADD RIGHT DESCENDANT
      // ==================================================

      if (
        user.binaryRightId
      ) {
        queue.push({
          id: String(
            user.binaryRightId
          ),

          side:
            item.side,
        });
      }
    }

    return {
      leftCount,

      rightCount,

      totalCount:
        leftCount +
        rightCount,
    };
  };

/* =========================================================
   SYNC BINARY TEAM COUNTS
========================================================= */

/*
 * Recalculates actual binary descendants and stores:
 *
 * leftCount
 * rightCount
 * totalTeam
 */

export const syncBinaryTeamCounts =
  async (
    userId
  ) => {
    const user =
      await getUserById(
        userId
      );

    if (
      user.role !== "user"
    ) {
      throw new Error(
        "Only customer/user accounts can have binary team counts"
      );
    }

    const counts =
      await countBinaryTeam(
        user._id
      );

    user.leftCount =
      counts.leftCount;

    user.rightCount =
      counts.rightCount;

    user.totalTeam =
      counts.totalCount;

    await user.save();

    return {
      user,

      counts,
    };
  };

/* =========================================================
   CHECK BINARY TREE STATUS
========================================================= */

export const getBinaryStatus =
  async (
    userId
  ) => {
    const user =
      await getUserById(
        userId
      );

    // ====================================================
    // LEFT CHILD
    // ====================================================

    const leftUser =
      user.binaryLeftId
        ? await User.findById(
            user.binaryLeftId
          ).select(
            BINARY_MEMBER_SUMMARY_FIELDS
          )
        : null;

    // ====================================================
    // RIGHT CHILD
    // ====================================================

    const rightUser =
      user.binaryRightId
        ? await User.findById(
            user.binaryRightId
          ).select(
            BINARY_MEMBER_SUMMARY_FIELDS
          )
        : null;

    // ====================================================
    // BINARY PARENT
    // ====================================================

    const parent =
      user.binaryParentId
        ? await User.findById(
            user.binaryParentId
          ).select(
            BINARY_MEMBER_SUMMARY_FIELDS
          )
        : null;

    // ====================================================
    // RETURN
    // ====================================================

    return {
      user: {
        _id:
          user._id,

        memberId:
          user.memberId ||
          user.userCode ||
          "—",

        userCode:
          user.userCode ||
          user.memberId ||
          "—",

        name:
          user.name ||
          "Unknown Member",

        binaryLevel:
          Number(
            user.binaryLevel ||
              1
          ),

        binaryPath:
          user.binaryPath ||
          "/",

        binaryPosition:
          user.binaryPosition ||
          null,
      },

      parent,

      left:
        leftUser,

      right:
        rightUser,

      availablePositions: {
        left:
          !user.binaryLeftId,

        right:
          !user.binaryRightId,
      },

      counts: {
        left:
          Number(
            user.leftCount ||
              0
          ),

        right:
          Number(
            user.rightCount ||
              0
          ),

        total:
          Number(
            user.totalTeam ||
              0
          ),
      },
    };
  };