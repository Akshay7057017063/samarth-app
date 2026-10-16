import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";

import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";

import {
  placeUserUnderParent,
  syncBinaryTeamCounts,
  getBinaryAncestors,
} from "./binaryTree.js";

/* =====================================================
   RESPONSE HELPER
===================================================== */

const fail = (status, message) => ({
  status,
  body: {
    success: false,
    message,
  },
});


/* =====================================================
   BINARY PLACEMENT HELPER
   LEFT  -> Left -> Left -> Left ...
   RIGHT -> Right -> Right -> Right ...
   Never switch to the opposite side.
===================================================== */

const placeInSelectedBinarySide = async ({
  sponsorId,
  userId,
  position,
}) => {
  if (!["left", "right"].includes(position)) {
    throw new Error("Invalid binary position.");
  }

  const field =
    position === "left"
      ? "binaryLeftId"
      : "binaryRightId";

  let currentParentId = sponsorId;
  const visited = new Set();

  while (currentParentId) {
    const parentKey = String(currentParentId);

    // Prevent infinite loops if the existing tree has a cycle.
    if (visited.has(parentKey)) {
      throw new Error(
        "Cycle detected in the selected binary branch."
      );
    }

    visited.add(parentKey);

    const parent = await User.findById(currentParentId)
      .select("_id binaryLeftId binaryRightId")
      .lean();

    if (!parent) {
      throw new Error(
        "Binary placement parent was not found."
      );
    }

    let childId = parent[field];

    // If the selected-side slot is occupied, continue
    // down that SAME side only.
    if (childId) {
      const child = await User.findById(childId)
        .select("_id binaryLeftId binaryRightId")
        .lean();

      if (child) {
        currentParentId = child._id;
        continue;
      }

      // Repair a dangling reference only if it is unchanged.
      const repaired = await User.updateOne(
        {
          _id: parent._id,
          [field]: childId,
        },
        {
          $set: {
            [field]: null,
          },
        }
      );

      if (repaired.modifiedCount !== 1) {
        // Another request may have changed the slot.
        // Re-check this parent instead of switching sides.
        visited.delete(parentKey);
        continue;
      }

      childId = null;
    }

    // The selected-side slot is empty: try to place here.
    if (!childId) {
      try {
        await placeUserUnderParent({
          userId,
          parentId: parent._id,
          position,
        });

        return {
          parentId: parent._id,
          position,
        };
      } catch (placementError) {
        // If a concurrent registration filled the slot,
        // follow that new child down the same-side chain.
        const refreshedParent = await User.findById(
          parent._id
        )
          .select("_id binaryLeftId binaryRightId")
          .lean();

        if (!refreshedParent) {
          throw placementError;
        }

        const refreshedChildId =
          refreshedParent[field];

        if (!refreshedChildId) {
          // The slot remains empty; preserve the real error.
          throw placementError;
        }

        const refreshedChild = await User.findById(
          refreshedChildId
        )
          .select("_id")
          .lean();

        if (!refreshedChild) {
          // The reference may have changed again.
          visited.delete(parentKey);
          continue;
        }

        currentParentId = refreshedChild._id;
      }
    }
  }

  throw new Error(
    `No available position found on the selected ${position} chain.`
  );
};


/* =====================================================
   CLEANUP HELPER
===================================================== */

const cleanupCreatedMember = async ({
  userId,
  parentId,
  position,
  sponsorId,
  sponsorCountsUpdated = false,
}) => {
  if (!userId) return;

  try {
    await Wallet.deleteOne({ userId });

    if (parentId && ["left", "right"].includes(position)) {
      const field =
        position === "left"
          ? "binaryLeftId"
          : "binaryRightId";

      await User.updateOne(
        {
          _id: parentId,
          [field]: userId,
        },
        {
          $set: {
            [field]: null,
          },
        }
      );
    }

    if (sponsorCountsUpdated && sponsorId) {
      await User.updateOne(
        { _id: sponsorId },
        {
          $inc: {
            directReferralsCount: -1,
            totalReferral: -1,
            teamCount: -1,
          },
        }
      );
    }

    await User.deleteOne({ _id: userId });
  } catch (cleanupError) {
    console.error(
      "Member registration cleanup error:",
      cleanupError
    );
  }
};

