
// =====================================================
// LOAD ENVIRONMENT VARIABLES FIRST
// =====================================================
//
// IMPORTANT:
// dotenv must load before importing modules that read
// process.env during module initialization.
// =====================================================

import "dotenv/config";

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

// =====================================================
// ROUTES
// =====================================================

import authRoutes from "./routes/auth.js";
import captchaRoutes from "./routes/captcha.js";
import referralRoutes from "./routes/referral.js";
import walletRoutes from "./routes/wallet.js";
import cmsRoutes from "./routes/cms.js";
import adminRoutes from "./routes/adminRoutes.js";

// =====================================================
// LEGACY DATASTORE
// =====================================================
//
// Temporarily kept during migration.
//
// IMPORTANT:
// dataStore.js is no longer the active database.
// Migrated modules use MongoDB.
//
// DO NOT DELETE IT YET.
// =====================================================

import { store } from "./dataStore.js";

// =====================================================
// MONGODB CONNECTION
// =====================================================

import connectDB from "./config/db.js";

// =====================================================
// APP CONFIGURATION
// =====================================================

const app = express();

const PORT = Number(process.env.PORT) || 5000;

// =====================================================
// ENVIRONMENT VALIDATION
// =====================================================

if (!process.env.MONGO_URI) {
  console.error(
    "❌ MONGO_URI is not defined in the .env file."
  );

  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error(
    "❌ JWT_SECRET is not defined in the .env file."
  );

  process.exit(1);
}

// =====================================================
// MIDDLEWARE
// =====================================================

// CORS
app.use(
  cors({
    origin: "*",
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// JSON body parser
app.use(
  express.json({
    limit: "10mb",
  })
);

// URL encoded body parser
app.use(
  express.urlencoded({
    extended: true,
  })
);

// =====================================================
// BASIC SERVER INFORMATION
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "DIGITAL LYF PVT. LTD. Platform Backend is running.",
    version: "1.0.0",
    environment:
      process.env.NODE_ENV || "development",
    health: "/api/health",
  });
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {
  const mongoConnected =
    mongoose.connection.readyState === 1;

  res.status(200).json({
    success: true,
    status: "online",
    timestamp: new Date().toISOString(),

    database: mongoConnected
      ? "connected_mongodb"
      : "mongodb_not_connected",

    mongodb: {
      connected: mongoConnected,
      state: mongoose.connection.readyState,
      databaseName:
        mongoose.connection.name || null,
      host:
        mongoose.connection.host || null,
    },

    // -------------------------------------------------
    // TEMPORARY LEGACY DATASTORE INFORMATION
    // -------------------------------------------------

    legacyDatastore: {
      active: true,
      purpose:
        "Temporary migration compatibility only.",
      activeUsersCount: Array.isArray(
        store?.data?.users
      )
        ? store.data.users.length
        : 0,
    },

    // -------------------------------------------------
    // SERVER INFORMATION
    // -------------------------------------------------

    server: {
      environment:
        process.env.NODE_ENV || "development",
      port: PORT,
    },
  });
});

// =====================================================
// API ROUTES
// =====================================================

// Authentication
app.use("/api/auth", authRoutes);

// CAPTCHA
app.use("/api/captcha", captchaRoutes);

// Referral
app.use("/api/referral", referralRoutes);

// Wallet
app.use("/api/wallet", walletRoutes);

// CMS
app.use("/api/cms", cmsRoutes);

