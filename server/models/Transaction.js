import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  memberId: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },
  type: {
    type: String,
    enum: ['captcha_reward', 'referral_bonus', 'withdrawal'],
    required: true
  },
  grossAmount: {
    type: Number,
    required: true
  },
  tdsPercentage: {
    type: Number,
    default: 0
  },
  tdsAmount: {
    type: Number,
    default: 0
  },
  adminFeePercentage: {
    type: Number,
    default: 0
  },
  adminFeeAmount: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'completed'
  },
  payoutMethod: {
    type: String,
    enum: ['UPI', 'BANK', 'WALLET_CREDIT'],
    default: 'WALLET_CREDIT'
  },
  payoutDetails: {
    type: String,
    default: ''
  },
  panNumber: {
    type: String,
    default: ''
  },
  utrNumber: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

export const Transaction = mongoose.model('Transaction', transactionSchema);