/* =====================================================
   SYNC BINARY COUNTS
===================================================== */

const syncRegistrationBinaryCounts = async (
  memberId,
  sponsorId
) => {
  const ids = new Set();

  if (sponsorId) {
    ids.add(String(sponsorId));
  }

  try {
    const ancestors = await getBinaryAncestors(memberId);

    for (const ancestor of ancestors) {
      if (ancestor?._id) {
        ids.add(String(ancestor._id));
      }
    }
  } catch (error) {
    console.error("Binary ancestor lookup warning:", error);
  }

  for (const id of ids) {
    try {
      await syncBinaryTeamCounts(id);
    } catch (error) {
      console.error(
        `Binary count sync warning for ${id}:`,
        error
      );
    }
  }
};

/* =====================================================
   REGISTER INACTIVE MEMBER
===================================================== */

export const registerInactiveMember = async (
  sponsor,
  input = {}
) => {
  let createdUserId = null;
  let placementParentId = null;
  let placementPosition = null;
  let sponsorCountsUpdated = false;

  const cleanPosition = String(input.position || "")
    .trim()
    .toLowerCase();

  try {
    /* -----------------------------------------------
       SPONSOR ID VALIDATION
    ------------------------------------------------ */

    if (!sponsor?._id) {
      return fail(400, "Valid sponsor account is required.");
    }

    /*
     * Load the latest sponsor record from the database.
     * Do not rely only on a possibly outdated object.
     */
    sponsor = await User.findById(sponsor._id)
      .select(
        "_id name role status userType memberId userCode treePath level"
      )
      .lean();

    if (!sponsor) {
      return fail(404, "Sponsor account not found.");
    }

    /* -----------------------------------------------
       SPONSOR ROLE VALIDATION
    ------------------------------------------------ */

    if (
      String(sponsor.role || "")
        .trim()
        .toLowerCase() !== "user"
    ) {
      return fail(403, "Invalid sponsor account.");
    }

    /* -----------------------------------------------
       SPONSOR STATUS VALIDATION
    ------------------------------------------------ */

    if (
      String(sponsor.status || "")
        .trim()
        .toLowerCase() !== "active"
    ) {
      return fail(
        403,
        "Sponsor account must be active to register a referral."
      );
    }

    /* -----------------------------------------------
       SPONSOR PAID VALIDATION
    ------------------------------------------------ */

    if (
      String(sponsor.userType || "")
        .trim()
        .toUpperCase() !== "PAID"
    ) {
      return fail(
        403,
        "Only a PAID sponsor can register a new referral. Please activate your account with a valid Paid PIN."
      );
    }

    /* -----------------------------------------------
       CLEAN INPUT
    ------------------------------------------------ */

    const cleanName = String(input.name || "").trim();

    const cleanEmail = String(input.email || "")
      .trim()
      .toLowerCase();

    const cleanPhone = String(input.phone || "").trim();

    const cleanPassword = String(input.password || "");

    const cleanConfirmPassword = String(
      input.confirmPassword || ""
    );

    /* -----------------------------------------------
       REQUIRED FIELDS
    ------------------------------------------------ */

    if (
      !cleanName ||
      !cleanEmail ||
      !cleanPhone ||
      !cleanPassword
    ) {
      return fail(
        400,
        "Name, email, phone and password are required."
      );
    }

    if (cleanName.length < 2) {
      return fail(
        400,
        "Name must contain at least 2 characters."
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return fail(
        400,
        "Please provide a valid email address."
      );
    }

    if (cleanPhone.length < 5) {
      return fail(
        400,
        "Please provide a valid phone number."
      );
    }

    if (cleanPassword.length < 6) {
      return fail(
        400,
        "Password must contain at least 6 characters."
      );
    }

    if (cleanPassword !== cleanConfirmPassword) {
      return fail(
        400,
        "Password and confirm password do not match."
      );
    }

    /* -----------------------------------------------
       POSITION VALIDATION
    ------------------------------------------------ */

    if (!["left", "right"].includes(cleanPosition)) {
      return fail(
        400,
        "Please select Left or Right position."
      );
    }

    if (
      input.termsAccepted !== true &&
      input.termsAccepted !== "true"
    ) {
      return fail(
        400,
        "You must accept the Terms & Conditions."
      );
    }

    /* -----------------------------------------------
       GENERATE UNIQUE MEMBER ID
    ------------------------------------------------ */

    let memberCode = "";

    for (let i = 0; i < 20 && !memberCode; i++) {
      const candidate = `SI${crypto.randomInt(100000, 1000000)}`;

      const exists = await User.findOne({
        $or: [
          { memberId: candidate },
          { userCode: candidate },
        ],
      })
        .select("_id")
        .lean();

      if (!exists) {
        memberCode = candidate;
      }
    }

    if (!memberCode) {
      return fail(
        500,
        "Unable to generate a unique member ID. Please try again."
      );
    }

    /* -----------------------------------------------
       HASH PASSWORD
    ------------------------------------------------ */

    const passwordHash = await bcrypt.hash(
      cleanPassword,
      10
    );

    /* -----------------------------------------------
       CREATE INACTIVE MEMBER
    ------------------------------------------------ */

    const newUser = new User({
      memberId: memberCode,
      userCode: memberCode,

      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: passwordHash,

      role: "user",
      status: "inactive",

      sponsorId: sponsor._id,

      sponsorCode:
        sponsor.userCode ||
        sponsor.memberId ||
        "",

      sponsorMemberId: sponsor.memberId || "",

      treePath: `${sponsor.treePath || "/"}${memberCode}/`,

      level: Number(sponsor.level || 1) + 1,

      // Side originally selected by the sponsor.
      position: cleanPosition,

      // Set by placeUserUnderParent.
      binaryParentId: null,
      binaryPosition: null,
      binaryLeftId: null,
      binaryRightId: null,
      binaryLevel: 1,
      binaryPath: "/",

      // New members remain unpaid until Paid PIN activation.
      userType: "UNPAID",
      activationDate: null,
      joiningPackage: "",
      rank: "Distributor",
      dateOfEntry: new Date(),

      bankDetails: {
        accountHolderName: cleanName,
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        upiId: "",
      },
    });

    await newUser.save();
    createdUserId = newUser._id;

    /* -----------------------------------------------
       PLACE MEMBER IN SELECTED SUBTREE
    ------------------------------------------------ */

    try {
      const placement = await placeInSelectedBinarySide({
        sponsorId: sponsor._id,
        userId: newUser._id,
        position: cleanPosition,
      });

      placementParentId = placement.parentId;
      placementPosition = placement.position;
    } catch (placementError) {
      console.error(
        "Member binary placement error:",
        placementError
      );

      await cleanupCreatedMember({
        userId: newUser._id,
        parentId: placementParentId,
        position: placementPosition,
        sponsorId: sponsor._id,
      });

      createdUserId = null;

      return fail(
        409,
        `Could not place the member in the selected ${cleanPosition} subtree. Please try again.`
      );
    }

    /* -----------------------------------------------
       VERIFY PLACEMENT
    ------------------------------------------------ */

    const placedUser = await User.findById(newUser._id);

    if (
      !placedUser?.binaryParentId ||
      !placedUser?.binaryPosition
    ) {
      await cleanupCreatedMember({
        userId: newUser._id,
        parentId: placementParentId,
        position: placementPosition,
        sponsorId: sponsor._id,
      });

      createdUserId = null;

      return fail(
        500,
        "Binary placement failed. Registration was cancelled."
      );
    }

    /* -----------------------------------------------
       CREATE ZERO-BALANCE WALLET
    ------------------------------------------------ */

    await Wallet.create({
      userId: placedUser._id,
      memberId: placedUser.memberId,

      currentBalance: 0,
      totalEarnings: 0,
      captchaEarnings: 0,
      referralCommissions: 0,
      totalWithdrawn: 0,

      todayCaptchasSolved: 0,
      lastCaptchaDate: null,
    });

    /* -----------------------------------------------
       UPDATE SPONSOR REGISTRATION COUNTS
    ------------------------------------------------ */

    await User.updateOne(
      { _id: sponsor._id },
      {
        $inc: {
          directReferralsCount: 1,
          totalReferral: 1,
          teamCount: 1,
        },
      }
    );

    sponsorCountsUpdated = true;

    /* -----------------------------------------------
       SYNC BINARY COUNTS
    ------------------------------------------------ */

    await syncRegistrationBinaryCounts(
      placedUser._id,
      sponsor._id
    );

    /* -----------------------------------------------
       NO DIRECT INCOME DURING REGISTRATION
    ------------------------------------------------ */

    /*
     * This member is currently inactive and UNPAID.
     * Do not call processDirectReferralIncome() here.
     *
     * The ₹100 direct referral income must be processed
     * only after this referred member is successfully
     * activated with a valid Paid PIN.
     */

    /* -----------------------------------------------
       SUCCESS
    ------------------------------------------------ */

    /* -----------------------------------------------
       ACCOUNT COUNT FOR THIS EMAIL / PHONE
    ------------------------------------------------ */

    const [emailAccountCount, phoneAccountCount] =
      await Promise.all([
        User.countDocuments({
          email: cleanEmail,
          role: "user",
        }),
        User.countDocuments({
          phone: cleanPhone,
          role: "user",
        }),
      ]);

    return {
      status: 201,

      body: {
        success: true,

        message:
          `Member registered successfully. The account is inactive until Paid PIN activation. No referral income has been credited yet. Accounts with this mobile number: ${phoneAccountCount}. Accounts with this email: ${emailAccountCount}.`,

        accountCounts: {
          phone: phoneAccountCount,
          email: emailAccountCount,
        },

        member: {
          _id: placedUser._id,
          memberId: placedUser.memberId,
          name: placedUser.name,
          email: placedUser.email,
          phone: placedUser.phone,
          status: placedUser.status,
          userType: placedUser.userType,

          // Actual position in the binary tree.
          binaryPosition: placedUser.binaryPosition,
          binaryParentId: placedUser.binaryParentId,

          // Side selected by the sponsor.
          selectedSide: cleanPosition,
        },

        sponsor: {
          memberId: sponsor.memberId,
          name: sponsor.name,
        },

        referralIncome: {
          amount: 100,
          credited: false,
          message:
            "Direct referral income is processed after successful Paid PIN activation.",
        },
      },
    };
  } catch (error) {
    console.error("Member registration error:", error);

    if (createdUserId) {
      await cleanupCreatedMember({
        userId: createdUserId,
        parentId: placementParentId,
        position: placementPosition,
        sponsorId: sponsor?._id,
        sponsorCountsUpdated,
      });
    }

    if (error?.code === 11000) {
      return fail(
        400,
        "A user with the same member ID already exists."
      );
    }

    if (error?.name === "ValidationError") {
      return fail(
        400,
        "Invalid member registration details."
      );
    }

    return fail(
      500,
      "Server error during member registration."
    );
  }
};

/* =====================================================
   DATABASE READY HELPER
===================================================== */

export const isDbReady = () => {
  return mongoose.connection.readyState === 1;
};