// Admin
app.use("/api/admin", adminRoutes);

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message:
      `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error("");
  console.error(
    "================================================="
  );
  console.error("❌ SERVER ERROR");
  console.error(
    "================================================="
  );
  console.error(err);
  console.error(
    "================================================="
  );
  console.error("");

  const statusCode =
    err.status || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message:
      err.message || "Internal server error.",
  });
});

// =====================================================
// MONGODB CONNECTION EVENTS
// =====================================================

mongoose.connection.on("connected", () => {
  console.log(
    "🟢 MongoDB connection established."
  );
});

mongoose.connection.on("error", (error) => {
  console.error(
    "🔴 MongoDB connection error:",
    error.message
  );
});

mongoose.connection.on("disconnected", () => {
  console.log(
    "🟡 MongoDB disconnected."
  );
});

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

const shutdownServer = async (signal) => {
  console.log("");
  console.log(
    `🛑 ${signal} received. Shutting down server...`
  );

  try {
    await mongoose.connection.close();

    console.log(
      "✅ MongoDB connection closed."
    );

    console.log(
      "✅ Server shutdown completed."
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Error during shutdown:",
      error.message
    );

    process.exit(1);
  }
};

process.on("SIGINT", () => {
  shutdownServer("SIGINT");
});

process.on("SIGTERM", () => {
  shutdownServer("SIGTERM");
});

// =====================================================
// START SERVER
// =====================================================

const startServer = async () => {
  try {
    console.log("");
    console.log(
      "================================================="
    );
    console.log(
      "🚀 STARTING DIGITAL LYF PVT. LTD. PLATFORM"
    );
    console.log(
      "================================================="
    );
    console.log("");

    // -------------------------------------------------
    // CONNECT TO MONGODB
    // -------------------------------------------------

    console.log(
      "🔄 Connecting to MongoDB..."
    );

    await connectDB();

    console.log(
      "✅ MongoDB connection successful."
    );

    // -------------------------------------------------
    // START EXPRESS SERVER
    // -------------------------------------------------

    const server = app.listen(
      PORT,
      () => {
        console.log("");
        console.log(
          "================================================="
        );
        console.log(
          "🚀 DIGITAL LYF PVT. LTD. PLATFORM BACKEND ONLINE"
        );
        console.log(
          "================================================="
        );

        console.log(
          `🌐 API Server: http://localhost:${PORT}`
        );

        console.log(
          `❤️ Health Check: http://localhost:${PORT}/api/health`
        );

        console.log(
          `🗄️ Database: ${mongoose.connection.name}`
        );

        console.log(
          `🌍 Environment: ${
            process.env.NODE_ENV ||
            "development"
          }`
        );

        console.log(
          "================================================="
        );

        console.log("");

        // -------------------------------------------------
        // API ROUTES
        // -------------------------------------------------

        console.log("📌 API ROUTES");

        console.log(
          "-----------------------------------------------"
        );

        console.log(
          `🔐 Auth:      http://localhost:${PORT}/api/auth`
        );

        console.log(
          `🧩 CAPTCHA:   http://localhost:${PORT}/api/captcha`
        );

        console.log(
          `👥 Referral:  http://localhost:${PORT}/api/referral`
        );

        console.log(
          `💰 Wallet:    http://localhost:${PORT}/api/wallet`
        );

        console.log(
          `📄 CMS:       http://localhost:${PORT}/api/cms`
        );

        console.log(
          `👑 Admin:     http://localhost:${PORT}/api/admin`
        );

        console.log(
          "-----------------------------------------------"
        );

        console.log("");

        // -------------------------------------------------
        // DATABASE MIGRATION STATUS
        // -------------------------------------------------

        console.log(
          "📦 DATABASE MIGRATION STATUS"
        );

        console.log(
          "-----------------------------------------------"
        );

        console.log(
          "MongoDB: CONNECTED"
        );

        console.log(
          "User/Auth: MONGODB"
        );

        console.log(
          "CAPTCHA: MONGODB"
        );

        console.log(
          "Wallet: MONGODB"
        );

        console.log(
          "Referral: MONGODB"
        );

        console.log(
          "CMS: MONGODB"
        );

        console.log(
          "Admin: MONGODB"
        );

        console.log(
          "Legacy dataStore.js: TEMPORARILY ACTIVE"
        );

        console.log(
          "-----------------------------------------------"
        );

        console.log("");
      }
    );

    // -------------------------------------------------
    // SERVER ERROR HANDLER
    // -------------------------------------------------

    server.on("error", (error) => {
      console.error("");
      console.error(
        "❌ HTTP SERVER ERROR"
      );
      console.error(error);
      console.error("");

      process.exit(1);
    });
  } catch (error) {
    console.error("");
    console.error(
      "================================================="
    );
    console.error(
      "❌ SERVER STARTUP FAILED"
    );
    console.error(
      "================================================="
    );
    console.error(error.message);
    console.error(
      "================================================="
    );
    console.error("");

    process.exit(1);
  }
};

// =====================================================
// START APPLICATION
// =====================================================

startServer();

