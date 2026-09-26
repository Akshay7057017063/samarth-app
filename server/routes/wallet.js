import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { store } from '../dataStore.js';

const router = express.Router();

// GET /api/wallet/summary
router.get('/summary', authenticateToken, (req, res) => {
  try {
    const user = store.data.users.find(u => u._id === req.user.id || u.memberId === req.user.memberId);
    let wallet = store.data.wallets.find(w => w.userId === req.user.id || w.memberId === req.user.memberId);

    if (!wallet && user) {
      wallet = {
        _id: `w_${Date.now()}`,
        userId: user._id,
        memberId: user.memberId,
        currentBalance: 0,
        captchaEarnings: 0,
        referralCommissions: 0,
        totalWithdrawn: 0,
        todayCaptchasSolved: 0,
        lastCaptchaDate: new Date().toISOString().split('T')[0]
      };
      store.data.wallets.push(wallet);
      store.save();
    }

    res.json({
      success: true,
      wallet,
      user,
      settings: store.data.siteContent?.settings || {
        tdsRateWithPan: 5,
        tdsRateNoPan: 20,
        adminFeeRate: 5,
        minWithdrawalAmount: 200
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch wallet.' });
  }
});

// GET /api/wallet/transactions
router.get('/transactions', authenticateToken, (req, res) => {
  try {
    const txs = store.data.transactions
      .filter(t => t.userId === req.user.id || t.memberId === req.user.memberId)
      .reverse();

    res.json({ success: true, transactions: txs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions.' });
  }
});

// POST /api/wallet/withdraw
router.post('/withdraw', authenticateToken, (req, res) => {
  try {
    const { amount, payoutMethod, payoutDetails } = req.body;
    const grossAmount = parseFloat(amount);

    const user = store.data.users.find(u => u._id === req.user.id || u.memberId === req.user.memberId);
    const wallet = store.data.wallets.find(w => w.userId === req.user.id || w.memberId === req.user.memberId);

    if (!wallet || wallet.currentBalance < grossAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
    }

    const settings = store.data.siteContent?.settings || { tdsRateWithPan: 5, tdsRateNoPan: 20, adminFeeRate: 5 };
    const hasPan = Boolean(user?.panVerified && user?.panNumber && user?.panNumber.length >= 10);
    const tdsPercentage = hasPan ? settings.tdsRateWithPan : settings.tdsRateNoPan;

    const tdsAmount = parseFloat(((grossAmount * tdsPercentage) / 100).toFixed(2));
    const adminFeeAmount = parseFloat(((grossAmount * settings.adminFeeRate) / 100).toFixed(2));
    const netAmount = parseFloat((grossAmount - tdsAmount - adminFeeAmount).toFixed(2));

    wallet.currentBalance = parseFloat((wallet.currentBalance - grossAmount).toFixed(2));

    const newTx = {
      _id: `tx_${Date.now()}`,
      userId: user._id,
      memberId: user.memberId || user.userCode,
      type: 'withdrawal',
      grossAmount,
      tdsPercentage,
      tdsAmount,
      adminFeePercentage: settings.adminFeeRate,
      adminFeeAmount,
      netAmount,
      status: 'pending',
      payoutMethod: payoutMethod || 'UPI',
      payoutDetails: payoutDetails || user?.bankDetails?.upiId || user?.bankDetails?.accountNumber,
      panNumber: user?.panNumber || 'NOT_PROVIDED',
      utrNumber: '',
      description: `Payout request (Gross: ₹${grossAmount}, TDS ${tdsPercentage}%: -₹${tdsAmount}, Admin 5%: -₹${adminFeeAmount}, Net: ₹${netAmount})`,
      createdAt: new Date().toISOString()
    };

    store.data.transactions.push(newTx);
    store.save();

    res.status(201).json({
      success: true,
      message: 'Withdrawal submitted successfully with TDS deduction! Awaiting admin approval.',
      transaction: newTx,
      newBalance: wallet.currentBalance
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process withdrawal.' });
  }
});

export default router;
