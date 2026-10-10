import { User } from "../../models/User.js";
import { Wallet } from "../../models/Wallet.js";
import { CaptchaAttempt } from "../../models/CaptchaAttempt.js";
import { SiteContent } from "../../models/SiteContent.js";

import {
  customerFilter,
  findCustomerByIdentifier,
  getTodayDateKey,
  toNumber,
} from "../../utils/adminHelpers.js";

import {
  normalizeCaptchaSettings,
} from "../../utils/captchaGenerator.js";

// =====================================================
// DEFAULT CAPTCHA SETTINGS
// =====================================================

const DEFAULT_CAPTCHA_SETTINGS = {
  enabled: true,

  captchaType: "mixed",

  length: 6,

  includeLowercase: true,
  includeUppercase: true,
  includeNumbers: true,
  includeSymbols: false,

  symbols: "@#$%^&*",

  caseSensitive: true,

  expirySeconds: 10,

  submitCooldownSeconds: 10,

  dailyLimit: 50,

  rewardAmount: 0.5,

  maxAttempts: 5,

  refreshAfterSuccess: true,

  refreshAfterWrongAnswer: true,

  image: {
    width: 320,
    height: 100,
    fontSize: 34,
    noiseLevel: 2,
    lineCount: 2,
    distortionLevel: 2,
    letterSpacing: 8,
    backgroundStyle: "light",
  },
};

// =====================================================
// CAPTCHA SETTINGS LIMITS
// =====================================================

const CAPTCHA_SETTINGS_LIMITS = {
  minLength: 4,
  maxLength: 32,

  minExpirySeconds: 1,
  maxExpirySeconds: 3600,

  minCooldownSeconds: 0,
  maxCooldownSeconds: 3600,

  minDailyLimit: 0,
  maxDailyLimit: 100000,

  minRewardAmount: 0,
  maxRewardAmount: 100000,

  minMaxAttempts: 1,
  maxMaxAttempts: 100,

  minImageWidth: 120,
  maxImageWidth: 800,

  minImageHeight: 50,
  maxImageHeight: 300,

  minImageFontSize: 12,
  maxImageFontSize: 100,

  minNoiseLevel: 0,
  maxNoiseLevel: 20,

  minLineCount: 0,
  maxLineCount: 20,

  minDistortionLevel: 0,
  maxDistortionLevel: 10,

  minLetterSpacing: 0,
  maxLetterSpacing: 30,
};

// =====================================================
// EXISTING STATS CONSTANTS
// =====================================================

const CORRECT = {
  result: "correct",
  status: "success",
};

const WRONG = {
  result: "wrong",
  status: "failed",
};

// =====================================================
// ACCURACY
// =====================================================

const calcAccuracy = (
  correct,
  total
) =>
  total > 0
    ? Number(
        (
          (correct / total) *
          100
        ).toFixed(2)
      )
    : 0;

// =====================================================
// BOOLEAN NORMALIZATION
// =====================================================
//
// IMPORTANT:
//
// Boolean("false") === true
//
// Therefore never use Boolean(value) directly for
// settings that may arrive from JSON, forms, or old data.
// =====================================================

const normalizeSettingBoolean = (
  value,
  fallback
) => {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value === "number"
  ) {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }
  }

  if (
    typeof value === "string"
  ) {
    const normalized =
      value
        .trim()
        .toLowerCase();

    if (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "yes" ||
      normalized === "on"
    ) {
      return true;
    }

    if (
      normalized === "false" ||
      normalized === "0" ||
      normalized === "no" ||
      normalized === "off"
    ) {
      return false;
    }
  }

  return fallback;
};

// =====================================================
// NUMBER NORMALIZATION
// =====================================================

const clampInteger = (
  value,
  min,
  max,
  fallback
) => {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return fallback;
  }

  return Math.min(
    max,
    Math.max(
      min,
      Math.floor(number)
    )
  );
};

const clampNumber = (
  value,
  min,
  max,
  fallback
) => {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return fallback;
  }

  return Math.min(
    max,
    Math.max(
      min,
      number
    )
  );
};

// =====================================================
// CREATE DEFAULT SETTINGS COPY
// =====================================================

const createDefaultCaptchaSettings =
  () => ({
    ...DEFAULT_CAPTCHA_SETTINGS,

    image: {
      ...DEFAULT_CAPTCHA_SETTINGS.image,
    },
  });

