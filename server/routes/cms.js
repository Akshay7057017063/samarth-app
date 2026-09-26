import express from 'express';
import { SiteContent } from '../models/SiteContent.js';
import { store } from '../dataStore.js';
import mongoose from 'mongoose';

const router = express.Router();
const isMongoActive = () => mongoose.connection.readyState === 1;

// GET /api/cms/content (Public)
router.get('/content', async (req, res) => {
  try {
    if (isMongoActive()) {
      let content = await SiteContent.findOne();
      if (content) return res.json({ success: true, content });
    }
    // Return store content
    res.json({ success: true, content: store.data.siteContent });
  } catch (err) {
    res.json({ success: true, content: store.data.siteContent });
  }
});

export default router;
