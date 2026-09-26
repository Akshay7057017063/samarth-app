import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';
import { store } from '../dataStore.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'samarth_jwt_secret_token_key_2026_prod';

// Super Admin / Admin Guard
const requireSuperOrAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ success: false, message: 'Super Administrator or Admin clearance required.' });
  }
  next();
};

router.use(authenticateToken, requireSuperOrAdmin);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    const totalUsers = store.data.users.filter(u => u.role === 'user').length;
    const activeUsers = store.data.users.filter(u => u.role === 'user' && u.status === 'active').length;
    const paidUsers = store.data.users.filter(u => u.role === 'user' && u.userType === 'PAID').length;
    const unpaidUsers = store.data.users.filter(u => u.role === 'user' && u.userType !== 'PAID').length;

    const totalCurrentBalance = store.data.wallets.reduce((s, w) => s + (w.currentBalance || 0), 0);
    const totalCaptchaPaid = store.data.wallets.reduce((s, w) => s + (w.captchaEarnings || 0), 0);
    const totalReferralPaid = store.data.wallets.reduce((s, w) => s + (w.referralCommissions || 0), 0);
    const totalWithdrawnPaid = store.data.wallets.reduce((s, w) => s + (w.totalWithdrawn || 0), 0);

    const pendingWithdrawals = store.data.transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending');
    const pendingWithdrawalsNet = pendingWithdrawals.reduce((s, t) => s + t.netAmount, 0);

    const tdsTransactions = store.data.transactions.filter(t => t.type === 'withdrawal' && (t.status === 'approved' || t.status === 'completed' || t.status === 'pending'));
    const totalTdsDeducted = tdsTransactions.reduce((s, t) => s + (t.tdsAmount || 0), 0);
    const totalAdminFee = tdsTransactions.reduce((s, t) => s + (t.adminFeeAmount || 0), 0);

    const totalSalesVolume = (store.data.sales || []).reduce((s, o) => s + (o.amount || 0), 0);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        paidUsers,
        unpaidUsers,
        totalCurrentBalance,
        totalCaptchaPaid,
        totalReferralPaid,
        totalWithdrawnPaid,
        pendingWithdrawalsCount: pendingWithdrawals.length,
        pendingWithdrawalsNet,
        totalTdsDeducted,
        totalAdminFee,
        totalSalesCount: (store.data.sales || []).length,
        totalSalesVolume
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
});