// =====================================================
// READ EXISTING CAPTCHA SETTINGS
// =====================================================
//
// Supports both:
//
// New:
// length
// rewardAmount
// dailyLimit
//
// Legacy:
// captchaLength
// captchaReward
// dailyCaptchaLimit
// =====================================================

const getRawCaptchaSettings =
  (settings = {}) => {
    const raw =
      settings &&
      typeof settings === "object"
        ? settings
        : {};

    const image =
      raw.image &&
      typeof raw.image === "object"
        ? raw.image
        : {};

    return {
      ...raw,

      length:
        raw.length ??
        raw.captchaLength ??
        DEFAULT_CAPTCHA_SETTINGS.length,

      rewardAmount:
        raw.rewardAmount ??
        raw.captchaReward ??
        DEFAULT_CAPTCHA_SETTINGS.rewardAmount,

      dailyLimit:
        raw.dailyLimit ??
        raw.dailyCaptchaLimit ??
        DEFAULT_CAPTCHA_SETTINGS.dailyLimit,

      image,
    };
  };

// =====================================================
// NORMALIZE + VALIDATE CAPTCHA SETTINGS
// =====================================================

const buildCaptchaSettings =
  (incoming = {}) => {
    const defaults =
      createDefaultCaptchaSettings();

    const raw =
      getRawCaptchaSettings(
        incoming
      );

    const merged = {
      ...defaults,

      ...raw,

      image: {
        ...defaults.image,

        ...(raw.image || {}),
      },
    };

    const normalized =
      normalizeCaptchaSettings(
        merged
      );

    // =================================================
    // ENABLED
    // =================================================

    normalized.enabled =
      normalizeSettingBoolean(
        raw.enabled,
        defaults.enabled
      );

    // =================================================
    // CAPTCHA TYPE
    // =================================================

    const allowedTypes = [
      "text",
      "mixed",
      "image",
    ];

    const captchaType =
      String(
        raw.captchaType ??
          defaults.captchaType
      )
        .trim()
        .toLowerCase();

    if (
      !allowedTypes.includes(
        captchaType
      )
    ) {
      return {
        error:
          "CAPTCHA type must be text, mixed or image.",
      };
    }

    normalized.captchaType =
      captchaType;

    // =================================================
    // LENGTH
    // =================================================

    normalized.length =
      clampInteger(
        raw.length ??
          raw.captchaLength,
        CAPTCHA_SETTINGS_LIMITS.minLength,
        CAPTCHA_SETTINGS_LIMITS.maxLength,
        defaults.length
      );

    // =================================================
    // CHARACTER SETTINGS
    // =================================================

    normalized.includeLowercase =
      normalizeSettingBoolean(
        raw.includeLowercase,
        defaults.includeLowercase
      );

    normalized.includeUppercase =
      normalizeSettingBoolean(
        raw.includeUppercase,
        defaults.includeUppercase
      );

    normalized.includeNumbers =
      normalizeSettingBoolean(
        raw.includeNumbers,
        defaults.includeNumbers
      );

    normalized.includeSymbols =
      normalizeSettingBoolean(
        raw.includeSymbols,
        defaults.includeSymbols
      );

    normalized.caseSensitive =
      normalizeSettingBoolean(
        raw.caseSensitive,
        defaults.caseSensitive
      );

    // =================================================
    // SYMBOLS
    // =================================================

    normalized.symbols =
      typeof raw.symbols ===
        "string"
        ? raw.symbols.trim()
        : defaults.symbols;

    if (
      normalized.includeSymbols &&
      !normalized.symbols
    ) {
      return {
        error:
          "Symbols are enabled, but the symbols string is empty.",
      };
    }

    // =================================================
    // CHARACTER CATEGORY CHECK
    // =================================================

    if (
      !normalized.includeLowercase &&
      !normalized.includeUppercase &&
      !normalized.includeNumbers &&
      !normalized.includeSymbols
    ) {
      return {
        error:
          "At least one CAPTCHA character category must be enabled.",
      };
    }

    // =================================================
    // EXPIRY
    // =================================================

    normalized.expirySeconds =
      clampInteger(
        raw.expirySeconds,
        CAPTCHA_SETTINGS_LIMITS.minExpirySeconds,
        CAPTCHA_SETTINGS_LIMITS.maxExpirySeconds,
        defaults.expirySeconds
      );

    // =================================================
    // SUBMIT COOLDOWN
    // =================================================

    normalized.submitCooldownSeconds =
      clampInteger(
        raw.submitCooldownSeconds,
        CAPTCHA_SETTINGS_LIMITS.minCooldownSeconds,
        CAPTCHA_SETTINGS_LIMITS.maxCooldownSeconds,
        defaults.submitCooldownSeconds
      );

    // =================================================
    // DAILY LIMIT
    // =================================================

    normalized.dailyLimit =
      clampInteger(
        raw.dailyLimit ??
          raw.dailyCaptchaLimit,
        CAPTCHA_SETTINGS_LIMITS.minDailyLimit,
        CAPTCHA_SETTINGS_LIMITS.maxDailyLimit,
        defaults.dailyLimit
      );

    // =================================================
    // REWARD
    // =================================================

    normalized.rewardAmount =
      clampNumber(
        raw.rewardAmount ??
          raw.captchaReward,
        CAPTCHA_SETTINGS_LIMITS.minRewardAmount,
        CAPTCHA_SETTINGS_LIMITS.maxRewardAmount,
        defaults.rewardAmount
      );

    normalized.rewardAmount =
      Number(
        normalized.rewardAmount.toFixed(
          2
        )
      );

    // =================================================
    // MAX ATTEMPTS
    // =================================================

    normalized.maxAttempts =
      clampInteger(
        raw.maxAttempts,
        CAPTCHA_SETTINGS_LIMITS.minMaxAttempts,
        CAPTCHA_SETTINGS_LIMITS.maxMaxAttempts,
        defaults.maxAttempts
      );

    // =================================================
    // REFRESH SETTINGS
    // =================================================

    normalized.refreshAfterSuccess =
      normalizeSettingBoolean(
        raw.refreshAfterSuccess,
        defaults.refreshAfterSuccess
      );

    normalized.refreshAfterWrongAnswer =
      normalizeSettingBoolean(
        raw.refreshAfterWrongAnswer,
        defaults.refreshAfterWrongAnswer
      );

    // =================================================
    // IMAGE SETTINGS
    // =================================================

    const rawImage =
      raw.image &&
      typeof raw.image === "object"
        ? raw.image
        : {};

    normalized.image = {
      width:
        clampInteger(
          rawImage.width,
          CAPTCHA_SETTINGS_LIMITS.minImageWidth,
          CAPTCHA_SETTINGS_LIMITS.maxImageWidth,
          defaults.image.width
        ),

      height:
        clampInteger(
          rawImage.height,
          CAPTCHA_SETTINGS_LIMITS.minImageHeight,
          CAPTCHA_SETTINGS_LIMITS.maxImageHeight,
          defaults.image.height
        ),

      fontSize:
        clampInteger(
          rawImage.fontSize,
          CAPTCHA_SETTINGS_LIMITS.minImageFontSize,
          CAPTCHA_SETTINGS_LIMITS.maxImageFontSize,
          defaults.image.fontSize
        ),

      noiseLevel:
        clampInteger(
          rawImage.noiseLevel,
          CAPTCHA_SETTINGS_LIMITS.minNoiseLevel,
          CAPTCHA_SETTINGS_LIMITS.maxNoiseLevel,
          defaults.image.noiseLevel
        ),

      lineCount:
        clampInteger(
          rawImage.lineCount,
          CAPTCHA_SETTINGS_LIMITS.minLineCount,
          CAPTCHA_SETTINGS_LIMITS.maxLineCount,
          defaults.image.lineCount
        ),

      distortionLevel:
        clampInteger(
          rawImage.distortionLevel,
          CAPTCHA_SETTINGS_LIMITS.minDistortionLevel,
          CAPTCHA_SETTINGS_LIMITS.maxDistortionLevel,
          defaults.image.distortionLevel
        ),

      letterSpacing:
        clampInteger(
          rawImage.letterSpacing,
          CAPTCHA_SETTINGS_LIMITS.minLetterSpacing,
          CAPTCHA_SETTINGS_LIMITS.maxLetterSpacing,
          defaults.image.letterSpacing
        ),

      backgroundStyle:
        String(
          rawImage.backgroundStyle ??
            defaults.image.backgroundStyle
        )
          .trim()
          .toLowerCase(),
    };

    // =================================================
    // BACKGROUND VALIDATION
    // =================================================

    const allowedBackgroundStyles = [
      "light",
      "white",
      "gray",
      "gradient",
      "random",
    ];

    if (
      !allowedBackgroundStyles.includes(
        normalized.image.backgroundStyle
      )
    ) {
      return {
        error:
          "Invalid CAPTCHA image background style.",
      };
    }

    // =================================================
    // KEEP LEGACY SETTINGS IN SYNC
    // =================================================

    normalized.captchaLength =
      normalized.length;

    normalized.captchaReward =
      normalized.rewardAmount;

    normalized.dailyCaptchaLimit =
      normalized.dailyLimit;

    return {
      settings:
        normalized,
    };
  };

