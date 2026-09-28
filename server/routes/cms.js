
import express from "express";

import { SiteContent } from "../models/SiteContent.js";

const router = express.Router();

// =====================================================
// GET /api/cms/content
// =====================================================
// Public endpoint.
//
// Returns the main website/application CMS content
// from MongoDB.
//
// No authentication is required because this content
// is used by the public/customer frontend.
// =====================================================

router.get(
  "/content",
  async (req, res) => {
    try {
      // -------------------------------------------------
      // FIND MAIN CMS DOCUMENT
      // -------------------------------------------------

      const content =
        await SiteContent.findOne({
          key: "main",
          isActive: true,
        }).lean();

      // -------------------------------------------------
      // CMS DOCUMENT NOT FOUND
      // -------------------------------------------------

      if (!content) {
        return res.status(404).json({
          success: false,
          message:
            "Site content not found.",
        });
      }

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      return res.status(200).json({
        success: true,
        content,
      });
    } catch (error) {
      console.error(
        "❌ CMS CONTENT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load site content.",
      });
    }
  }
);

export default router;

