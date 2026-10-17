import mongoose from "mongoose";

const bankDetailsSchema = new mongoose.Schema(
  {
    // Actual customer database ID
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Visible customer/member ID
    memberId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    panNumber: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    panVerified: {
      type: Boolean,
      default: false,
    },

    accountHolderName: {
      type: String,
      default: "",
      trim: true,
    },

    accountNumber: {
      type: String,
      default: "",
      trim: true,
    },

    ifscCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    bankName: {
      type: String,
      default: "",
      trim: true,
    },

    upiId: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
    collection: "bankdetails",
  }
);

// Har customer ka sirf ek current bank-details record
bankDetailsSchema.index(
  { userId: 1 },
  { unique: true }
);

export const BankDetails =
  mongoose.models.BankDetails ||
  mongoose.model("BankDetails", bankDetailsSchema);

export default BankDetails;