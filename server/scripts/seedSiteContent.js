import "dotenv/config";
import connectDB from "../config/db.js";
import { SiteContent } from "../models/SiteContent.js";

const seedSiteContent = async () => {
  try {
    await connectDB();

    const existing = await SiteContent.findOne({ key: "main" });

    if (existing) {
      console.log("✅ Site content already exists.");
      console.log(existing);
      process.exit(0);
    }

    const siteContent = await SiteContent.create({
      key: "main",

      captchaReward: 0.5,
      dailyCaptchaLimit: 50,

      tdsRateWithPan: 5,
      tdsRateNoPan: 20,

      adminFeeRate: 5,
      minWithdrawalAmount: 200,
    });

    console.log("✅ Site content created successfully.");
    console.log(siteContent);

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed site content:", error);
    process.exit(1);
  }
};

seedSiteContent();