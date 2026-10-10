import mongoose from "mongoose";
import { User } from "../models/User.js";

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
 * sponsorId       = Sponsor / Referral Tree
 * binaryParentId  = Binary Tree Parent
 * binaryPosition  = left / right
 * binaryLeftId    = Left Child
 * binaryRightId   = Right Child
 *
 * Sponsor/Referral Tree and Binary Tree are independent.
 *
 * IMPORTANT BUSINESS RULE:
 *
 * Binary placement and binary income are separate operations.
 *
 * Placing a new member in the binary tree does NOT create
 * binary income.
 *
 * Binary income is evaluated when an account becomes ACTIVE
 * and the required ACTIVE downline conditions are met.
 * =========================================================
 */

/* =========================================================
   SAFE BINARY PUBLIC FIELDS
========================================================= */

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

  "activeTeam",

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

/**
 * session is optional.
 *
 * Existing callers can continue using:
 *
 *   getUserById(userId)
 *
 * Transaction-aware callers can use:
 *
 *   getUserById(userId, session)
 */
export const getUserById = async (
  userId,
  session = null
) => {
  if (
    !userId ||
    !isValidObjectId(userId)
  ) {
    throw new Error("Invalid user ID");
  }

  let query = User.findById(userId);

  if (session) {
    query = query.session(session);
  }

  const user = await query;

  if (!user) {
    throw new Error("User not found");
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

export const findBinaryRoot = async (
  session = null
) => {
  let query = User.findOne({
    role: "user",
    binaryParentId: null,
  }).sort({
    createdAt: 1,
  });

  if (session) {
    query = query.session(session);
  }

  const root = await query;

  return root;
};

/* =========================================================
   GET BINARY CHILDREN
========================================================= */

export const getBinaryChildren = async (
  userId,
  session = null
) => {
  const user = await getUserById(
    userId,
    session
  );

  let left = null;
  let right = null;

  if (user.binaryLeftId) {
    let leftQuery = User.findById(
      user.binaryLeftId
    ).select(
      BINARY_MEMBER_SUMMARY_FIELDS
    );

    if (session) {
      leftQuery = leftQuery.session(
        session
      );
    }

    left = await leftQuery;
  }

  if (user.binaryRightId) {
    let rightQuery = User.findById(
      user.binaryRightId
    ).select(
      BINARY_MEMBER_SUMMARY_FIELDS
    );

    if (session) {
      rightQuery = rightQuery.session(
        session
      );
    }

    right = await rightQuery;
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
    position,
    session = null
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

    const parent = await getUserById(
      parentId,
      session
    );

    if (parent.role !== "user") {
      throw new Error(
        "Binary parent must be a customer/user account"
      );
    }

    if (position === "left") {
      return !parent.binaryLeftId;
    }

    return !parent.binaryRightId;
  };

/* =========================================================
   GET AVAILABLE POSITION
========================================================= */

export const getAvailablePosition =
  async (
    parentId,
    session = null
  ) => {
    const parent = await getUserById(
      parentId,
      session
    );

    if (parent.role !== "user") {
      throw new Error(
        "Binary parent must be a customer/user account"
      );
    }

    if (!parent.binaryLeftId) {
      return "left";
    }

    if (!parent.binaryRightId) {
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
 * LEFT is always checked before RIGHT.
 *
 * This remains available for legacy/admin auto-placement.
 *
 * Customer dashboard registration does NOT use this as a
 * fallback placement method.
 */

export const findFirstAvailableSlot =
  async (
    rootId,
    session = null
  ) => {
    if (
      !rootId ||
      !isValidObjectId(rootId)
    ) {
      throw new Error(
        "Invalid root ID"
      );
    }

    const queue = [
      String(rootId),
    ];

    let queueIndex = 0;

    const visited = new Set();

    while (
      queueIndex < queue.length
    ) {
      const currentId =
        queue[queueIndex++];

      if (
        !currentId ||
        visited.has(currentId)
      ) {
        continue;
      }

      visited.add(currentId);

      let currentQuery =
        User.findById(currentId);

      if (session) {
        currentQuery =
          currentQuery.session(
            session
          );
      }

      const currentUser =
        await currentQuery;

      if (!currentUser) {
        continue;
      }

      if (currentUser.role !== "user") {
        continue;
      }

      /* -----------------------------------------------
         LEFT FIRST
      ------------------------------------------------ */

      if (!currentUser.binaryLeftId) {
        return {
          parent: currentUser,
          position: "left",
        };
      }

      /* -----------------------------------------------
         RIGHT SECOND
      ------------------------------------------------ */

      if (!currentUser.binaryRightId) {
        return {
          parent: currentUser,
          position: "right",
        };
      }

      /* -----------------------------------------------
         BOTH OCCUPIED
      ------------------------------------------------ */

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
        !visited.has(leftId)
      ) {
        queue.push(leftId);
      }

      if (
        rightId &&
        !visited.has(rightId)
      ) {
        queue.push(rightId);
      }
    }

    return null;
  };

/* =========================================================
   CALCULATE BINARY PATH
========================================================= */

export const buildBinaryPath = (
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
    typeof parentPath === "string" &&
    parentPath.trim()
      ? parentPath.trim()
      : "/";

  let cleanPath = basePath;

  if (
    cleanPath !== "/" &&
    cleanPath.endsWith("/")
  ) {
    cleanPath = cleanPath.slice(
      0,
      -1
    );
  }

  if (cleanPath === "/") {
    cleanPath = "";
  }

  const direction =
    position === "left" ? "L" : "R";

  if (!cleanPath) {
    return `/${direction}`;
  }

  return `${cleanPath}/${direction}`;
};

/* =========================================================
   CALCULATE BINARY LEVEL
========================================================= */

export const calculateBinaryLevel = (
  parent
) => {
  if (!parent) {
    return 1;
  }

  const parentLevel = Number(
    parent.binaryLevel
  );

  if (
    !Number.isFinite(parentLevel) ||
    parentLevel < 1
  ) {
    return 2;
  }

  return parentLevel + 1;
};

/* =========================================================
   UPDATE PARENT CHILD REFERENCE
========================================================= */

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

    if (parent.role !== "user") {
      throw new Error(
        "Binary parent must be a customer/user account"
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

    /* -----------------------------------------------
       PREVENT OVERWRITE
    ------------------------------------------------ */

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

    /* -----------------------------------------------
       ATTACH CHILD
    ------------------------------------------------ */

    if (position === "left") {
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
 * ONLY binary placement happens here.
 *
 * NO binary income is created here.
 *
 * Inactive members remain structurally visible.
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

    if (user.role !== "user") {
      throw new Error(
        "Only customer/user accounts can be placed in binary tree"
      );
    }

    if (parent.role !== "user") {
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

    const session =
      await mongoose.startSession();

    try {
      await session.withTransaction(
        async () => {
          /* =============================================
             RELOAD USER
          ============================================== */

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
            freshUser.role !== "user"
          ) {
            throw new Error(
              "Only customer/user accounts can be placed in binary tree"
            );
          }

          if (
            freshUser.binaryParentId
          ) {
            throw new Error(
              "User is already placed in the binary tree"
            );
          }

          /* =============================================
             RELOAD PARENT
          ============================================== */

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
            freshParent.role !== "user"
          ) {
            throw new Error(
              "Binary parent must be a customer/user account"
            );
          }

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

          /* =============================================
             CHECK LIVE SLOT
          ============================================== */

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

          /* =============================================
             CALCULATE BINARY INFORMATION
          ============================================== */

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

          /* =============================================
             SAVE USER
          ============================================== */

          await freshUser.save({
            session,
          });

          /* =============================================
             ATTACH CHILD
          ============================================== */

          await attachChildToParent(
            freshParent,
            freshUser,
            position,
            session
          );

          /*
           * NO binary income here.
           *
           * Activation + binary-income evaluation happen
           * separately.
           */
        }
      );

      const savedUser =
        await User.findById(
          user._id
        );

      if (!savedUser) {
        throw new Error(
          "Placed user could not be loaded after binary placement."
        );
      }

      return savedUser;
    } catch (error) {
      try {
        if (
          session.inTransaction()
        ) {
          await session.abortTransaction();
        }
      } catch (rollbackError) {
        console.error(
          "❌ Binary transaction rollback error:",
          rollbackError?.message ||
            rollbackError
        );
      }

      throw error;
    } finally {
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
      await getUserById(userId);

    const parent =
      await getUserById(parentId);

    if (user.role !== "user") {
      throw new Error(
        "Only customer/user accounts can be placed in binary tree"
      );
    }

    if (parent.role !== "user") {
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

    if (user.binaryParentId) {
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

export const autoPlaceUser = async (
  userOrOptions,
  parentIdArg = null
) => {
  let userId;
  let parentId;

  /* ====================================================
     OBJECT STYLE
  ==================================================== */

  if (
    userOrOptions &&
    typeof userOrOptions === "object" &&
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
    /* ==================================================
       POSITIONAL STYLE
    ================================================== */

    userId = userOrOptions;
    parentId =
      parentIdArg || null;
  }

  /* ====================================================
     GET NEW USER
  ==================================================== */

  const user =
    await getUserById(userId);

  if (user.role !== "user") {
    throw new Error(
      "Only customer/user accounts can be placed in binary tree"
    );
  }

  if (user.binaryParentId) {
    throw new Error(
      "User is already placed in the binary tree"
    );
  }

  let searchRoot;

  /* ====================================================
     SEARCH FROM SPECIFIC PARENT
  ==================================================== */

  if (parentId) {
    searchRoot =
      await getUserById(parentId);

    if (
      searchRoot.role !== "user"
    ) {
      throw new Error(
        "Binary placement parent must be a customer/user account"
      );
    }

    if (
      String(searchRoot._id) ===
      String(user._id)
    ) {
      throw new Error(
        "User cannot be its own binary parent"
      );
    }
  } else {
    /* ==================================================
       SEARCH FROM GLOBAL ROOT
    ================================================== */

    searchRoot =
      await findBinaryRoot();
  }

  /* ====================================================
     NO ROOT EXISTS
  ==================================================== */

  if (!searchRoot) {
    user.binaryParentId = null;
    user.binaryPosition = null;
    user.binaryLevel = 1;
    user.binaryPath = "/";

    await user.save();

    return {
      user,
      isRoot: true,
      parent: null,
      position: null,
    };
  }

  /* ====================================================
     FIND FIRST AVAILABLE SLOT
  ==================================================== */

  const slot =
    await findFirstAvailableSlot(
      searchRoot._id
    );

  if (!slot) {
    throw new Error(
      "No available binary placement slot found"
    );
  }

  /* ====================================================
     PLACE USER
  ==================================================== */

  const placedUser =
    await setBinaryPlacement({
      user,
      parent: slot.parent,
      position: slot.position,
    });

  return {
    user: placedUser,
    isRoot: false,
    parent: slot.parent,
    position: slot.position,
  };
};

/* =========================================================
   GET USER'S BINARY PARENT
========================================================= */

export const getBinaryParent =
  async (
    userId,
    session = null
  ) => {
    const user =
      await getUserById(
        userId,
        session
      );

    if (!user.binaryParentId) {
      return null;
    }

    let query =
      User.findById(
        user.binaryParentId
      ).select(
        BINARY_MEMBER_SUMMARY_FIELDS
      );

    if (session) {
      query =
        query.session(
          session
        );
    }

    return query;
  };

/* =========================================================
   GET BINARY TREE
========================================================= */

export const getBinaryTree =
  async (
    rootId,
    maxDepth = 5,
    session = null
  ) => {
    if (
      !rootId ||
      !isValidObjectId(rootId)
    ) {
      throw new Error(
        "Invalid root ID"
      );
    }

    const parsedDepth =
      Number(maxDepth);

    const depth = Math.max(
      1,
      Math.min(
        Number.isFinite(parsedDepth)
          ? parsedDepth
          : 5,
        10
      )
    );

    let rootQuery =
      User.findById(rootId).select(
        BINARY_PUBLIC_FIELDS
      );

    if (session) {
      rootQuery =
        rootQuery.session(
          session
        );
    }

    const root = await rootQuery;

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

    /* ====================================================
       RECURSIVE NODE BUILDER
    ==================================================== */

    const buildNode =
      async (
        userId,
        currentDepth,
        visited = new Set()
      ) => {
        if (!userId) {
          return null;
        }

        const currentId =
          String(userId);

        if (
          visited.has(currentId)
        ) {
          return null;
        }

        const nextVisited =
          new Set(visited);

        nextVisited.add(
          currentId
        );

        let userQuery =
          User.findById(
            userId
          ).select(
            BINARY_PUBLIC_FIELDS
          );

        if (session) {
          userQuery =
            userQuery.session(
              session
            );
        }

        const user =
          await userQuery;

        if (!user) {
          return null;
        }

        if (
          user.role &&
          user.role !== "user"
        ) {
          return null;
        }

        /* ==================================================
           NODE DATA
        ================================================== */

        const node = {
          _id: user._id,

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

          binaryParentId:
            user.binaryParentId ||
            null,

          binaryPosition:
            user.binaryPosition ||
            null,

          binaryLevel:
            Number(
              user.binaryLevel || 1
            ),

          binaryPath:
            user.binaryPath ||
            "/",

          leftCount:
            Number(
              user.leftCount || 0
            ),

          rightCount:
            Number(
              user.rightCount || 0
            ),

          totalTeam:
            Number(
              user.totalTeam || 0
            ),

          activeTeam:
            Number(
              user.activeTeam || 0
            ),

          leftBusiness:
            Number(
              user.leftBusiness || 0
            ),

          rightBusiness:
            Number(
              user.rightBusiness || 0
            ),

          leftPv:
            Number(
              user.leftPv || 0
            ),

          rightPv:
            Number(
              user.rightPv || 0
            ),

          children: {
            left: null,
            right: null,
          },
        };

        /* ==================================================
           STOP AT MAX DEPTH
        ================================================== */

        if (
          currentDepth >= depth
        ) {
          return node;
        }

        /* ==================================================
           LEFT CHILD
        ================================================== */

        if (
          user.binaryLeftId
        ) {
          node.children.left =
            await buildNode(
              user.binaryLeftId,
              currentDepth + 1,
              nextVisited
            );
        }

        /* ==================================================
           RIGHT CHILD
        ================================================== */

        if (
          user.binaryRightId
        ) {
          node.children.right =
            await buildNode(
              user.binaryRightId,
              currentDepth + 1,
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
    maxDepth = 5,
    session = null
  ) => {
    return getBinaryTree(
      userId,
      maxDepth,
      session
    );
  };

/* =========================================================
   COUNT ALL BINARY DESCENDANTS
========================================================= */

/*
 * STRUCTURAL COUNT.
 *
 * Includes inactive members.
 *
 * This is for tree structure/display only.
 *
 * DO NOT use this for binary income qualification.
 */

export const countBinaryTeam =
  async (
    userId,
    session = null
  ) => {
    const root =
      await getUserById(
        userId,
        session
      );

    let leftCount = 0;
    let rightCount = 0;

    const queue = [];
    const visited = new Set();

    /* ====================================================
       ROOT LEFT
    ==================================================== */

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

    /* ====================================================
       ROOT RIGHT
    ==================================================== */

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

    /* ====================================================
       BFS
    ==================================================== */

    while (
      queueIndex < queue.length
    ) {
      const item =
        queue[queueIndex++];

      if (
        !item?.id ||
        !isValidObjectId(item.id)
      ) {
        continue;
      }

      const key =
        `${item.id}:${item.side}`;

      if (
        visited.has(key)
      ) {
        continue;
      }

      visited.add(key);

      let userQuery =
        User.findById(
          item.id
        ).select(
          "_id role binaryLeftId binaryRightId"
        );

      if (session) {
        userQuery =
          userQuery.session(
            session
          );
      }

      const user =
        await userQuery;

      if (
        !user ||
        user.role !== "user"
      ) {
        continue;
      }

      /* ==================================================
         COUNT CURRENT NODE
      ================================================== */

      if (
        item.side === "left"
      ) {
        leftCount++;
      } else {
        rightCount++;
      }

      /* ==================================================
         LEFT DESCENDANT
      ================================================== */

      if (
        user.binaryLeftId
      ) {
        queue.push({
          id: String(
            user.binaryLeftId
          ),
          side: item.side,
        });
      }

      /* ==================================================
         RIGHT DESCENDANT
      ================================================== */

      if (
        user.binaryRightId
      ) {
        queue.push({
          id: String(
            user.binaryRightId
          ),
          side: item.side,
        });
      }
    }

    return {
      leftCount,
      rightCount,
      totalCount:
        leftCount + rightCount,
    };
  };

/* =========================================================
   COUNT ACTIVE BINARY DESCENDANTS
========================================================= */

/*
 * IMPORTANT BUSINESS RULE:
 *
 * ONLY ACTIVE members count for binary income.
 *
 * Inactive members:
 *   - remain visible in tree
 *   - remain part of structural count
 *   - DO NOT count toward active qualification
 *
 * However, we still traverse through inactive members,
 * because an active descendant below an inactive member
 * still belongs to the same LEFT / RIGHT side of the root.
 *
 * Example:
 *
 *                  ROOT
 *                 /    \
 *            ACTIVE   INACTIVE
 *              |
 *           INACTIVE
 *              |
 *           ACTIVE
 *
 * Root's left active count = 2
 * Root's right active count = 0
 */

export const countActiveBinaryTeam =
  async (
    userId,
    options = {}
  ) => {
    const session =
      options?.session || null;

    const root =
      await getUserById(
        userId,
        session
      );

    let leftActiveCount = 0;
    let rightActiveCount = 0;

    const queue = [];
    const visited = new Set();

    /* ====================================================
       ROOT LEFT
    ==================================================== */

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

    /* ====================================================
       ROOT RIGHT
    ==================================================== */

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

    /* ====================================================
       BFS
    ==================================================== */

    while (
      queueIndex < queue.length
    ) {
      const item =
        queue[queueIndex++];

      if (
        !item?.id ||
        !isValidObjectId(item.id)
      ) {
        continue;
      }

      const key =
        `${item.id}:${item.side}`;

      if (
        visited.has(key)
      ) {
        continue;
      }

      visited.add(key);

      let userQuery =
        User.findById(
          item.id
        ).select(
          "_id role status binaryLeftId binaryRightId"
        );

      if (session) {
        userQuery =
          userQuery.session(
            session
          );
      }

      const user =
        await userQuery;

      if (
        !user ||
        user.role !== "user"
      ) {
        continue;
      }

      /* ==================================================
         ONLY ACTIVE MEMBERS COUNT
      ================================================== */

      const isActive =
        String(
          user.status || ""
        ).toLowerCase() ===
        "active";

      if (isActive) {
        if (
          item.side === "left"
        ) {
          leftActiveCount++;
        } else {
          rightActiveCount++;
        }
      }

      /* ==================================================
         CONTINUE THROUGH INACTIVE USERS
      ================================================== */

      if (
        user.binaryLeftId
      ) {
        queue.push({
          id: String(
            user.binaryLeftId
          ),
          side: item.side,
        });
      }

      if (
        user.binaryRightId
      ) {
        queue.push({
          id: String(
            user.binaryRightId
          ),
          side: item.side,
        });
      }
    }

    return {
      leftActiveCount,

      rightActiveCount,

      totalActiveCount:
        leftActiveCount +
        rightActiveCount,

      /* ---------------------------------------------
         Compatibility aliases
      --------------------------------------------- */

      leftCount:
        leftActiveCount,

      rightCount:
        rightActiveCount,

      totalCount:
        leftActiveCount +
        rightActiveCount,
    };
  };

/* =========================================================
   SYNC BINARY TEAM COUNTS
========================================================= */

/*
 * Structural:
 *   leftCount
 *   rightCount
 *   totalTeam
 *
 * Active:
 *   activeTeam
 *
 * Structural counts include inactive members.
 * activeTeam includes only ACTIVE descendants.
 */

export const syncBinaryTeamCounts =
  async (
    userId,
    session = null
  ) => {
    const user =
      await getUserById(
        userId,
        session
      );

    if (user.role !== "user") {
      throw new Error(
        "Only customer/user accounts can have binary team counts"
      );
    }

    const [
      structuralCounts,
      activeCounts,
    ] = await Promise.all([
      countBinaryTeam(
        user._id,
        session
      ),

      countActiveBinaryTeam(
        user._id,
        { session }
      ),
    ]);

    /* ====================================================
       STRUCTURAL COUNTS
    ==================================================== */

    user.leftCount =
      structuralCounts.leftCount;

    user.rightCount =
      structuralCounts.rightCount;

    user.totalTeam =
      structuralCounts.totalCount;

    /* ====================================================
       ACTIVE COUNTS
    ==================================================== */

    user.activeTeam =
      activeCounts.totalActiveCount;

    if (session) {
      await user.save({
        session,
      });
    } else {
      await user.save();
    }

    return {
      user,

      counts: {
        leftCount:
          structuralCounts.leftCount,

        rightCount:
          structuralCounts.rightCount,

        totalCount:
          structuralCounts.totalCount,

        activeTeam:
          activeCounts.totalActiveCount,

        leftActiveCount:
          activeCounts.leftActiveCount,

        rightActiveCount:
          activeCounts.rightActiveCount,

        totalActiveCount:
          activeCounts.totalActiveCount,
      },
    };
  };

/* =========================================================
   GET BINARY TREE STATUS
========================================================= */

export const getBinaryStatus =
  async (
    userId,
    session = null
  ) => {
    const user =
      await getUserById(
        userId,
        session
      );

    /* ====================================================
       LEFT CHILD
    ==================================================== */

    const leftUser =
      user.binaryLeftId
        ? await (async () => {
            let query =
              User.findById(
                user.binaryLeftId
              ).select(
                BINARY_MEMBER_SUMMARY_FIELDS
              );

            if (session) {
              query =
                query.session(
                  session
                );
            }

            return query;
          })()
        : null;

    /* ====================================================
       RIGHT CHILD
    ==================================================== */

    const rightUser =
      user.binaryRightId
        ? await (async () => {
            let query =
              User.findById(
                user.binaryRightId
              ).select(
                BINARY_MEMBER_SUMMARY_FIELDS
              );

            if (session) {
              query =
                query.session(
                  session
                );
            }

            return query;
          })()
        : null;

    /* ====================================================
       BINARY PARENT
    ==================================================== */

    const parent =
      user.binaryParentId
        ? await (async () => {
            let query =
              User.findById(
                user.binaryParentId
              ).select(
                BINARY_MEMBER_SUMMARY_FIELDS
              );

            if (session) {
              query =
                query.session(
                  session
                );
            }

            return query;
          })()
        : null;

    /* ====================================================
       ACTIVE COUNTS
    ==================================================== */

    const activeCounts =
      await countActiveBinaryTeam(
        user._id,
        { session }
      );

    /* ====================================================
       RETURN
    ==================================================== */

    return {
      user: {
        _id: user._id,

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

        status:
          user.status ||
          "inactive",

        binaryLevel:
          Number(
            user.binaryLevel || 1
          ),

        binaryPath:
          user.binaryPath ||
          "/",

        binaryPosition:
          user.binaryPosition ||
          null,
      },

      parent,

      left: leftUser,

      right: rightUser,

      availablePositions: {
        left:
          !user.binaryLeftId,

        right:
          !user.binaryRightId,
      },

      counts: {
        /* ---------------------------------------------
           STRUCTURAL
        --------------------------------------------- */

        left:
          Number(
            user.leftCount || 0
          ),

        right:
          Number(
            user.rightCount || 0
          ),

        total:
          Number(
            user.totalTeam || 0
          ),

        /* ---------------------------------------------
           ACTIVE
        --------------------------------------------- */

        activeTeam:
          activeCounts.totalActiveCount,

        leftActive:
          activeCounts.leftActiveCount,

        rightActive:
          activeCounts.rightActiveCount,

        totalActive:
          activeCounts.totalActiveCount,
      },
    };
  };

/* =========================================================
   GET BINARY ANCESTORS
========================================================= */

/*
 * Returns ancestors starting from direct binary parent:
 *
 *   member
 *      ↑
 *   parent
 *      ↑
 *   grandparent
 *      ↑
 *   ...
 *
 * This is useful for activation-time binary calculations.
 *
 * Inactive ancestors are returned too, because traversal
 * must continue upward. The caller decides whether an
 * ancestor should receive income.
 */

export const getBinaryAncestors =
  async (
    userId,
    session = null
  ) => {
    if (
      !userId ||
      !isValidObjectId(userId)
    ) {
      throw new Error(
        "Invalid user ID"
      );
    }

    const ancestors = [];
    const visited = new Set();

    let current =
      await getUserById(
        userId,
        session
      );

    while (
      current?.binaryParentId
    ) {
      const parentId =
        String(
          current.binaryParentId
        );

      if (
        visited.has(parentId)
      ) {
        console.warn(
          `⚠️ Binary ancestor loop detected for user ${userId}`
        );

        break;
      }

      visited.add(parentId);

      let parentQuery =
        User.findById(
          current.binaryParentId
        ).select(
          BINARY_MEMBER_SUMMARY_FIELDS +
            " status binaryParentId"
        );

      if (session) {
        parentQuery =
          parentQuery.session(
            session
          );
      }

      const parent =
        await parentQuery;

      if (!parent) {
        break;
      }

      ancestors.push(parent);

      current = parent;
    }

    return ancestors;
  };