// GET /api/admin/users (List all members with search & filters)
router.get('/users', (req, res) => {
  try {
    const { search, userType } = req.query;
    let list = store.data.users.filter(u => u.role === 'user');

    if (userType && userType !== 'all') {
      list = list.filter(u => u.userType === userType);
    }

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(u => 
        (u.memberId && u.memberId.toLowerCase().includes(s)) ||
        (u.userCode && u.userCode.toLowerCase().includes(s)) ||
        (u.name && u.name.toLowerCase().includes(s)) ||
        (u.email && u.email.toLowerCase().includes(s)) ||
        (u.phone && u.phone.includes(s)) ||
        (u.sponsorCode && u.sponsorCode.toLowerCase().includes(s))
      );
    }

    res.json({ success: true, users: list, count: list.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
});

// GET /api/admin/users/:id/details (Full customer dossier for Super Admin)
router.get('/users/:id/details', (req, res) => {
  try {
    const user = store.data.users.find(u => u._id === req.params.id || u.memberId === req.params.id || u.userCode === req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const wallet = store.data.wallets.find(w => w.userId === user._id || w.memberId === user.memberId);
    const transactions = store.data.transactions.filter(t => t.userId === user._id || t.memberId === user.memberId);
    const userSales = (store.data.sales || []).filter(s => s.userCode === user.userCode || s.userCode === user.memberId);

    res.json({
      success: true,
      user,
      wallet: wallet || { currentBalance: 0, captchaEarnings: 0, referralCommissions: 0 },
      transactions,
      sales: userSales
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user dossier.' });
  }
});

// PUT /api/admin/users/:id/update-all (Super Admin master edit of all customer data)
router.put('/users/:id/update-all', (req, res) => {
  try {
    const user = store.data.users.find(u => u._id === req.params.id || u.memberId === req.params.id || u.userCode === req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const fields = req.body;

    // Update Profile Information
    if (fields.name !== undefined) user.name = fields.name;
    if (fields.email !== undefined) user.email = fields.email;
    if (fields.phone !== undefined) user.phone = fields.phone;
    if (fields.sponsorCode !== undefined) user.sponsorCode = fields.sponsorCode.toUpperCase();
    if (fields.sponsorMemberId !== undefined) user.sponsorMemberId = fields.sponsorMemberId.toUpperCase();
    if (fields.rank !== undefined) user.rank = fields.rank;
    if (fields.userType !== undefined) user.userType = fields.userType;
    if (fields.activationDate !== undefined) user.activationDate = fields.activationDate;
    if (fields.joiningPackage !== undefined) user.joiningPackage = fields.joiningPackage;

    // Update Binary Network PV & Business Values
    if (fields.leftCount !== undefined) user.leftCount = parseInt(fields.leftCount, 10);
    if (fields.rightCount !== undefined) user.rightCount = parseInt(fields.rightCount, 10);
    if (fields.leftBusiness !== undefined) user.leftBusiness = parseFloat(fields.leftBusiness);
    if (fields.rightBusiness !== undefined) user.rightBusiness = parseFloat(fields.rightBusiness);
    if (fields.leftPv !== undefined) user.leftPv = parseFloat(fields.leftPv);
    if (fields.rightPv !== undefined) user.rightPv = parseFloat(fields.rightPv);
    if (fields.leftCarryForwardPv !== undefined) user.leftCarryForwardPv = parseFloat(fields.leftCarryForwardPv);
    if (fields.rightCarryForwardPv !== undefined) user.rightCarryForwardPv = parseFloat(fields.rightCarryForwardPv);
    if (fields.totalTeam !== undefined) user.totalTeam = parseInt(fields.totalTeam, 10);
    if (fields.activeTeam !== undefined) user.activeTeam = parseInt(fields.activeTeam, 10);
    if (fields.teamPercent !== undefined) user.teamPercent = fields.teamPercent;

    // Update All Incomes
    if (fields.matchingIncome !== undefined) user.matchingIncome = parseFloat(fields.matchingIncome);
    if (fields.todayMatchingIncome !== undefined) user.todayMatchingIncome = parseFloat(fields.todayMatchingIncome);
    if (fields.franchiseReferralIncome !== undefined) user.franchiseReferralIncome = parseFloat(fields.franchiseReferralIncome);
    if (fields.franchiseMatchingIncome !== undefined) user.franchiseMatchingIncome = parseFloat(fields.franchiseMatchingIncome);
    if (fields.totalIncome !== undefined) user.totalIncome = parseFloat(fields.totalIncome);

    // Update KYC & Bank
    if (fields.panNumber !== undefined) user.panNumber = fields.panNumber.toUpperCase();
    if (fields.panVerified !== undefined) user.panVerified = Boolean(fields.panVerified);
    if (fields.bankDetails) {
      user.bankDetails = {
        accountHolderName: fields.bankDetails.accountHolderName ?? user.bankDetails?.accountHolderName,
        accountNumber: fields.bankDetails.accountNumber ?? user.bankDetails?.accountNumber,
        ifscCode: fields.bankDetails.ifscCode ? fields.bankDetails.ifscCode.toUpperCase() : user.bankDetails?.ifscCode,
        bankName: fields.bankDetails.bankName ?? user.bankDetails?.bankName,
        upiId: fields.bankDetails.upiId ?? user.bankDetails?.upiId
      };
    }

    store.save();

    res.json({
      success: true,
      message: `All details for customer ${user.userCode || user.memberId} updated successfully!`,
      user
    });
  } catch (err) {
    console.error('Update all error:', err);
    res.status(500).json({ success: false, message: 'Failed to update customer details.' });
  }
});

// POST /api/admin/users/:id/adjust-wallet (Credit or Debit Customer Wallet)
router.post('/users/:id/adjust-wallet', (req, res) => {
  try {
    const { amount, type, reason } = req.body; // type: 'credit' | 'debit'
    const adjAmount = parseFloat(amount);

    if (isNaN(adjAmount) || adjAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid adjustment amount.' });
    }

    const user = store.data.users.find(u => u._id === req.params.id || u.memberId === req.params.id || u.userCode === req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    let wallet = store.data.wallets.find(w => w.userId === user._id || w.memberId === user.memberId);
    if (!wallet) {
      wallet = {
        _id: `w_${Date.now()}`,
        userId: user._id,
        memberId: user.memberId,
        currentBalance: 0,
        captchaEarnings: 0,
        referralCommissions: 0,
        totalWithdrawn: 0
      };
      store.data.wallets.push(wallet);
    }

    if (type === 'credit') {
      wallet.currentBalance = parseFloat((wallet.currentBalance + adjAmount).toFixed(2));
    } else {
      if (wallet.currentBalance < adjAmount) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance for debit.' });
      }
      wallet.currentBalance = parseFloat((wallet.currentBalance - adjAmount).toFixed(2));
    }

    const tx = {
      _id: `tx_${Date.now()}`,
      userId: user._id,
      memberId: user.userCode || user.memberId,
      type: type === 'credit' ? 'referral_bonus' : 'withdrawal',
      grossAmount: adjAmount,
      tdsPercentage: 0,
      tdsAmount: 0,
      adminFeePercentage: 0,
      adminFeeAmount: 0,
      netAmount: adjAmount,
      status: 'completed',
      description: `Super Admin Manual Adjustment (${type.toUpperCase()}): ${reason || 'Administrative credit/debit'}`,
      createdAt: new Date().toISOString()
    };
    store.data.transactions.push(tx);
    store.save();

    res.json({
      success: true,
      message: `Successfully ${type}ed ₹${adjAmount.toFixed(2)} to ${user.name}'s wallet.`,
      newBalance: wallet.currentBalance
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to adjust wallet.' });
  }
});

// POST /api/admin/users/:id/sell-package (Sell/Allocate Package to Customer)
router.post('/users/:id/sell-package', (req, res) => {
  try {
    const { packageName, pv, amount, paymentMode, legPosition } = req.body;

    const user = store.data.users.find(u => u._id === req.params.id || u.memberId === req.params.id || u.userCode === req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Customer not found.' });

    const packagePv = parseInt(pv, 10) || 20;
    const packageAmount = parseFloat(amount) || 3600;

    // Update Customer Status to PAID
    user.userType = 'PAID';
    user.activationDate = new Date().toLocaleDateString('en-GB');
    user.joiningPackage = packageName || 'Bio-Magnetic Healthcare Single Mat (20 PV)';

    // Add PV to user leg
    if (legPosition === 'right') {
      user.rightPv = (user.rightPv || 0) + packagePv;
      user.rightBusiness = (user.rightBusiness || 0) + packageAmount;
    } else {
      user.leftPv = (user.leftPv || 0) + packagePv;
      user.leftBusiness = (user.leftBusiness || 0) + packageAmount;
      user.leftCarryForwardPv = (user.leftCarryForwardPv || 0) + packagePv;
    }

    // Record in Sales database
    if (!store.data.sales) store.data.sales = [];
    const saleRecord = {
      _id: `sale_${Date.now()}`,
      userCode: user.userCode || user.memberId,
      customerName: user.name,
      packageName: user.joiningPackage,
      pv: packagePv,
      amount: packageAmount,
      paymentMode: paymentMode || 'Direct Cash / Franchise',
      status: 'Completed',
      dispatchStatus: 'Dispatched',
      invoiceDate: new Date().toLocaleDateString('en-GB')
    };
    store.data.sales.push(saleRecord);
    store.save();

    res.json({
      success: true,
      message: `Package successfully sold and assigned to ${user.name} (${user.userCode})! Status updated to PAID.`,
      saleRecord,
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process package sale.' });
  }
});

// POST /api/admin/users/:id/impersonate (1-Click Login As This Customer)
router.post('/users/:id/impersonate', (req, res) => {
  try {
    const user = store.data.users.find(u => u._id === req.params.id || u.memberId === req.params.id || u.userCode === req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const token = jwt.sign(
      { 
        id: user._id, 
        memberId: user.memberId || user.userCode, 
        userCode: user.userCode || user.memberId,
        role: user.role, 
        name: user.name,
        impersonatedBy: req.user.userCode || 'SUPERADMIN'
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      message: `Access token generated for ${user.name}. Redirecting to customer dashboard...`,
      token,
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to impersonate customer.' });
  }
});

// GET /api/admin/sales (All customer purchases and orders)
router.get('/sales', (req, res) => {
  try {
    res.json({
      success: true,
      sales: (store.data.sales || []).reverse()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch sales ledger.' });
  }
});

// PUT /api/admin/users/:id/toggle-status
router.put('/users/:id/toggle-status', (req, res) => {
  try {
    const user = store.data.users.find(u => u._id === req.params.id || u.memberId === req.params.id || u.userCode === req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.status = user.status === 'active' ? 'suspended' : 'active';
    store.save();

    res.json({ success: true, message: `User status changed to ${user.status}.`, status: user.status });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle status.' });
  }
});

// GET /api/admin/withdrawals
router.get('/withdrawals', (req, res) => {
  try {
    const { status } = req.query;
    let txs = store.data.transactions.filter(t => t.type === 'withdrawal');

    if (status && status !== 'all') {
      txs = txs.filter(t => t.status === status);
    }

    const populated = txs.map(t => {
      const u = store.data.users.find(user => user._id === t.userId || user.memberId === t.memberId || user.userCode === t.memberId);
      return { ...t, userId: u || { name: 'Member', memberId: t.memberId } };
    }).reverse();

    res.json({ success: true, withdrawals: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawals.' });
  }
});

// PUT /api/admin/withdrawals/:id/action
router.put('/withdrawals/:id/action', (req, res) => {
  try {
    const { action, utrNumber, remark } = req.body;
    const tx = store.data.transactions.find(t => t._id === req.params.id);

    if (!tx || tx.type !== 'withdrawal') {
      return res.status(404).json({ success: false, message: 'Withdrawal not found.' });
    }

    const wallet = store.data.wallets.find(w => w.userId === tx.userId || w.memberId === tx.memberId);

    if (action === 'approve') {
      tx.status = 'approved';
      tx.utrNumber = utrNumber || `IMPS_${Date.now()}`;
      tx.description = remark || `Payout approved with UTR: ${tx.utrNumber}`;
      if (wallet) {
        wallet.totalWithdrawn = parseFloat((wallet.totalWithdrawn + tx.grossAmount).toFixed(2));
      }
      store.save();
      return res.json({ success: true, message: `Payout approved with UTR: ${tx.utrNumber}`, transaction: tx });
    } else if (action === 'reject') {
      tx.status = 'rejected';
      tx.description = remark || 'Withdrawal rejected by admin. Balance refunded.';
      if (wallet) {
        wallet.currentBalance = parseFloat((wallet.currentBalance + tx.grossAmount).toFixed(2));
      }
      store.save();
      return res.json({ success: true, message: 'Withdrawal rejected and balance refunded.', transaction: tx });
    }

    res.status(400).json({ success: false, message: 'Invalid action.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to process withdrawal action.' });
  }
});

// GET /api/admin/tds-report
router.get('/tds-report', (req, res) => {
  try {
    const approvedTxs = store.data.transactions.filter(t => 
      t.type === 'withdrawal' && (t.status === 'approved' || t.status === 'completed')
    );

    const populated = approvedTxs.map(t => {
      const u = store.data.users.find(user => user._id === t.userId || user.memberId === t.memberId || user.userCode === t.memberId);
      return { ...t, userId: u || { name: 'Member', memberId: t.memberId } };
    }).reverse();

    const totalGross = populated.reduce((s, t) => s + t.grossAmount, 0);
    const totalTds = populated.reduce((s, t) => s + t.tdsAmount, 0);
    const totalAdmin = populated.reduce((s, t) => s + t.adminFeeAmount, 0);
    const totalNet = populated.reduce((s, t) => s + t.netAmount, 0);

    res.json({
      success: true,
      report: populated,
      summary: {
        totalPayoutsCount: populated.length,
        totalGross: parseFloat(totalGross.toFixed(2)),
        totalTds: parseFloat(totalTds.toFixed(2)),
        totalAdmin: parseFloat(totalAdmin.toFixed(2)),
        totalNet: parseFloat(totalNet.toFixed(2))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate TDS report.' });
  }
});

// GET /api/admin/site-content
router.get('/site-content', (req, res) => {
  res.json({ success: true, content: store.data.siteContent });
});

// PUT /api/admin/site-content
router.put('/site-content', (req, res) => {
  try {
    store.data.siteContent = req.body;
    store.save();
    res.json({ success: true, message: 'Website content updated live!', content: store.data.siteContent });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update CMS content.' });
  }
});

export default router;