// =====================================================
// READ CAPTCHA SETTINGS FROM DATABASE
// =====================================================

const loadCaptchaSettings =
  async () => {
    let siteContent =
      await SiteContent.findOne({
        key: "main",
      });

    // =================================================
    // CREATE CMS DOCUMENT IF MISSING
    // =================================================

    if (!siteContent) {
      siteContent =
        new SiteContent({
          key: "main",

          isActive: true,

          settings:
            createDefaultCaptchaSettings(),
        });

      await siteContent.save();
    }

    // =================================================
    // CONVERT MONGOOSE SUBDOCUMENT
    // =================================================

    const currentSettings =
      siteContent.settings
        ? typeof siteContent.settings.toObject ===
          "function"
          ? siteContent.settings.toObject()
          : siteContent.settings
        : {};

    // =================================================
    // NORMALIZE STORED SETTINGS
    // =================================================

    const result =
      buildCaptchaSettings(
        currentSettings
      );

    if (
      result.error
    ) {
      console.error(
        "❌ Invalid stored CAPTCHA settings:",
        result.error
      );

      return {
        siteContent,

        settings:
          createDefaultCaptchaSettings(),
      };
    }

    return {
      siteContent,

      settings:
        result.settings,
    };
  };

// =====================================================
// GET CAPTCHA SETTINGS
// =====================================================
//
// GET /api/admin/captcha/settings
// =====================================================

