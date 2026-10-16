
import mongoose from "mongoose";
import { User } from "../models/User.js";

/* =========================================================
   BINARY TREE UTILITY

   sponsorId       = Referral/Sponsor Tree
   binaryParentId  = Binary Parent
   binaryPosition  = left / right
   binaryLeftId    = Left Child
   binaryRightId   = Right Child

   Binary placement and binary income are separate operations.

   Structural counts include inactive members.
   Active counts include only members whose status is active.
========================================================= */

/* =========================================================
   SAFE FIELD PROJECTIONS
========================================================= */

const BINARY_PUBLIC_FIELDS = [
  "_id",
  "role",
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
   OBJECT ID VALIDATION
========================================================= */

export const isValidObjectId = (id) => {
  if (!id) {
    return false;
  }

  return mongoose.Types.ObjectId.isValid(String(id));
};

/* =========================================================
   GET USER
========================================================= */

export const getUserById = async (
  userId,
  session = null
) => {
  if (!userId || !isValidObjectId(userId)) {
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

export const findBinaryRoot = async (session = null) => {
  let query = User.findOne({
    role: "user",
    binaryParentId: null,
  }).sort({ createdAt: 1 });

  if (session) {
    query = query.session(session);
  }

  return query;
};

/* =========================================================
   GET BINARY CHILDREN
========================================================= */

export const getBinaryChildren = async (
  userId,
  session = null
) => {
  const user = await getUserById(userId, session);

  let left = null;
  let right = null;

  if (user.binaryLeftId) {
    let query = User.findById(
      user.binaryLeftId
    ).select(BINARY_MEMBER_SUMMARY_FIELDS);

    if (session) {
      query = query.session(session);
    }

    left = await query;
  }

  if (user.binaryRightId) {
    let query = User.findById(
      user.binaryRightId
    ).select(BINARY_MEMBER_SUMMARY_FIELDS);

    if (session) {
      query = query.session(session);
    }

    right = await query;
  }

  return { left, right };
};

/* =========================================================
   CHECK POSITION AVAILABILITY
========================================================= */

export const isBinaryPositionAvailable = async (
  parentId,
  position,
  session = null
) => {
  if (!["left", "right"].includes(position)) {
    throw new Error("Position must be left or right");
  }

  const parent = await getUserById(parentId, session);

  if (parent.role !== "user") {
    throw new Error(
      "Binary parent must be a customer/user account"
    );
  }

  return position === "left"
    ? !parent.binaryLeftId
    : !parent.binaryRightId;
};

/* =========================================================
   GET AVAILABLE POSITION
========================================================= */

export const getAvailablePosition = async (
  parentId,
  session = null
) => {
  const parent = await getUserById(parentId, session);

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
   FIND FIRST AVAILABLE SLOT - BREADTH FIRST SEARCH

   Search order:
   1. Current node left
   2. Current node right
   3. Descendant nodes, level by level

   Repeated node references, cycles, and broken child
   references cause an error rather than silently returning
   incorrect placement information.
========================================================= */

export const findFirstAvailableSlot = async (
  rootId,
  session = null
) => {
  if (!rootId || !isValidObjectId(rootId)) {
    throw new Error("Invalid root ID");
  }

  const queue = [String(rootId)];
  const visited = new Set();
  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const currentId = queue[queueIndex++];

    if (visited.has(currentId)) {
      throw new Error(
        "Binary tree cycle or duplicate child link detected."
      );
    }

    visited.add(currentId);

    let query = User.findById(currentId);

    if (session) {
      query = query.session(session);
    }

    const currentUser = await query;

    if (!currentUser || currentUser.role !== "user") {
      throw new Error(
        "A binary tree node could not be found or is invalid."
      );
    }

    if (!currentUser.binaryLeftId) {
      return {
        parent: currentUser,
        position: "left",
      };
    }

    if (!currentUser.binaryRightId) {
      return {
        parent: currentUser,
        position: "right",
      };
    }

    queue.push(String(currentUser.binaryLeftId));
    queue.push(String(currentUser.binaryRightId));
  }

  return null;
};

/* =========================================================
   BUILD BINARY PATH
========================================================= */

export const buildBinaryPath = (
  parentPath,
  position
) => {
  if (!["left", "right"].includes(position)) {
    throw new Error("Position must be left or right");
  }

  const basePath =
    typeof parentPath === "string" && parentPath.trim()
      ? parentPath.trim()
      : "/";

  let cleanPath = basePath;

  if (cleanPath !== "/" && cleanPath.endsWith("/")) {
    cleanPath = cleanPath.slice(0, -1);
  }

  if (cleanPath === "/") {
    cleanPath = "";
  }

  const direction = position === "left" ? "L" : "R";

  return cleanPath
    ? `${cleanPath}/${direction}`
    : `/${direction}`;
};

/* =========================================================
   CALCULATE BINARY LEVEL
========================================================= */

export const calculateBinaryLevel = (parent) => {
  if (!parent) {
    return 1;
  }

  const parentLevel = Number(parent.binaryLevel);

  if (!Number.isFinite(parentLevel) || parentLevel < 1) {
    return 2;
  }

  return parentLevel + 1;
};

/* =========================================================
   ATTACH CHILD TO PARENT
========================================================= */

export const attachChildToParent = async (
  parent,
  child,
  position,
  session = null
) => {
  if (!parent) {
    throw new Error("Binary parent is required");
  }

  if (!child) {
    throw new Error("Binary child is required");
  }

  if (!["left", "right"].includes(position)) {
    throw new Error("Position must be left or right");
  }

  if (parent.role !== "user") {
    throw new Error(
      "Binary parent must be a customer/user account"
    );
  }

  if (child.role !== "user") {
    throw new Error(
      "Only customer/user accounts can be binary children"
    );
  }

  if (String(parent._id) === String(child._id)) {
    throw new Error("User cannot be its own binary child");
  }

  if (position === "left" && parent.binaryLeftId) {
    throw new Error("Left position is already occupied");
  }

  if (position === "right" && parent.binaryRightId) {
    throw new Error("Right position is already occupied");
  }

  if (position === "left") {
    parent.binaryLeftId = child._id;
  } else {
    parent.binaryRightId = child._id;
  }

  await parent.save(session ? { session } : {});

  return parent;
};

/* =========================================================
   VALIDATE THAT PLACEMENT WILL NOT CREATE A CYCLE

   A member must not be placed beneath one of its own
   descendants. This also detects existing corruption in
   the subtree that would otherwise make placement unsafe.
========================================================= */

const assertCanPlaceUnderParent = async (
  userId,
  parentId,
  session
) => {
  const targetId = String(userId);
  const requestedParentId = String(parentId);

  const queue = [targetId];
  const visited = new Set();
  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const currentId = queue[queueIndex++];

    if (visited.has(currentId)) {
      throw new Error(
        "Binary subtree cycle or duplicate child link detected."
      );
    }

    visited.add(currentId);

    if (currentId === requestedParentId) {
      throw new Error(
        "Cannot place a user under one of its own descendants."
      );
    }

    let query = User.findById(currentId);

    if (session) {
      query = query.session(session);
    }

    const current = await query;

    if (!current || current.role !== "user") {
      throw new Error(
        "A binary subtree node could not be found or is invalid."
      );
    }

    if (current.binaryLeftId) {
      queue.push(String(current.binaryLeftId));
    }

    if (current.binaryRightId) {
      queue.push(String(current.binaryRightId));
    }
  }
};

/* =========================================================
   SET BINARY PLACEMENT

   Placement does not create binary income.

   This operation creates the parent-child links and saves
   binary level/path details within a MongoDB transaction.
========================================================= */

export const setBinaryPlacement = async ({
  user,
  parent,
  position,
}) => {
  if (!user) {
    throw new Error("User is required");
  }

  if (!parent) {
    throw new Error("Binary parent is required");
  }

  if (!["left", "right"].includes(position)) {
    throw new Error("Position must be left or right");
  }

  if (user.role !== "user" || parent.role !== "user") {
    throw new Error(
      "Only customer/user accounts can be placed in the binary tree"
    );
  }

  if (String(user._id) === String(parent._id)) {
    throw new Error("User cannot be placed under itself");
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      /* Reload user within transaction. */

      const freshUser = await User.findById(
        user._id
      ).session(session);

      if (!freshUser || freshUser.role !== "user") {
        throw new Error("User not found or invalid");
      }

      if (freshUser.binaryParentId) {
        throw new Error(
          "User is already placed in the binary tree"
        );
      }

      /* Reload parent within transaction. */

      const freshParent = await User.findById(
        parent._id
      ).session(session);

      if (!freshParent || freshParent.role !== "user") {
        throw new Error("Binary parent not found or invalid");
      }

      if (String(freshUser._id) === String(freshParent._id)) {
        throw new Error("User cannot be placed under itself");
      }

      /* Check selected slot again inside the transaction. */

      if (
        position === "left" &&
        freshParent.binaryLeftId
      ) {
        throw new Error("LEFT position is already occupied");
      }

      if (
        position === "right" &&
        freshParent.binaryRightId
      ) {
        throw new Error("RIGHT position is already occupied");
      }

      /* Prevent the new link from creating a cycle. */

      await assertCanPlaceUnderParent(
        freshUser._id,
        freshParent._id,
        session
      );

      freshUser.binaryParentId = freshParent._id;
      freshUser.binaryPosition = position;
      freshUser.binaryLevel =
        calculateBinaryLevel(freshParent);

      freshUser.binaryPath = buildBinaryPath(
        freshParent.binaryPath,
        position
      );

      await freshUser.save({ session });

      await attachChildToParent(
        freshParent,
        freshUser,
        position,
        session
      );
    });

    const savedUser = await User.findById(user._id);

    if (!savedUser) {
      throw new Error(
        "Placed user could not be loaded after placement"
      );
    }

    return savedUser;
  } finally {
    await session.endSession();
  }
};

