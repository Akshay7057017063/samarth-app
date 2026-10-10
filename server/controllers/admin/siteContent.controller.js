import { SiteContent } from "../../models/SiteContent.js";
import { DEFAULT_SITE_SETTINGS } from "../../utils/adminHelpers.js";

// =====================================================
// GET SITE CONTENT
// =====================================================

export const getSiteContent = async (req, res) => {
  try {
    let siteContent = await SiteContent.findOne({ key: "main" }).lean();

    if (!siteContent) {
      const created = await SiteContent.create({
        key: "main",
        isActive: true,
        settings: { ...DEFAULT_SITE_SETTINGS },
      });

      siteContent = created.toObject();
    }

    const stored = siteContent.settings || {};

    const settings = { ...stored };

    for (const [key, defaultValue] of Object.entries(
      DEFAULT_SITE_SETTINGS
    )) {
      settings[key] = Number(stored[key] ?? defaultValue);
    }

    return res.json({
      success: true,
      siteContent: {
        ...siteContent,
        settings,
      },
    });
  } catch (error) {
    console.error("❌ Get site content error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch site content.",
    });
  }
};

// =====================================================
// UPDATE SITE CONTENT
// =====================================================

const ALLOWED_TOP_LEVEL_FIELDS = [
  "hero",
  "about",
  "contact",
  "footer",
  "socialLinks",
  "processSteps",
  "products",
  "faq",
  "seo",
  "branding",
  "navigation",
];

// Direct fields that actually exist in SiteContent schema
const ALLOWED_DIRECT_FIELDS = [
  "topBarText",
  "supportPhone",
  "supportEmail",
  "workingHours",
  "officeAddress",
  "heroBadge",
  "heroTitle",
  "heroSubtitle",
  "heroCtaText",
  "aboutTitle",
  "aboutDescription",
  "missionStatement",
  "processSteps",
  "products",
];

// =====================================================
// UPDATE SITE CONTENT
// =====================================================

export const updateSiteContent = async (req, res) => {
  try {
    let siteContent = await SiteContent.findOne({
      key: "main",
    });

    if (!siteContent) {
      siteContent = new SiteContent({
        key: "main",
        isActive: true,
      });
    }

    // -------------------------------------------------
    // DIRECT SCHEMA FIELDS
    // -------------------------------------------------

    for (const field of ALLOWED_DIRECT_FIELDS) {
      if (req.body[field] !== undefined) {
        siteContent[field] = req.body[field];
      }
    }

    // -------------------------------------------------
    // LEGACY / NESTED TOP-LEVEL CONTENT
    // -------------------------------------------------

    for (const field of ALLOWED_TOP_LEVEL_FIELDS) {
      if (req.body[field] !== undefined) {
        siteContent[field] = req.body[field];
      }
    }

    // -------------------------------------------------
    // CONTACT / FOOTER SUPPORT
    // -------------------------------------------------
    // Supports payloads like:
    //
    // {
    //   contact: {
    //     supportPhone: "...",
    //     supportEmail: "...",
    //     workingHours: "...",
    //     officeAddress: "..."
    //   }
    // }
    //
    // OR
    //
    // {
    //   footer: {
    //     supportPhone: "...",
    //     supportEmail: "...",
    //     workingHours: "...",
    //     officeAddress: "..."
    //   }
    // }

    const contact = req.body?.contact || {};
    const footer = req.body?.footer || {};

    const contactSource =
      typeof contact === "object" && contact !== null
        ? contact
        : {};

    const footerSource =
      typeof footer === "object" && footer !== null
        ? footer
        : {};

    // Phone
    if (contactSource.supportPhone !== undefined) {
      siteContent.supportPhone = contactSource.supportPhone;
    }

    if (footerSource.supportPhone !== undefined) {
      siteContent.supportPhone = footerSource.supportPhone;
    }

    // Email
    if (contactSource.supportEmail !== undefined) {
      siteContent.supportEmail = contactSource.supportEmail;
    }

    if (footerSource.supportEmail !== undefined) {
      siteContent.supportEmail = footerSource.supportEmail;
    }

    // Working hours
    if (contactSource.workingHours !== undefined) {
      siteContent.workingHours = contactSource.workingHours;
    }

    if (footerSource.workingHours !== undefined) {
      siteContent.workingHours = footerSource.workingHours;
    }

    // Address
    if (contactSource.officeAddress !== undefined) {
      siteContent.officeAddress = contactSource.officeAddress;
    }

    if (footerSource.officeAddress !== undefined) {
      siteContent.officeAddress = footerSource.officeAddress;
    }

    // -------------------------------------------------
    // ACTIVE STATUS
    // -------------------------------------------------

    if (req.body.isActive !== undefined) {
      siteContent.isActive = Boolean(req.body.isActive);
    }

    // -------------------------------------------------
    // SETTINGS
    // -------------------------------------------------

    const currentSettings = siteContent.settings
      ? siteContent.settings.toObject?.() || siteContent.settings
      : {};

    const incomingSettings = req.body?.settings || {};

    // incoming -> current -> default
    // Invalid values fall back to default.
    const resolveSetting = (key, min = 0) => {
      const fallback = DEFAULT_SITE_SETTINGS[key];

      const value = Number(
        incomingSettings[key] ??
          currentSettings[key] ??
          fallback
      );

      return Number.isFinite(value) && value >= min
        ? value
        : fallback;
    };

    const captchaLength = Math.min(
      10,
      Math.max(
        4,
        Math.floor(
          resolveSetting("captchaLength", -Infinity)
        )
      )
    );

    siteContent.settings = {
      ...currentSettings,
      ...incomingSettings,

      captchaLength,

      captchaReward: resolveSetting(
        "captchaReward"
      ),

      dailyCaptchaLimit: Math.floor(
        resolveSetting("dailyCaptchaLimit", 1)
      ),

      tdsRateWithPan: resolveSetting(
        "tdsRateWithPan"
      ),

      tdsRateNoPan: resolveSetting(
        "tdsRateNoPan"
      ),

      adminFeeRate: resolveSetting(
        "adminFeeRate"
      ),

      minWithdrawalAmount: resolveSetting(
        "minWithdrawalAmount"
      ),
    };

    // -------------------------------------------------
    // SAVE
    // -------------------------------------------------

    await siteContent.save();

    return res.json({
      success: true,
      message: "Site content updated successfully.",
      siteContent,
    });
  } catch (error) {
    console.error(
      "❌ Update site content error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update site content.",
    });
  }
};