export const getCaptchaSettings =
  async (
    req,
    res
  ) => {
    try {
      const {
        siteContent,
        settings,
      } =
        await loadCaptchaSettings();

      return res.json({
        success: true,

        enabled:
          settings.enabled,

        settings,

        // ------------------------------------------------
        // Backward-compatible response
        // ------------------------------------------------

        captchaSettings:
          settings,

        siteContent: {
          _id:
            siteContent._id,

          key:
            siteContent.key,

          isActive:
            siteContent.isActive,

          settings,
        },
      });
    } catch (error) {
      console.error(
        "❌ Get admin CAPTCHA settings error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch CAPTCHA settings.",
      });
    }
  };

// =====================================================
// UPDATE CAPTCHA SETTINGS
// =====================================================
//
// PUT /api/admin/captcha/settings
//
// Supports:
//
// {
//   "settings": {
//     ...
//   }
// }
//
// and:
//
// {
//   "enabled": true,
//   "captchaType": "mixed"
// }
// =====================================================

export const updateCaptchaSettings =
  async (
    req,
    res
  ) => {
    try {
      // -------------------------------------------------
      // EXISTING
      // -------------------------------------------------

      const existing =
        await loadCaptchaSettings();

      const siteContent =
        existing.siteContent;

      const currentSettings =
        existing.settings;

      // -------------------------------------------------
      // REQUEST FORMAT
      // -------------------------------------------------

      const incoming =
        req.body?.settings &&
        typeof req.body.settings ===
          "object"
          ? req.body.settings
          : req.body || {};

      // -------------------------------------------------
      // MERGE
      // -------------------------------------------------

      const mergedSettings = {
        ...currentSettings,

        ...incoming,

        image: {
          ...(currentSettings.image ||
            {}),

          ...(incoming.image ||
            {}),
        },
      };

      // -------------------------------------------------
      // VALIDATE
      // -------------------------------------------------

      const result =
        buildCaptchaSettings(
          mergedSettings
        );

      if (
        result.error
      ) {
        return res.status(400).json({
          success: false,

          message:
            result.error,
        });
      }

      const settings =
        result.settings;

      // -------------------------------------------------
      // SAVE
      // -------------------------------------------------

      siteContent.settings =
        settings;

      await siteContent.save();

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.json({
        success: true,

        message:
          "CAPTCHA settings updated successfully.",

        enabled:
          settings.enabled,

        settings,

        captchaSettings:
          settings,

        siteContent: {
          _id:
            siteContent._id,

          key:
            siteContent.key,

          isActive:
            siteContent.isActive,

          settings,
        },
      });
    } catch (error) {
      console.error(
        "❌ Update admin CAPTCHA settings error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to update CAPTCHA settings.",
      });
    }
  };

