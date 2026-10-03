import { User } from "../../models/User.js";
import { Wallet } from "../../models/Wallet.js";
import { CaptchaAttempt } from "../../models/CaptchaAttempt.js";

import {
  customerFilter,
  findCustomerByIdentifier,
  getTodayDateKey,
  toNumber,
} from "../../utils/adminHelpers.js";

const CORRECT = { result: "correct", status: "success" };
const WRONG = { result: "wrong", status: "failed" };

const calcAccuracy = (correct, total) =>
  total > 0 ? Number(((correct / total) * 100).toFixed(2)) : 0;

// =====================================================
// CAPTCHA STATISTICS - ALL CUSTOMERS
// =====================================================

export const getCaptchaStats = async (req, res) => {
  try {
    const today = getTodayDateKey();

    const [
      totalAttempts,
      totalCorrect,
      totalWrong,
      totalCaptchaEarningsResult,
      todayAttempts,
      todayCorrect,
      todayWrong,
    ] = await Promise.all([
      CaptchaAttempt.countDocuments({}),
      CaptchaAttempt.countDocuments(CORRECT),
      CaptchaAttempt.countDocuments(WRONG),
      Wallet.aggregate([
        { $group: { _id: null, total: { $sum: "$captchaEarnings" } } },
      ]),
      CaptchaAttempt.countDocuments({ attemptDate: today }),
      CaptchaAttempt.countDocuments({ attemptDate: today, ...CORRECT }),
      CaptchaAttempt.countDocuments({ attemptDate: today, ...WRONG }),
    ]);

    const accuracy = calcAccuracy(totalCorrect, totalAttempts);

    const users = await User.find(customerFilter)
      .select("_id memberId userCode name email status")
      .sort({ createdAt: -1 })
      .lean();

    const userIds = users.map((user) => user._id);

    const customerAttempts = await CaptchaAttempt.aggregate([
      { $match: { userId: { $in: userIds } } },
      {
        $group: {
          _id: "$userId",
          totalAttempts: { $sum: 1 },
          correctAttempts: {
            $sum: { $cond: [{ $eq: ["$result", "correct"] }, 1, 0] },
          },
          wrongAttempts: {
            $sum: { $cond: [{ $eq: ["$result", "wrong"] }, 1, 0] },
          },
        },
      },
    ]);

    const wallets = await Wallet.find({ userId: { $in: userIds } })
      .select("userId captchaEarnings todayCaptchasSolved")
      .lean();

    const attemptMap = new Map(
      customerAttempts.map((item) => [String(item._id), item])
    );

    const walletMap = new Map(
      wallets.map((wallet) => [String(wallet.userId), wallet])
    );

    const customers = users.map((user) => {
      const attempt = attemptMap.get(String(user._id));
      const wallet = walletMap.get(String(user._id));

      const total = Number(attempt?.totalAttempts || 0);
      const correct = Number(attempt?.correctAttempts || 0);
      const wrong = Number(attempt?.wrongAttempts || 0);

      return {
        _id: user._id,
        memberId: user.memberId || user.userCode || "-",
        name: user.name,
        email: user.email,
        status: user.status,
        totalAttempts: total,
        correctAttempts: correct,
        wrongAttempts: wrong,
        accuracy: calcAccuracy(correct, total),
        captchaEarnings: toNumber(wallet?.captchaEarnings),
        todayCaptchasSolved: toNumber(wallet?.todayCaptchasSolved),
      };
    });

    return res.json({
      success: true,

      stats: {
        totalAttempts,
        totalCorrect,
        totalWrong,
        accuracy,
        todayAttempts,
        todayCorrect,
        todayWrong,
        totalCaptchaEarnings: toNumber(totalCaptchaEarningsResult[0]?.total),
      },

      customers,
    });
  } catch (error) {
    console.error("❌ Get captcha stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch captcha statistics.",
    });
  }
};

// =====================================================
// CAPTCHA STATISTICS - SINGLE CUSTOMER
// =====================================================

export const getCustomerCaptchaStats = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await findCustomerByIdentifier(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const today = getTodayDateKey();

    const [
      totalAttempts,
      totalCorrect,
      totalWrong,
      todayAttempts,
      todayCorrect,
      todayWrong,
      wallet,
    ] = await Promise.all([
      CaptchaAttempt.countDocuments({ userId: user._id }),
      CaptchaAttempt.countDocuments({ userId: user._id, ...CORRECT }),
      CaptchaAttempt.countDocuments({ userId: user._id, ...WRONG }),
      CaptchaAttempt.countDocuments({ userId: user._id, attemptDate: today }),
      CaptchaAttempt.countDocuments({
        userId: user._id,
        attemptDate: today,
        ...CORRECT,
      }),
      CaptchaAttempt.countDocuments({
        userId: user._id,
        attemptDate: today,
        ...WRONG,
      }),
      Wallet.findOne({ userId: user._id }).lean(),
    ]);

    const attempts = await CaptchaAttempt.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({
      success: true,

      customer: {
        _id: user._id,
        memberId: user.memberId || user.userCode || "-",
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        userType: user.userType,
        createdAt: user.createdAt,
      },

      stats: {
        totalAttempts,
        totalCorrect,
        totalWrong,
        accuracy: calcAccuracy(totalCorrect, totalAttempts),
        todayAttempts,
        todayCorrect,
        todayWrong,
        captchaEarnings: toNumber(wallet?.captchaEarnings),
        todayCaptchasSolved: toNumber(wallet?.todayCaptchasSolved),
        currentBalance: toNumber(wallet?.currentBalance),
      },

      attempts,
    });
  } catch (error) {
    console.error("❌ Get customer captcha stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer captcha statistics.",
    });
  }
};