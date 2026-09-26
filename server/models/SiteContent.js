import mongoose from 'mongoose';

const siteContentSchema = new mongoose.Schema({
  // Global Header & Contact
  topBarText: { type: String, default: "Welcome to Samarth India Wellness & Rewards Network" },
  supportPhone: { type: String, default: "+91 98765 43210" },
  supportEmail: { type: String, default: "contact@samarthindia.com" },
  workingHours: { type: String, default: "Mon - Sat: 9:00 AM - 6:00 PM" },
  officeAddress: { type: String, default: "Ganga Shopping Mall, 2nd Floor, Main Agra Road, Dausa, Rajasthan 303303" },

  // Hero Section
  heroBadge: { type: String, default: "India's #1 Smart Wellness & Direct Reward Community" },
  heroTitle: { type: String, default: "Elevate Your Health, Build Financial Freedom" },
  heroSubtitle: { type: String, default: "Experience next-generation Bio-Magnetic healthcare solutions while unlocking daily digital earnings through genuine referrals and micro-tasks." },
  heroCtaText: { type: String, default: "Get Started Now" },

  // About Section
  aboutTitle: { type: String, default: "Welcome to Samarth India" },
  aboutDescription: { type: String, default: "Samarth India is an emerging provider of advanced bio-magnetic health products and direct community marketing. We bridge holistic wellness with sustainable digital micro-earnings." },
  missionStatement: { type: String, default: "To empower every family across India with drug-free magnetic health therapy and transparent, rewarding affiliate career opportunities." },

  // 4-Step Working Process
  processSteps: {
    type: Array,
    default: [
      { step: "01", title: "Join & Activate", desc: "Register with your sponsor ID and get instant access to your digital wellness workstation." },
      { step: "02", title: "Daily Tasks & Referrals", desc: "Solve daily verification captchas to earn instant wallet credits and invite friends." },
      { step: "03", title: "Genealogy Growth", desc: "Watch your chain network expand in real-time with automated multi-tier commissions." },
      { step: "04", title: "Instant TDS Payouts", desc: "Request swift withdrawals directly to your bank account or UPI with 100% compliant TDS deductions." }
    ]
  },

  // Products Showcase
  products: {
    type: Array,
    default: [
      {
        id: "prod-1",
        name: "Bio-Magnetic Healthcare Mattress Pad (Single & Double)",
        tagline: "Natural Pain Relief & Deep Sleep Therapy",
        price: "₹7,499",
        features: ["Neodymium High-Gauss Magnets", "Orthopedic Memory Foam", "Acupressure Micro-Nodes", "100% Breathable Bamboo Fabric"],
        badge: "Bestseller"
      },
      {
        id: "prod-2",
        name: "Bio-Magnetic Ergonomic Pillow Pad",
        tagline: "Cervical & Neck Pain Relief",
        price: "₹2,499",
        features: ["Targeted Magnetic Alignment", "Anti-Snore Ergonomic Contour", "Washable Antimicrobial Cover"],
        badge: "Popular"
      },
      {
        id: "prod-3",
        name: "Magnetic Resonance Energy Water Wand",
        tagline: "Cellular Hydration & Alkaline Ionization",
        price: "₹1,899",
        features: ["Restores Water Bio-Structure", "Food Grade SS304 Steel", "Instant Magnetized Hydration"],
        badge: "Essential"
      }
    ]
  },

  // Earning & Tax Parameters
  settings: {
    captchaReward: { type: Number, default: 0.50 },
    dailyCaptchaLimit: { type: Number, default: 50 },
    tdsRateWithPan: { type: Number, default: 5.0 },
    tdsRateNoPan: { type: Number, default: 20.0 },
    adminFeeRate: { type: Number, default: 5.0 },
    minWithdrawalAmount: { type: Number, default: 200 }
  }
}, {
  timestamps: true
});

export const SiteContent = mongoose.model('SiteContent', siteContentSchema);