// =====================================================
// CAPTCHA STATISTICS - ALL CUSTOMERS
// =====================================================

export const getCaptchaStats =
  async (
    req,
    res
  ) => {
    try {
      const today =
        getTodayDateKey();

      const [
        totalAttempts,
        totalCorrect,
        totalWrong,
        totalCaptchaEarningsResult,
        todayAttempts,
        todayCorrect,
        todayWrong,
      ] =
        await Promise.all([
          // -----------------------------------------------
          // ALL ATTEMPTS
          // -----------------------------------------------

          CaptchaAttempt.countDocuments(
            {}
          ),

          // -----------------------------------------------
          // CORRECT
          // -----------------------------------------------

          CaptchaAttempt.countDocuments(
            CORRECT
          ),

          // -----------------------------------------------
          // WRONG
          // -----------------------------------------------

          CaptchaAttempt.countDocuments(
            WRONG
          ),

          // -----------------------------------------------
          // TOTAL WALLET CAPTCHA EARNINGS
          // -----------------------------------------------

          Wallet.aggregate([
            {
              $group: {
                _id: null,

                total: {
                  $sum:
                    "$captchaEarnings",
                },
              },
            },
          ]),

          // -----------------------------------------------
          // TODAY ATTEMPTS
          // -----------------------------------------------

          CaptchaAttempt.countDocuments(
            {
              attemptDate:
                today,
            }
          ),

          // -----------------------------------------------
          // TODAY CORRECT
          // -----------------------------------------------

          CaptchaAttempt.countDocuments(
            {
              attemptDate:
                today,

              ...CORRECT,
            }
          ),

          // -----------------------------------------------
          // TODAY WRONG
          // -----------------------------------------------

          CaptchaAttempt.countDocuments(
            {
              attemptDate:
                today,

              ...WRONG,
            }
          ),
        ]);

      const accuracy =
        calcAccuracy(
          totalCorrect,
          totalAttempts
        );

      // =================================================
      // CUSTOMERS
      // =================================================

      const users =
        await User.find(
          customerFilter
        )
          .select(
            "_id memberId userCode name email status"
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      const userIds =
        users.map(
          (user) =>
            user._id
        );

      // =================================================
      // CUSTOMER ATTEMPTS
      // =================================================

      const customerAttempts =
        userIds.length > 0
          ? await CaptchaAttempt.aggregate([
              {
                $match: {
                  userId: {
                    $in:
                      userIds,
                  },
                },
              },

              {
                $group: {
                  _id:
                    "$userId",

                  totalAttempts: {
                    $sum: 1,
                  },

                  correctAttempts: {
                    $sum: {
                      $cond: [
                        {
                          $eq: [
                            "$result",
                            "correct",
                          ],
                        },

                        1,

                        0,
                      ],
                    },
                  },

                  wrongAttempts: {
                    $sum: {
                      $cond: [
                        {
                          $eq: [
                            "$result",
                            "wrong",
                          ],
                        },

                        1,

                        0,
                      ],
                    },
                  },
                },
              },
            ])
          : [];

      // =================================================
      // CUSTOMER WALLETS
      // =================================================

      const wallets =
        userIds.length > 0
          ? await Wallet.find({
              userId: {
                $in:
                  userIds,
              },
            })
              .select(
                "userId captchaEarnings todayCaptchasSolved"
              )
              .lean()
          : [];

      // =================================================
      // MAPS
      // =================================================

      const attemptMap =
        new Map(
          customerAttempts.map(
            (item) => [
              String(
                item._id
              ),
              item,
            ]
          )
        );

      const walletMap =
        new Map(
          wallets.map(
            (wallet) => [
              String(
                wallet.userId
              ),
              wallet,
            ]
          )
        );

      // =================================================
      // CUSTOMER RESPONSE
      // =================================================

      const customers =
        users.map(
          (user) => {
            const attempt =
              attemptMap.get(
                String(
                  user._id
                )
              );

            const wallet =
              walletMap.get(
                String(
                  user._id
                )
              );

            const total =
              Number(
                attempt?.totalAttempts ||
                  0
              );

            const correct =
              Number(
                attempt?.correctAttempts ||
                  0
              );

            const wrong =
              Number(
                attempt?.wrongAttempts ||
                  0
              );

            return {
              _id:
                user._id,

              memberId:
                user.memberId ||
                user.userCode ||
                "-",

              name:
                user.name,

              email:
                user.email,

              status:
                user.status,

              totalAttempts:
                total,

              correctAttempts:
                correct,

              wrongAttempts:
                wrong,

              accuracy:
                calcAccuracy(
                  correct,
                  total
                ),

              captchaEarnings:
                toNumber(
                  wallet?.captchaEarnings,
                  0
                ),

              todayCaptchasSolved:
                toNumber(
                  wallet?.todayCaptchasSolved,
                  0
                ),
            };
          }
        );

      // =================================================
      // RESPONSE
      // =================================================

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

          totalCaptchaEarnings:
            toNumber(
              totalCaptchaEarningsResult[0]
                ?.total,
              0
            ),
        },

        customers,
      });
    } catch (error) {
      console.error(
        "❌ Get captcha stats error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch captcha statistics.",
      });
    }
  };

