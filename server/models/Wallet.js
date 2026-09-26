import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  memberId: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },
  currentBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  captchaEarnings: {
    type: Number,
    default: 0
  },
  referralCommissions: {
    type: Number,
    default: 0
  },
  totalWithdrawn: {
    type: Number,
    default: 0
  },
  todayCaptchasSolved: {
    type: Number,
    default: 0
  },
  lastCaptchaDate: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  }
}, {
  timestamps: true
});

export const Wallet = mongoose.model('Wallet', walletSchema);