/* =========================================================
   PLACE USER UNDER SPECIFIC PARENT
========================================================= */

export const placeUserUnderParent = async ({
  userId,
  parentId,
  position,
}) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!parentId) {
    throw new Error("Parent ID is required");
  }

  if (!["left", "right"].includes(position)) {
    throw new Error("Position must be left or right");
  }

  const user = await getUserById(userId);
  const parent = await getUserById(parentId);

  if (user.role !== "user" || parent.role !== "user") {
    throw new Error(
      "Only customer/user accounts can be placed in the binary tree"
    );
  }

  if (String(user._id) === String(parent._id)) {
    throw new Error("User cannot be placed under itself");
  }

  if (user.binaryParentId) {
    throw new Error("User is already placed in the binary tree");
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

  if (
    userOrOptions &&
    typeof userOrOptions === "object" &&
    Object.prototype.hasOwnProperty.call(
      userOrOptions,
      "userId"
    )
  ) {
    userId = userOrOptions.userId;
    parentId = userOrOptions.parentId || null;
  } else {
    userId = userOrOptions;
    parentId = parentIdArg || null;
  }

  const user = await getUserById(userId);

  if (user.role !== "user") {
    throw new Error(
      "Only customer/user accounts can be placed in the binary tree"
    );
  }

  if (user.binaryParentId) {
    throw new Error("User is already placed in the binary tree");
  }

  let searchRoot;

  if (parentId) {
    searchRoot = await getUserById(parentId);

    if (searchRoot.role !== "user") {
      throw new Error(
        "Binary placement parent must be a customer/user account"
      );
    }
  } else {
    searchRoot = await findBinaryRoot();
  }

  /* If no root exists, this user becomes the binary root. */

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

  const slot = await findFirstAvailableSlot(searchRoot._id);

  if (!slot) {
    throw new Error("No available binary placement slot found");
  }

  const placedUser = await setBinaryPlacement({
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
   GET BINARY PARENT
========================================================= */

export const getBinaryParent = async (
  userId,
  session = null
) => {
  const user = await getUserById(userId, session);

  if (!user.binaryParentId) {
    return null;
  }

  let query = User.findById(
    user.binaryParentId
  ).select(BINARY_MEMBER_SUMMARY_FIELDS);

  if (session) {
    query = query.session(session);
  }

  return query;
};

/* =========================================================
   GET BINARY TREE

   Each node can appear only once in the returned tree.
   Repeated references/cycles are omitted from the response
   to prevent infinite recursion.
========================================================= */

/* =========================================================
   GET COMPLETE BINARY TREE

   Customer tree:
   - Returns the full subtree from the requested root.
   - No default depth restriction.
   - Includes active and inactive members.
   - Uses binaryLeftId and binaryRightId as the source
     of truth for actual placement.
   - Prevents duplicate nodes and infinite recursion.

   Compatibility:
   - Existing callers passing maxDepth still work.
   - Explicit finite maxDepth values remain supported.
   - Omit maxDepth to retrieve the complete tree.
========================================================= */

export const getBinaryTree = async (
  rootId,
  maxDepth = Infinity,
  session = null
) => {
  if (!rootId || !isValidObjectId(rootId)) {
    throw new Error("Invalid root ID");
  }

  // No depth limit when maxDepth is omitted.
  // Explicit finite limits remain supported for compatibility.
  let depth = Infinity;

  if (
    maxDepth !== null &&
    maxDepth !== undefined &&
    maxDepth !== Infinity
  ) {
    const parsedDepth = Number(maxDepth);

    if (
      Number.isFinite(parsedDepth) &&
      parsedDepth > 0
    ) {
      depth = parsedDepth;
    }
  }

  let rootQuery = User.findById(rootId).select(
    BINARY_PUBLIC_FIELDS
  );

  if (session) {
    rootQuery = rootQuery.session(session);
  }

  const root = await rootQuery;

  if (!root) {
    throw new Error("Binary root not found");
  }

  if (root.role !== "user") {
    throw new Error(
      "Only customer/user accounts can be binary tree roots"
    );
  }

  // Track IDs across the complete subtree so the same member
  // cannot be rendered repeatedly or cause infinite recursion.
  const visited = new Set();

  const buildNode = async (
    userId,
    currentDepth
  ) => {
    if (!userId) {
      return null;
    }

    const currentId = String(userId);

    if (visited.has(currentId)) {
      return null;
    }

    visited.add(currentId);

    let query = User.findById(userId).select(
      BINARY_PUBLIC_FIELDS
    );

    if (session) {
      query = query.session(session);
    }

    const user = await query;

    if (!user || user.role !== "user") {
      return null;
    }

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

      email: user.email || "",
      phone: user.phone || "",

      status:
        user.status ||
        "inactive",

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
        Number(user.binaryLevel || 1),

      binaryPath:
        user.binaryPath ||
        "/",

      leftCount:
        Number(user.leftCount || 0),

      rightCount:
        Number(user.rightCount || 0),

      totalTeam:
        Number(user.totalTeam || 0),

      activeTeam:
        Number(user.activeTeam || 0),

      leftBusiness:
        Number(user.leftBusiness || 0),

      rightBusiness:
        Number(user.rightBusiness || 0),

      leftPv:
        Number(user.leftPv || 0),

      rightPv:
        Number(user.rightPv || 0),

      children: {
        left: null,
        right: null,
      },
    };

    /*
     * Preserve explicit maxDepth support.
     *
     * When maxDepth is omitted, depth is Infinity and this
     * condition never stops traversal due to depth.
     */
    if (currentDepth >= depth) {
      return node;
    }

    // Build the full left subtree.
    if (user.binaryLeftId) {
      node.children.left = await buildNode(
        user.binaryLeftId,
        currentDepth + 1
      );
    }

    // Build the full right subtree.
    if (user.binaryRightId) {
      node.children.right = await buildNode(
        user.binaryRightId,
        currentDepth + 1
      );
    }

    return node;
  };

  return buildNode(root._id, 1);
};
/* =========================================================
   GET BINARY TREE FOR CURRENT USER
========================================================= */

/* =========================================================
   GET COMPLETE BINARY TREE FOR CURRENT USER

   Defaults to the complete downline. Existing callers can
   still supply an explicit depth or MongoDB session.
========================================================= */

export const getMyBinaryTree = async (
  userId,
  maxDepth = Infinity,
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

   Counts inactive and active members structurally.
   Each member must occur exactly once in the subtree.
   Corrupt links cause an error instead of incorrect counts.
========================================================= */

export const countBinaryTeam = async (
  userId,
  session = null
) => {
  const root = await getUserById(userId, session);

  if (root.role !== "user") {
    throw new Error(
      "Only customer/user accounts can have binary team counts"
    );
  }

  let leftCount = 0;
  let rightCount = 0;

  const queue = [];
  const visited = new Set();

  if (root.binaryLeftId) {
    queue.push({
      id: String(root.binaryLeftId),
      side: "left",
    });
  }

  if (root.binaryRightId) {
    queue.push({
      id: String(root.binaryRightId),
      side: "right",
    });
  }

  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const item = queue[queueIndex++];
    const nodeId = String(item.id);

    if (!isValidObjectId(nodeId)) {
      throw new Error(
        "Invalid binary child ID. Binary counts cannot be recalculated safely."
      );
    }

    if (visited.has(nodeId)) {
      throw new Error(
        "Binary tree cycle or duplicate child link detected. Binary counts cannot be recalculated safely."
      );
    }

    visited.add(nodeId);

    let query = User.findById(nodeId).select(
      "_id role binaryLeftId binaryRightId"
    );

    if (session) {
      query = query.session(session);
    }

    const user = await query;

    if (!user || user.role !== "user") {
      throw new Error(
        "A binary descendant could not be found or is invalid. Binary counts cannot be recalculated safely."
      );
    }

    if (item.side === "left") {
      leftCount += 1;
    } else {
      rightCount += 1;
    }

    if (user.binaryLeftId) {
      queue.push({
        id: String(user.binaryLeftId),
        side: item.side,
      });
    }

    if (user.binaryRightId) {
      queue.push({
        id: String(user.binaryRightId),
        side: item.side,
      });
    }
  }

  return {
    leftCount,
    rightCount,
    totalCount: leftCount + rightCount,
  };
};

/* =========================================================
   COUNT ACTIVE BINARY DESCENDANTS

   Only status === "active" members count.

   Inactive members are still traversed so that any active
   descendants beneath them remain on the correct side.
========================================================= */

export const countActiveBinaryTeam = async (
  userId,
  options = {}
) => {
  const session = options?.session || null;

  const root = await getUserById(userId, session);

  if (root.role !== "user") {
    throw new Error(
      "Only customer/user accounts can have active binary counts"
    );
  }

  let leftActiveCount = 0;
  let rightActiveCount = 0;

  const queue = [];
  const visited = new Set();

  if (root.binaryLeftId) {
    queue.push({
      id: String(root.binaryLeftId),
      side: "left",
    });
  }

  if (root.binaryRightId) {
    queue.push({
      id: String(root.binaryRightId),
      side: "right",
    });
  }

  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const item = queue[queueIndex++];
    const nodeId = String(item.id);

    if (!isValidObjectId(nodeId)) {
      throw new Error(
        "Invalid binary child ID. Active binary counts cannot be recalculated safely."
      );
    }

    if (visited.has(nodeId)) {
      throw new Error(
        "Binary tree cycle or duplicate child link detected. Active binary counts cannot be recalculated safely."
      );
    }

    visited.add(nodeId);

    let query = User.findById(nodeId).select(
      "_id role status binaryLeftId binaryRightId"
    );

    if (session) {
      query = query.session(session);
    }

    const user = await query;

    if (!user || user.role !== "user") {
      throw new Error(
        "A binary descendant could not be found or is invalid. Active binary counts cannot be recalculated safely."
      );
    }

    const isActive =
      String(user.status || "").toLowerCase() === "active";

    if (isActive) {
      if (item.side === "left") {
        leftActiveCount += 1;
      } else {
        rightActiveCount += 1;
      }
    }

    if (user.binaryLeftId) {
      queue.push({
        id: String(user.binaryLeftId),
        side: item.side,
      });
    }

    if (user.binaryRightId) {
      queue.push({
        id: String(user.binaryRightId),
        side: item.side,
      });
    }
  }

  const totalActiveCount =
    leftActiveCount + rightActiveCount;

  return {
    leftActiveCount,
    rightActiveCount,
    totalActiveCount,

    // Compatibility aliases
    leftCount: leftActiveCount,
    rightCount: rightActiveCount,
    totalCount: totalActiveCount,
  };
};

/* =========================================================
   SYNC BINARY TEAM COUNTS

   Structural counts:
     leftCount, rightCount, totalTeam

   Active count:
     activeTeam

   When a MongoDB transaction session is provided, queries
   are run sequentially rather than concurrently.
========================================================= */

export const syncBinaryTeamCounts = async (
  userId,
  session = null
) => {
  const user = await getUserById(userId, session);

  if (user.role !== "user") {
    throw new Error(
      "Only customer/user accounts can have binary team counts"
    );
  }

  let structuralCounts;
  let activeCounts;

  if (session) {
    structuralCounts = await countBinaryTeam(
      user._id,
      session
    );

    activeCounts = await countActiveBinaryTeam(
      user._id,
      { session }
    );
  } else {
    [
      structuralCounts,
      activeCounts,
    ] = await Promise.all([
      countBinaryTeam(user._id),
      countActiveBinaryTeam(user._id),
    ]);
  }

  user.leftCount = structuralCounts.leftCount;
  user.rightCount = structuralCounts.rightCount;
  user.totalTeam = structuralCounts.totalCount;

  user.activeTeam = activeCounts.totalActiveCount;

  if (session) {
    await user.save({ session });
  } else {
    await user.save();
  }

  return {
    user,
    counts: {
      leftCount: structuralCounts.leftCount,
      rightCount: structuralCounts.rightCount,
      totalCount: structuralCounts.totalCount,

      activeTeam: activeCounts.totalActiveCount,
      leftActiveCount: activeCounts.leftActiveCount,
      rightActiveCount: activeCounts.rightActiveCount,
      totalActiveCount: activeCounts.totalActiveCount,
    },
  };
};

/* =========================================================
   GET BINARY TREE STATUS
========================================================= */

export const getBinaryStatus = async (
  userId,
  session = null
) => {
  const user = await getUserById(userId, session);

  const loadSummary = async (id) => {
    if (!id) {
      return null;
    }

    let query = User.findById(id).select(
      BINARY_MEMBER_SUMMARY_FIELDS
    );

    if (session) {
      query = query.session(session);
    }

    return query;
  };

  const leftUser = await loadSummary(user.binaryLeftId);
  const rightUser = await loadSummary(user.binaryRightId);
  const parent = await loadSummary(user.binaryParentId);

  const activeCounts = await countActiveBinaryTeam(
    user._id,
    { session }
  );

  return {
    user: {
      _id: user._id,
      memberId: user.memberId || user.userCode || "—",
      userCode: user.userCode || user.memberId || "—",
      name: user.name || "Unknown Member",
      status: user.status || "inactive",
      binaryLevel: Number(user.binaryLevel || 1),
      binaryPath: user.binaryPath || "/",
      binaryPosition: user.binaryPosition || null,
    },

    parent,
    left: leftUser,
    right: rightUser,

    availablePositions: {
      left: !user.binaryLeftId,
      right: !user.binaryRightId,
    },

    counts: {
      // Structural counts
      left: Number(user.leftCount || 0),
      right: Number(user.rightCount || 0),
      total: Number(user.totalTeam || 0),

      // Active counts
      activeTeam: activeCounts.totalActiveCount,
      leftActive: activeCounts.leftActiveCount,
      rightActive: activeCounts.rightActiveCount,
      totalActive: activeCounts.totalActiveCount,
    },
  };
};

/* =========================================================
   GET BINARY ANCESTORS

   Returns the direct binary parent first, followed by
   grandparents and higher ancestors.

   A detected cycle throws an error instead of silently
   returning an incomplete ancestor list.
========================================================= */

export const getBinaryAncestors = async (
  userId,
  session = null
) => {
  if (!userId || !isValidObjectId(userId)) {
    throw new Error("Invalid user ID");
  }

  const ancestors = [];
  const visited = new Set();

  let current = await getUserById(userId, session);

  while (current?.binaryParentId) {
    const parentId = String(current.binaryParentId);

    if (visited.has(parentId)) {
      throw new Error(
        "Binary ancestor cycle detected. Ancestor traversal was cancelled."
      );
    }

    visited.add(parentId);

    let query = User.findById(parentId).select(
      BINARY_MEMBER_SUMMARY_FIELDS
    );

    if (session) {
      query = query.session(session);
    }

    const parent = await query;

    if (!parent || parent.role !== "user") {
      throw new Error(
        "Binary parent could not be found or is invalid."
      );
    }

    ancestors.push(parent);
    current = parent;
  }

  return ancestors;
};
