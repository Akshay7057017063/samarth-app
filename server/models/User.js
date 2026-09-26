import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Referral Network / MLM fields
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  sponsorMemberId: {
    type: String,
    default: null,
    uppercase: true
  },
  treePath: {
    type: String,
    default: '/',
    index: true
  },
  level: {
    type: Number,
    default: 1
  },
  directReferralsCount: {
    type: Number,
    default: 0
  },
  teamCount: {
    type: Number,
    default: 0
  },
  // KYC & Tax Info (for TDS deduction)
  panNumber: {
    type: String,
    default: '',
    uppercase: true,
    trim: true
  },
  panVerified: {
    type: Boolean,
    default: false
  },
  bankDetails: {
    accountHolderName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    bankName: { type: String, default: '' },
    upiId: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true
});

export const User = mongoose.model('User', userSchema);
