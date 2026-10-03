import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
import { Transaction } from "../models/Transaction.js";

// =========================================================
// BINARY INCOME CONFIGURATION
// =========================================================

export const BINARY_PAIR_INCOME = 450;

// =========================================================
// PROCESS COMPLETED BINARY PAIR INCOME
// =========================================================
//
// Rule:
//
//              Parent
//             /      \
//          LEFT      RIGHT
//
// Both direct binary positions exist
//              ↓
//       Binary Pair Complete
//              ↓
//             ₹450
//
// IMPORTANT:
// - This function does NOT place users.
// - It only checks whether the parent has both
//   direct binary children.
// - It credits ₹450 only once for the same pair.
// - MongoDB transaction session is required.
//
// Duplicate protection:
// BINARY_PAIR:<parentId>:<leftId>:<rightId>
//
// =========================================================

export const processCompletedBinaryPairIncome =
  async ({
    parentId,
    session,
  }) => {
    // =====================================================
    // VALIDATION
    // =====================================================

    if (!parentId) {
      return {
        eligible: false,
        paid: false,
        reason: "Parent ID is required.",
      };
    }

    if (!session) {
      throw new Error(
        "MongoDB session is required for binary income processing."
      );
    }

    // =====================================================
    // LOAD FRESH PARENT
    // =====================================================

    const parent =
      await User.findById(
        parentId
      ).session(session);

    if (!parent) {
      return {
        eligible: false,
        paid: false,
        reason: "Binary parent not found.",
      };
    }

    // =====================================================
    // ONLY CUSTOMER CAN RECEIVE BINARY INCOME
    // =====================================================

    if (
      parent.role !== "user"
    ) {
      return {
        eligible: false,
        paid: false,
        reason:
          "Binary parent must be a customer/user.",
      };
    }

    // =====================================================
    // GET DIRECT BINARY CHILDREN
    // =====================================================

    const leftId =
      parent.binaryLeftId
        ? String(
            parent.binaryLeftId
          )
        : null;

    const rightId =
      parent.binaryRightId
        ? String(
            parent.binaryRightId
          )
        : null;

    // =====================================================
    // BINARY PAIR CHECK
    // =====================================================
    //
    // Both direct children are required.
    //
    // LEFT only  -> no payout
    // RIGHT only -> no payout
    // BOTH       -> eligible
    //
    // =====================================================

    if (
      !leftId ||
      !rightId
    ) {
      return {
        eligible: false,
        paid: false,

        reason:
          "Binary pair is not complete.",

        hasLeft:
          Boolean(leftId),

        hasRight:
          Boolean(rightId),
      };
    }

    // =====================================================
    // UNIQUE PAIR REFERENCE
    // =====================================================
    //
    // Same:
    // Parent + Left + Right
    //
    // = Same binary pair
    //
    // Therefore:
    //
    // BINARY_PAIR:PARENT:LEFT:RIGHT
    //
    // =====================================================

    const referenceKey =
      `BINARY_PAIR:${String(
        parent._id
      )}:${leftId}:${rightId}`;

    // =====================================================
    // CHECK WHETHER THIS PAIR WAS ALREADY PAID
    // =====================================================

    const existingTransaction =
      await Transaction.findOne({
        referenceKey,
      })
        .session(session)
        .select(
          "_id amount type status referenceKey"
        )
        .lean();

    if (existingTransaction) {
      return {
        eligible: true,
        paid: false,
        duplicate: true,

        reason:
          "Binary income for this pair is already processed.",

        amount:
          Number(
            existingTransaction.amount ||
              0
          ),

        referenceKey,

        transactionId:
          existingTransaction._id,
      };
    }

    // =====================================================
    // UPDATE / CREATE WALLET
    // =====================================================

    const wallet =
      await Wallet.findOneAndUpdate(
        {
          userId: parent._id,
        },

        {
          // -------------------------------------------------
          // CREATE WALLET WHEN MISSING
          // -------------------------------------------------

          $setOnInsert: {
            userId:
              parent._id,

            memberId:
              parent.memberId,
          },

          // -------------------------------------------------
          // ADD BINARY INCOME
          // -------------------------------------------------

          $inc: {
            currentBalance:
              BINARY_PAIR_INCOME,

            totalEarnings:
              BINARY_PAIR_INCOME,

            referralCommissions:
              BINARY_PAIR_INCOME,
          },
        },

        {
          new: true,

          upsert: true,

          session,

          setDefaultsOnInsert:
            true,
        }
      );

    if (!wallet) {
      throw new Error(
        "Failed to create/update customer wallet."
      );
    }

    // =====================================================
    // UPDATE USER INCOME
    // =====================================================

    await User.updateOne(
      {
        _id: parent._id,
      },

      {
        $inc: {
          matchingIncome:
            BINARY_PAIR_INCOME,

          totalIncome:
            BINARY_PAIR_INCOME,
        },
      },

      {
        session,
      }
    );

    // =====================================================
    // CREATE TRANSACTION RECORD
    // =====================================================

    const transaction =
      await Transaction.create(
        [
          {
            // ---------------------------------------------
            // USER
            // ---------------------------------------------

            userId:
              parent._id,

            memberId:
              parent.memberId,

            // ---------------------------------------------
            // TYPE
            // ---------------------------------------------

            type:
              "binary_income",

            // ---------------------------------------------
            // CATEGORY
            // ---------------------------------------------

            category:
              "referral",

            // ---------------------------------------------
            // AMOUNTS
            // ---------------------------------------------

            amount:
              BINARY_PAIR_INCOME,

            grossAmount:
              BINARY_PAIR_INCOME,

            tdsPercentage:
              0,

            tdsAmount:
              0,

            adminFeePercentage:
              0,

            adminFeeAmount:
              0,

            netAmount:
              BINARY_PAIR_INCOME,

            // ---------------------------------------------
            // BALANCE
            // ---------------------------------------------

            balanceAfter:
              Number(
                wallet.currentBalance
              ),

            // ---------------------------------------------
            // STATUS
            // ---------------------------------------------

            status:
              "completed",

            // ---------------------------------------------
            // PAYOUT
            // ---------------------------------------------

            payoutMethod:
              "WALLET_CREDIT",

            payoutDetails:
              "",

            // ---------------------------------------------
            // PAN
            // ---------------------------------------------

            panNumber:
              parent.panNumber || "",

            utrNumber:
              "",

            // ---------------------------------------------
            // DESCRIPTION
            // ---------------------------------------------

            description:
              `Binary pair completed: LEFT ${leftId} + RIGHT ${rightId}`,

            reason:
              "Both direct binary legs completed.",

            // ---------------------------------------------
            // SYSTEM GENERATED
            // ---------------------------------------------

            createdBy:
              null,

            // ---------------------------------------------
            // DUPLICATE PROTECTION
            // ---------------------------------------------

            referenceKey,
          },
        ],
        {
          session,
        }
      );

    // =====================================================
    // SUCCESS RESPONSE
    // =====================================================

    return {
      eligible: true,

      paid: true,

      duplicate: false,

      amount:
        BINARY_PAIR_INCOME,

      parentId:
        String(parent._id),

      memberId:
        parent.memberId,

      leftId,

      rightId,

      referenceKey,

      transactionId:
        transaction[0]?._id ||
        null,

      balanceAfter:
        Number(
          wallet.currentBalance
        ),
    };
  };