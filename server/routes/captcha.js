import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { generateCaptcha, verifyCaptchaSolution } from '../utils/captchaGenerator.js';
import { store } from '../dataStore.js';

const router = express.Router();

// GET /api/captcha/new
router.get('/new', authenticateToken, (req, res) => {
  try {
    const { svg, token } = generateCaptcha(6);
    res.json({ success: true, svg, token });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate captcha.' });
  }
});

// POST /api/captcha/solve
router.post('/solve', authenticateToken, (req, res) => {
  try {
    const { token, answer } = req.body;
    if (!token || !answer) {
      return res.status(400).json({ success: false, message: 'Captcha solution and token are required.' });
    }

    const verification = verifyCaptchaSolution(answer, token, 1.0);
    if (!verification.valid) {
      return res.status(400).json({ success: false, message: verification.reason });
    }

    const rewardRate = store.data.siteContent?.settings?.captchaReward ?? 0.50;
    const dailyLimit = store.data.siteContent?.settings?.dailyCaptchaLimit ?? 50;

    const wallet = store.data.wallets.find(w => w.userId === req.user.id || w.memberId === req.user.memberId);
    if (!wallet) return res.status(404).json({ success: false, message: 'Wallet not found.' });

    const todayStr = new Date().toISOString().split('T')[0];
    if (wallet.lastCaptchaDate !== todayStr) {
      wallet.todayCaptchasSolved = 0;
      wallet.lastCaptchaDate = todayStr;
    }

    if (wallet.todayCaptchasSolved >= dailyLimit) {
      return res.status(429).json({
        success: false,
        message: `Daily limit of ${dailyLimit} captchas reached! Please return tomorrow.`
      });
    }

    wallet.todayCaptchasSolved += 1;
    wallet.currentBalance = parseFloat((wallet.currentBalance + rewardRate).toFixed(2));
    wallet.captchaEarnings = parseFloat((wallet.captchaEarnings + rewardRate).toFixed(2));

    const tx = {
      _id: `tx_${Date.now()}`,
      userId: req.user.id,
      memberId: wallet.memberId,
      type: 'captcha_reward',
      grossAmount: rewardRate,
      tdsPercentage: 0,
      tdsAmount: 0,
      adminFeePercentage: 0,
      adminFeeAmount: 0,
      netAmount: rewardRate,
      status: 'completed',
      description: `Daily Captcha Solve Reward (#${wallet.todayCaptchasSolved})`,
      createdAt: new Date().toISOString()
    };
    store.data.transactions.push(tx);
    store.save();

    res.json({
      success: true,
      message: `Great job! ₹${rewardRate.toFixed(2)} added to your wallet.`,
      rewardEarned: rewardRate,
      currentBalance: wallet.currentBalance,
      todayCaptchasSolved: wallet.todayCaptchasSolved,
      dailyLimit
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error processing captcha reward.' });
  }
});

export default router;
