import mongoose from "mongoose";

const loginCodeSchema = new mongoose.Schema(
{
userId: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true,
index: true,
},


email: {
  type: String,
  required: true,
  lowercase: true,
  trim: true,
  index: true,
},

codeHash: {
  type: String,
  required: true,
},

purpose: {
  type: String,
  enum: [
    "password_reset",
    "login_code",
  ],
  required: true,
  default: "password_reset",
  index: true,
},

expiresAt: {
  type: Date,
  required: true,
  index: true,
},

attempts: {
  type: Number,
  default: 0,
  min: 0,
},

used: {
  type: Boolean,
  default: false,
  index: true,
},

usedAt: {
  type: Date,
  default: null,
},


},
{
timestamps: true,
}
);

// Automatically remove expired codes from MongoDB.
loginCodeSchema.index(
{ expiresAt: 1 },
{ expireAfterSeconds: 0 }
);

// Helps find the latest active code for a user.
loginCodeSchema.index({
userId: 1,
purpose: 1,
used: 1,
createdAt: -1,
});

export const LoginCode = mongoose.model(
"LoginCode",
loginCodeSchema
);
