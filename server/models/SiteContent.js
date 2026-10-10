import mongoose from "mongoose";

// --------------------------------------------------
// PROCESS STEP SCHEMA
// --------------------------------------------------
const processStepSchema = new mongoose.Schema(
  {
    step: {
      type: String,
      default: "",
      trim: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    desc: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

// --------------------------------------------------
// PRODUCT SCHEMA
// --------------------------------------------------
const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: "",
      trim: true,
    },

    name: {
      type: String,
      default: "",
      trim: true,
    },

    tagline: {
      type: String,
      default: "",
      trim: true,
    },

    price: {
      type: String,
      default: "",
      trim: true,
    },

    features: {
      type: [String],
      default: [],
    },

    badge: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

// --------------------------------------------------
// CAPTCHA IMAGE SETTINGS SCHEMA
// --------------------------------------------------
const captchaImageSettingsSchema =
  new mongoose.Schema(
    {
      width: {
        type: Number,
        default: 320,
        min: 120,
        max: 800,
      },

      height: {
        type: Number,
        default: 100,
        min: 50,
        max: 300,
      },

      fontSize: {
        type: Number,
        default: 34,
        min: 12,
        max: 100,
      },

      noiseLevel: {
        type: Number,
        default: 2,
        min: 0,
        max: 20,
      },

      lineCount: {
        type: Number,
        default: 2,
        min: 0,
        max: 20,
      },

      distortionLevel: {
        type: Number,
        default: 2,
        min: 0,
        max: 10,
      },

      letterSpacing: {
        type: Number,
        default: 8,
        min: 0,
        max: 30,
      },

      backgroundStyle: {
        type: String,
        enum: [
          "light",
          "white",
          "gray",
          "gradient",
          "random",
        ],
        default: "light",
      },
    },
    { _id: false }
  );

// --------------------------------------------------
// SETTINGS SCHEMA
// --------------------------------------------------
const settingsSchema =
  new mongoose.Schema(
    {
      // ==================================================
      // NEW CAPTCHA SETTINGS
      // ==================================================

      enabled: {
        type: Boolean,
        default: true,
      },

      captchaType: {
        type: String,
        enum: [
          "text",
          "mixed",
          "image",
        ],
        default: "mixed",
      },

      length: {
        type: Number,
        default: 6,
        min: 4,
        max: 32,
      },

      includeLowercase: {
        type: Boolean,
        default: true,
      },

      includeUppercase: {
        type: Boolean,
        default: true,
      },

      includeNumbers: {
        type: Boolean,
        default: true,
      },

      includeSymbols: {
        type: Boolean,
        default: false,
      },

      symbols: {
        type: String,
        default: "@#$%^&*",
        trim: true,
      },

      caseSensitive: {
        type: Boolean,
        default: true,
      },

      expirySeconds: {
        type: Number,
        default: 10,
        min: 1,
        max: 3600,
      },

      submitCooldownSeconds: {
        type: Number,
        default: 10,
        min: 0,
        max: 3600,
      },

      dailyLimit: {
        type: Number,
        default: 50,
        min: 0,
        max: 100000,
      },

      rewardAmount: {
        type: Number,
        default: 0.5,
        min: 0,
      },

      maxAttempts: {
        type: Number,
        default: 5,
        min: 1,
        max: 100,
      },

      refreshAfterSuccess: {
        type: Boolean,
        default: true,
      },

      refreshAfterWrongAnswer: {
        type: Boolean,
        default: true,
      },

      image: {
        type: captchaImageSettingsSchema,
        default: () => ({
          width: 320,
          height: 100,
          fontSize: 34,
          noiseLevel: 2,
          lineCount: 2,
          distortionLevel: 2,
          letterSpacing: 8,
          backgroundStyle: "light",
        }),
      },

      // ==================================================
      // LEGACY CAPTCHA SETTINGS
      //
      // Keep these fields for backward compatibility
      // with existing customer CAPTCHA + wallet code.
      // ==================================================

      captchaLength: {
        type: Number,
        default: 6,
        min: 4,
        max: 32,
      },

      captchaReward: {
        type: Number,
        default: 0.5,
        min: 0,
      },

      dailyCaptchaLimit: {
        type: Number,
        default: 50,
        min: 0,
      },

      // ==================================================
      // TAX SETTINGS
      // ==================================================

      tdsRateWithPan: {
        type: Number,
        default: 5,
        min: 0,
        max: 100,
      },

      tdsRateNoPan: {
        type: Number,
        default: 20,
        min: 0,
        max: 100,
      },

      adminFeeRate: {
        type: Number,
        default: 5,
        min: 0,
        max: 100,
      },

      minWithdrawalAmount: {
        type: Number,
        default: 200,
        min: 0,
      },
    },
    { _id: false }
  );

// --------------------------------------------------
// SITE CONTENT SCHEMA
// --------------------------------------------------
const siteContentSchema =
  new mongoose.Schema(
    {
      // --------------------------------------------------
      // SINGLE CMS DOCUMENT
      // --------------------------------------------------
      key: {
        type: String,
        default: "main",
        unique: true,
        index: true,
        immutable: true,
      },

      isActive: {
        type: Boolean,
        default: true,
      },

      // --------------------------------------------------
      // GLOBAL HEADER & CONTACT
      // --------------------------------------------------
      topBarText: {
        type: String,
        default:
          "Welcome to DIGITAL LYF PVT. LTD. Wellness & Rewards Network",
        trim: true,
      },

      supportPhone: {
        type: String,
        default: "+91 8459949190",
        trim: true,
      },

      supportEmail: {
        type: String,
        default: "contact@digitallife@gmail.com",
        lowercase: true,
        trim: true,
      },

      workingHours: {
        type: String,
        default: "Mon - Sat: 9:00 AM - 6:00 PM",
        trim: true,
      },

      officeAddress: {
        type: String,
        default: "Sangamner, City Center Mall",
        trim: true,
      },

      // --------------------------------------------------
      // HERO SECTION
      // --------------------------------------------------
      heroBadge: {
        type: String,
        default:
          "India's #1 Smart Wellness & Direct Reward Community",
        trim: true,
      },

      heroTitle: {
        type: String,
        default:
          "Elevate Your Health, Build Financial Freedom",
        trim: true,
      },

      heroSubtitle: {
        type: String,
        default:
          "Experience next-generation Bio-Magnetic healthcare solutions while unlocking daily digital earnings through genuine referrals and micro-tasks.",
        trim: true,
      },

      heroCtaText: {
        type: String,
        default: "Get Started Now",
        trim: true,
      },

      // --------------------------------------------------
      // ABOUT SECTION
      // --------------------------------------------------
      aboutTitle: {
        type: String,
        default: "Welcome to DIGITAL LYF PVT. LTD.",
        trim: true,
      },

      aboutDescription: {
        type: String,
        default:
          "DIGITAL LYF PVT. LTD. is an emerging provider of advanced bio-magnetic health products and direct community marketing. We bridge holistic wellness with sustainable digital micro-earnings.",
        trim: true,
      },

      missionStatement: {
        type: String,
        default:
          "To empower every family across India with drug-free magnetic health therapy and transparent, rewarding affiliate career opportunities.",
        trim: true,
      },

      // --------------------------------------------------
      // 4-STEP WORKING PROCESS
      // --------------------------------------------------
      processSteps: {
        type: [processStepSchema],
        default: [
          {
            step: "01",
            title: "Join & Activate",
            desc:
              "Register with your sponsor ID and get instant access to your digital wellness workstation.",
          },
          {
            step: "02",
            title: "Daily Tasks & Referrals",
            desc:
              "Solve daily verification captchas to earn instant wallet credits and invite friends.",
          },
          {
            step: "03",
            title: "Genealogy Growth",
            desc:
              "Watch your chain network expand in real-time with automated multi-tier commissions.",
          },
          {
            step: "04",
            title: "Instant TDS Payouts",
            desc:
              "Request swift withdrawals directly to your bank account or UPI with compliant TDS deductions.",
          },
        ],
      },

      // --------------------------------------------------
      // PRODUCTS
      // --------------------------------------------------
      products: {
        type: [productSchema],
        default: [
          {
            id: "prod-1",
            name:
              "Bio-Magnetic Healthcare Mattress Pad (Single & Double)",
            tagline:
              "Natural Pain Relief & Deep Sleep Therapy",
            price: "₹7,499",
            features: [
              "Neodymium High-Gauss Magnets",
              "Orthopedic Memory Foam",
              "Acupressure Micro-Nodes",
              "100% Breathable Bamboo Fabric",
            ],
            badge: "Bestseller",
          },

          {
            id: "prod-2",
            name:
              "Bio-Magnetic Ergonomic Pillow Pad",
            tagline:
              "Cervical & Neck Pain Relief",
            price: "₹2,499",
            features: [
              "Targeted Magnetic Alignment",
              "Anti-Snore Ergonomic Contour",
              "Washable Antimicrobial Cover",
            ],
            badge: "Popular",
          },

          {
            id: "prod-3",
            name:
              "Magnetic Resonance Energy Water Wand",
            tagline:
              "Cellular Hydration & Alkaline Ionization",
            price: "₹1,899",
            features: [
              "Restores Water Bio-Structure",
              "Food Grade SS304 Steel",
              "Instant Magnetized Hydration",
            ],
            badge: "Essential",
          },
        ],
      },

      // --------------------------------------------------
      // EARNING / CAPTCHA / TAX / WITHDRAWAL SETTINGS
      // --------------------------------------------------
      settings: {
        type: settingsSchema,

        default: () => ({
          // NEW CAPTCHA SETTINGS
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

          // LEGACY CAPTCHA SETTINGS
          captchaLength: 6,
          captchaReward: 0.5,
          dailyCaptchaLimit: 50,

          // TAX / WITHDRAWAL
          tdsRateWithPan: 5,
          tdsRateNoPan: 20,
          adminFeeRate: 5,
          minWithdrawalAmount: 200,
        }),
      },
    },
    {
      timestamps: true,
    }
  );

// --------------------------------------------------
// INDEXES
// --------------------------------------------------
siteContentSchema.index({
  isActive: 1,
});

// --------------------------------------------------
// MODEL
// --------------------------------------------------
const SiteContent =
  mongoose.models.SiteContent ||
  mongoose.model(
    "SiteContent",
    siteContentSchema
  );

export { SiteContent };

export default SiteContent;