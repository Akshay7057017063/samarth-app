import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import captchaRoutes from './routes/captcha.js';
import referralRoutes from './routes/referral.js';
import walletRoutes from './routes/wallet.js';
import cmsRoutes from './routes/cms.js';
import adminRoutes from './routes/admin.js';
import { store } from './dataStore.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/samarth_platform';

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected_mongodb' : 'active_datastore_json',
    activeUsersCount: store.data.users.length
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/captcha', captchaRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/admin', adminRoutes);

// Launch server immediately
app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`🚀 SAMARTH INDIA PLATFORM BACKEND ONLINE`);
  console.log(`🌐 API Server: http://localhost:${PORT}`);
  console.log(`👤 Demo Customer: SI681908 (Mahesh rajendra jondhale)`);
  console.log(`🔑 Demo Password: user123456`);
  console.log(`👑 Master Admin:  admin@samarth.com / admin123456`);
  console.log(`=================================================\n`);
});

// Optional MongoDB connect
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 })
  .then(() => {
    console.log(`✅ Connected to MongoDB at: ${MONGO_URI}`);
  })
  .catch(() => {
    console.log(`ℹ️ Running with persistent local database engine (server/data/database.json). Ready for all operations!`);
  });