// =====================================================
// CAPTCHA STATISTICS - SINGLE CUSTOMER
// =====================================================

export const getCustomerCaptchaStats =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } =
        req.params;

      // =================================================
      // CUSTOMER
      // =================================================

      const user =
        await findCustomerByIdentifier(
          id
        );

      if (!user) {
        return res.status(404).json({
          success: false,

          message:
            "Customer not found.",
        });
      }

      const today =
        getTodayDateKey();

      // =================================================
      // SUMMARY
      // =================================================

      const [
        totalAttempts,
        totalCorrect,
        totalWrong,
        todayAttempts,
        todayCorrect,
        todayWrong,
        wallet,
      ] =
        await Promise.all([
          // ---------------------------------------------
          // ALL
          // ---------------------------------------------

          CaptchaAttempt.countDocuments(
            {
              userId:
                user._id,
            }
          ),

          // ---------------------------------------------
          // CORRECT
          // ---------------------------------------------

          CaptchaAttempt.countDocuments(
            {
              userId:
                user._id,

              ...CORRECT,
            }
          ),

          // ---------------------------------------------
          // WRONG
          // ---------------------------------------------

          CaptchaAttempt.countDocuments(
            {
              userId:
                user._id,

              ...WRONG,
            }
          ),

          // ---------------------------------------------
          // TODAY ALL
          // ---------------------------------------------

          CaptchaAttempt.countDocuments(
            {
              userId:
                user._id,

              attemptDate:
                today,
            }
          ),

          // ---------------------------------------------
          // TODAY CORRECT
          // ---------------------------------------------

          CaptchaAttempt.countDocuments(
            {
              userId:
                user._id,

              attemptDate:
                today,

              ...CORRECT,
            }
          ),

          // ---------------------------------------------
          // TODAY WRONG
          // ---------------------------------------------

          CaptchaAttempt.countDocuments(
            {
              userId:
                user._id,

              attemptDate:
                today,

              ...WRONG,
            }
          ),

          // ---------------------------------------------
          // WALLET
          // ---------------------------------------------

          Wallet.findOne({
            userId:
              user._id,
          }).lean(),
        ]);

      // =================================================
      // RECENT ATTEMPTS
      // =================================================

      const attempts =
        await CaptchaAttempt.find({
          userId:
            user._id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(100)
          .lean();

      // =================================================
      // RESPONSE
      // =================================================

      return res.json({
        success: true,

        customer: {
          _id:
            user._id,

          memberId:
            user.memberId ||
            user.userCode ||
            "-",

          name:
            user.name,

          email:
            user.email,

          phone:
            user.phone,

          status:
            user.status,

          userType:
            user.userType,

          createdAt:
            user.createdAt,
        },

        stats: {
          totalAttempts,

          totalCorrect,

          totalWrong,

          accuracy:
            calcAccuracy(
              totalCorrect,
              totalAttempts
            ),

          todayAttempts,

          todayCorrect,

          todayWrong,

          captchaEarnings:
            toNumber(
              wallet?.captchaEarnings,
              0
            ),

          todayCaptchasSolved:
            toNumber(
              wallet?.todayCaptchasSolved,
              0
            ),

          currentBalance:
            toNumber(
              wallet?.currentBalance,
              0
            ),
        },

        attempts,
      });
    } catch (error) {
      console.error(
        "❌ Get customer captcha stats error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch customer captcha statistics.",
      });
    }
  };