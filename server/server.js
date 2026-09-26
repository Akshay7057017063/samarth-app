import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import captchaRoutes from "./routes/captcha.js";
import referralRoutes from "./routes/referral.js";
import walletRoutes from "./routes/wallet.js";
import cmsRoutes from "./routes/cms.js";
import adminRoutes from "./routes/adminRoutes.js";

import { store } from "./dataStore.js";

// =====================================================
// LOAD ENVIRONMENT VARIABLES
// =====================================================

dotenv.config();

// =====================================================
// APP CONFIGURATION
// =====================================================

const app = express();

const PORT = process.env.PORT || 5000;

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/samarth_platform";

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: "*",
  })
);

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "online",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1
        ? "connected_mongodb"
        : "active_datastore_json",
    activeUsersCount: store.data.users.length,
  });
});

// =====================================================
// API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

app.use("/api/captcha", captchaRoutes);

app.use("/api/referral", referralRoutes);

app.use("/api/wallet", walletRoutes);

app.use("/api/cms", cmsRoutes);

// Admin API
// All admin routes are handled inside adminRoutes.js
app.use("/api/admin", adminRoutes);

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log("");
  console.log("=================================================");
  console.log("🚀 SAMARTH INDIA PLATFORM BACKEND ONLINE");
  console.log("=================================================");
  console.log(`🌐 API Server: http://localhost:${PORT}`);
  console.log(`❤️ Health Check: http://localhost:${PORT}/api/health`);
  console.log("");

  console.log("👤 Demo Customer: SI681908");
  console.log("🔑 Demo Password: user123456");
  console.log("👑 Master Admin: admin@samarth.com / admin123456");

  console.log("=================================================");
  console.log("");
});

// =====================================================
// OPTIONAL MONGODB CONNECTION
// =====================================================

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 2000,
  })
  .then(() => {
    console.log(`✅ Connected to MongoDB at: ${MONGO_URI}`);
  })
  .catch((error) => {
    console.log("");
    console.log("ℹ️ MongoDB is not available.");
    console.log(
      "📁 Running with persistent local database engine:"
    );
    console.log("   server/data/database.json");
    console.log("✅ All datastore operations remain available.");
    console.log("");
  });