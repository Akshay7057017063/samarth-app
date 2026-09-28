
import mongoose from "mongoose";

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

const settingsSchema = new mongoose.Schema(
  {
    captchaLength: {
      type: Number,
      default: 6,
      min: 4,
      max: 10,
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

const siteContentSchema = new mongoose.Schema(
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
      default: "+91 98765 43210",
      trim: true,
    },

    supportEmail: {
      type: String,
      default: "contact@samarthindia.com",
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
      default:
        "Ganga Shopping Mall, 2nd Floor, Main Agra Road, Dausa, Rajasthan 303303",
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
          name: "Bio-Magnetic Healthcare Mattress Pad (Single & Double)",
          tagline: "Natural Pain Relief & Deep Sleep Therapy",
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
          name: "Bio-Magnetic Ergonomic Pillow Pad",
          tagline: "Cervical & Neck Pain Relief",
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
          name: "Magnetic Resonance Energy Water Wand",
          tagline: "Cellular Hydration & Alkaline Ionization",
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
    // EARNING / TAX / WITHDRAWAL SETTINGS
    // --------------------------------------------------
    settings: {
      type: settingsSchema,
      default: () => ({
        captchaLength: 6,
        captchaReward: 0.5,
        dailyCaptchaLimit: 50,
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

export const SiteContent = mongoose.model(
  "SiteContent",
  siteContentSchema
);

