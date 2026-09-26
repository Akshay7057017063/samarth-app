import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  generateCaptcha,
  verifyCaptchaSolution
} from '../utils/captchaGenerator.js';
import { store } from '../dataStore.js';

const router = express.Router();

// GET /api/captcha/new
router.get('/new', authenticateToken, (req, res) => {
  try {
    const { svg, token } = generateCaptcha(6);

    res.json({
      success: true,
      svg,
      token
    });
  } catch (err) {
    console.error('Captcha generation error:', err);

    res.status(500).json({
      success: false,
      message: 'Failed to generate captcha.'
    });
  }
});

// POST /api/captcha/solve
router.post('/solve', authenticateToken, (req, res) => {
  try {
    const { token, answer } = req.body;

    // Basic validation
    if (!token || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Captcha solution and token are required.'
      });
    }

    const userId = req.user.id;
    const memberId = req.user.memberId;

    const now = new Date().toISOString();

    // Make sure captchaAttempts exists even if an old database
    // is being used before dataStore initialization.
    if (!Array.isArray(store.data.captchaAttempts)) {
      store.data.captchaAttempts = [];
    }

    /*
     * Verify captcha
     *
     * Important:
     * Only an actual incorrect captcha answer is stored as "wrong".
     * Expired, invalid signature, missing input, or suspicious-speed
     * failures are NOT treated as wrong answers.
     */
    const verification = verifyCaptchaSolution(answer, token, 1.0);

    if (!verification.valid) {
      const isWrongAnswer =
        verification.reason === 'Incorrect captcha text. Try again.';

      if (isWrongAnswer) {
        const wrongAttempt = {
          _id: `captcha_attempt_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`,

          userId,
          memberId,

          result: 'wrong',
          status: 'wrong',

          answer: String(answer).trim(),

          rewardEarned: 0,

          reason: verification.reason,

          createdAt: now
        };

        store.data.captchaAttempts.push(wrongAttempt);
        store.save();
      }

      return res.status(400).json({
        success: false,
        message: verification.reason
      });
    }

    // Get current captcha settings
    const rewardRate =
      store.data.siteContent?.settings?.captchaReward ?? 0.50;

    const dailyLimit =
      store.data.siteContent?.settings?.dailyCaptchaLimit ?? 50;

    // Find user's wallet
    const wallet = store.data.wallets.find(
      w =>
        w.userId === req.user.id ||
        w.memberId === req.user.memberId
    );

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found.'
      });
    }

    // Current date
    const todayStr = new Date().toISOString().split('T')[0];

    // Reset daily successful captcha count on a new day
    if (wallet.lastCaptchaDate !== todayStr) {
      wallet.todayCaptchasSolved = 0;
      wallet.lastCaptchaDate = todayStr;
    }

    // Check daily successful captcha limit
    if (wallet.todayCaptchasSolved >= dailyLimit) {
      return res.status(429).json({
        success: false,
        message: `Daily limit of ${dailyLimit} captchas reached! Please return tomorrow.`
      });
    }

    /*
     * Successful captcha
     */

    wallet.todayCaptchasSolved += 1;

    wallet.currentBalance = parseFloat(
      (wallet.currentBalance + rewardRate).toFixed(2)
    );

    wallet.captchaEarnings = parseFloat(
      (wallet.captchaEarnings + rewardRate).toFixed(2)
    );

    // Save successful captcha attempt
    const correctAttempt = {
      _id: `captcha_attempt_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,

      userId,
      memberId,

      result: 'correct',
      status: 'correct',

      answer: String(answer).trim(),

      rewardEarned: rewardRate,

      dailySolveNumber: wallet.todayCaptchasSolved,

      reason: 'Captcha solved successfully.',

      createdAt: now
    };

    store.data.captchaAttempts.push(correctAttempt);

    // Create wallet transaction
    const tx = {
      _id: `tx_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,

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

      createdAt: now
    };

    store.data.transactions.push(tx);

    // Save wallet + transaction + captcha attempt together
    store.save();

    // Response to customer frontend
    return res.json({
      success: true,

      message: `Great job! ₹${rewardRate.toFixed(2)} added to your wallet.`,

      rewardEarned: rewardRate,

      currentBalance: wallet.currentBalance,

      todayCaptchasSolved: wallet.todayCaptchasSolved,

      dailyLimit
    });
  } catch (err) {
    console.error('Captcha solve error:', err);

    return res.status(500).json({
      success: false,
      message: 'Server error processing captcha reward.'
    });
  }
});

export default router;