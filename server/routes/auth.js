import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Wallet } from '../models/Wallet.js';
import { authenticateToken } from '../middleware/auth.js';
import { store } from '../dataStore.js';
import mongoose from 'mongoose';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'samarth_jwt_secret_token_key_2026_prod';

const isMongoActive = () => mongoose.connection.readyState === 1;

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide User Code / Email and Password.' });
    }

    const cleanId = loginId.trim();

    let user = null;
    if (isMongoActive()) {
      user = await User.findOne({
        $or: [
          { memberId: cleanId.toUpperCase() },
          { userCode: cleanId.toUpperCase() },
          { email: cleanId.toLowerCase() }
        ]
      });
    } else {
      user = store.data.users.find(u => 
        (u.memberId && u.memberId.toUpperCase() === cleanId.toUpperCase()) ||
        (u.userCode && u.userCode.toUpperCase() === cleanId.toUpperCase()) ||
        (u.email && u.email.toLowerCase() === cleanId.toLowerCase())
      );
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User code or email not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password.' });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        memberId: user.memberId || user.userCode, 
        userCode: user.userCode || user.memberId,
        role: user.role, 
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, sponsorCode, position } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = store.data.users.find(u => u.email === cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const count = store.data.users.length;
    const memberCode = `SI${681908 + count}`;
    const sponsor = sponsorCode ? sponsorCode.trim().toUpperCase() : 'SI107476';

    const newUser = {
      _id: `user_${Date.now()}`,
      memberId: memberCode,
      userCode: memberCode,
      sponsorCode: sponsor,
      sponsorMemberId: sponsor,
      name,
      email: cleanEmail,
      phone,
      password: passwordHash,
      role: 'user',
      dateOfEntry: new Date().toLocaleDateString('en-GB'),
      userType: 'UNPAID',
      activationDate: '-',
      joiningPackage: '-',
      rank: 'Distributor',
      position: position || 'left',
      leftCount: 0,
      rightCount: 0,
      leftBusiness: 0,
      rightBusiness: 0,
      totalReferral: 0,
      activeReferral: 0,
      leftPv: 0,
      rightPv: 0,
      leftCarryForwardPv: 0,
      rightCarryForwardPv: 0,
      totalTeam: 0,
      activeTeam: 0,
      teamPercent: '0%',
      matchingIncome: 0,
      todayMatchingIncome: 0,
      franchiseReferralIncome: 0,
      franchiseMatchingIncome: 0,
      totalIncome: 0,
      panNumber: '',
      panVerified: false,
      bankDetails: {
        accountHolderName: name,
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        upiId: ''
      },
      status: 'active',
      createdAt: new Date().toISOString()
    };

    store.data.users.push(newUser);

    const newWallet = {
      _id: `w_${Date.now()}`,
      userId: newUser._id,
      memberId: newUser.memberId,
      currentBalance: 50.00,
      captchaEarnings: 0.00,
      referralCommissions: 0.00,
      totalWithdrawn: 0.00,
      todayCaptchasSolved: 0,
      lastCaptchaDate: new Date().toISOString().split('T')[0]
    };
    store.data.wallets.push(newWallet);
    store.save();

    const token = jwt.sign(
      { id: newUser._id, memberId: newUser.memberId, userCode: newUser.userCode, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account registered successfully! Welcome bonus ₹50 credited.',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    let user = null;
    let wallet = null;

    if (isMongoActive()) {
      user = await User.findById(req.user.id).select('-password');
      wallet = await Wallet.findOne({ userId: req.user.id });
    } else {
      user = store.data.users.find(u => u._id === req.user.id || u.memberId === req.user.memberId);
      wallet = store.data.wallets.find(w => w.userId === req.user.id || w.memberId === req.user.memberId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User session not found.' });
    }

    res.json({
      success: true,
      user,
      wallet: wallet || { currentBalance: 0, captchaEarnings: 0, referralCommissions: 0 }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user session.' });
  }
});

// PUT /api/auth/kyc
router.put('/kyc', authenticateToken, async (req, res) => {
  try {
    const { panNumber, accountHolderName, accountNumber, ifscCode, bankName, upiId } = req.body;

    const user = store.data.users.find(u => u._id === req.user.id || u.memberId === req.user.memberId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (panNumber) {
      user.panNumber = panNumber.trim().toUpperCase();
      user.panVerified = true;
    }

    user.bankDetails = {
      accountHolderName: accountHolderName || user.bankDetails?.accountHolderName,
      accountNumber: accountNumber || user.bankDetails?.accountNumber,
      ifscCode: ifscCode ? ifscCode.toUpperCase() : user.bankDetails?.ifscCode,
      bankName: bankName || user.bankDetails?.bankName,
      upiId: upiId || user.bankDetails?.upiId
    };

    store.save();

    res.json({
      success: true,
      message: 'KYC and Bank details updated successfully!',
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update KYC.' });
  }
});

export default router;
