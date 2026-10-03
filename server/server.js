// =====================================================
// LOAD ENVIRONMENT VARIABLES FIRST
// =====================================================
//
// IMPORTANT:
// dotenv must load before importing modules that read
// process.env during module initialization.
// =====================================================

import "dotenv/config";

// =====================================================
// NODE DNS CONFIGURATION
// =====================================================
//
// On some local PCs Node.js DNS SRV resolution may fail with:
//
//     querySrv ECONNREFUSED
//
// even when Windows nslookup works.
//
// Local development:
//     8.8.8.8
//     1.1.1.1
//
// Production:
//     system DNS is used by default.
//
// Optional .env override:
//
//     DNS_SERVERS=8.8.8.8,1.1.1.1
//
// This does NOT modify your MongoDB URI or Atlas settings.
// =====================================================

import dns from "node:dns";

const isProduction =
  String(
    process.env.NODE_ENV || ""
  ).toLowerCase() === "production";

const customDnsServers =
  process.env.DNS_SERVERS
    ? process.env.DNS_SERVERS
        .split(",")
        .map((server) =>
          server.trim()
        )
        .filter(Boolean)
    : null;

const dnsServers =
  customDnsServers ||
  (!isProduction
    ? ["8.8.8.8", "1.1.1.1"]
    : null);

if (dnsServers?.length) {
  try {
    dns.setServers(
      dnsServers
    );

    console.log(
      "🌐 Node.js DNS servers:",
      dns.getServers()
    );
  } catch (error) {
    console.error(
      "⚠️ Failed to configure Node.js DNS servers:",
      error.message
    );
  }
}

// =====================================================
// CORE MODULES
// =====================================================

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
import binaryRoutes from "./routes/binary.js";

// =====================================================
// LEGACY DATASTORE
// =====================================================
//
// Temporarily kept during migration.
//
// MongoDB/Mongoose is the active database for the main
// application modules.
//
// DO NOT DELETE dataStore.js until the migration is fully
// completed and all legacy dependencies are removed.
// =====================================================

import "./dataStore.js";

// =====================================================
// MONGODB CONNECTION
// =====================================================

import connectDB from "./config/db.js";

// =====================================================
// APP CONFIGURATION
// =====================================================

const app = express();

const PORT =
  Number(process.env.PORT) || 5000;

app.disable("x-powered-by");

// =====================================================
// ENVIRONMENT VALIDATION
// =====================================================

const requiredEnv = [
  "MONGO_URI",
  "JWT_SECRET",
];

const missingEnv =
  requiredEnv.filter(
    (key) =>
      !process.env[key]
  );

if (
  missingEnv.length > 0
) {
  missingEnv.forEach(
    (key) => {
      console.error(
        `❌ ${key} is not defined in the .env file.`
      );
    }
  );

  process.exit(1);
}

// =====================================================
// CORS CONFIGURATION
// =====================================================
//
// Extra origins can be supplied in .env:
//
// CORS_ORIGINS=https://example.com,https://other.com
//
// Authentication uses Authorization Bearer token.
// Cookies are not required.
// =====================================================

const allowedOrigins =
  new Set([
    // ---------------------------------------------------
    // LOCAL DEVELOPMENT
    // ---------------------------------------------------

    "http://localhost:3000",
    "http://127.0.0.1:3000",

    "http://localhost:5173",
    "http://127.0.0.1:5173",

    "http://localhost:5174",
    "http://127.0.0.1:5174",

    // ---------------------------------------------------
    // PRODUCTION CUSTOMER
    // ---------------------------------------------------

    "https://digital-lyf.bull-mark.com",

    // ---------------------------------------------------
    // PRODUCTION ADMIN
    // ---------------------------------------------------

    "https://digital-lyf-admin.bull-mark.com",

    // ---------------------------------------------------
    // OLD ADMIN - TEMPORARY
    // ---------------------------------------------------

    "https://admin.bull-mark.com",

    // ---------------------------------------------------
    // OLD CUSTOMER - TEMPORARY
    // ---------------------------------------------------

    "https://app.bull-mark.com",

    // ---------------------------------------------------
    // VERCEL - TEMPORARY
    // ---------------------------------------------------

    "https://samarth-app-three.vercel.app",

    "https://samarth-bo1ka04k7-akshay-godages-projects.vercel.app",

    // ---------------------------------------------------
    // FROM .env
    // ---------------------------------------------------

    ...(process.env.CORS_ORIGINS || "")
      .split(",")
      .map((origin) =>
        origin.trim()
      )
      .filter(Boolean),
  ]);

// =====================================================
// CORS OPTIONS
// =====================================================

const corsOptions = {
  origin: (
    origin,
    callback
  ) => {
    // Requests without Origin:
    //
    // curl
    // Postman
    // server-to-server
    // health checks

    if (!origin) {
      return callback(
        null,
        true
      );
    }

    if (
      allowedOrigins.has(
        origin
      )
    ) {
      return callback(
        null,
        true
      );
    }

    console.warn(
      `⚠️ CORS blocked origin: ${origin}`
    );

    const error =
      new Error(
        "Not allowed by CORS"
      );

    error.status = 403;

    return callback(
      error
    );
  },

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

  credentials: false,

  optionsSuccessStatus: 204,
};

// =====================================================
// CORS
// =====================================================
//
// IMPORTANT:
// CORS MUST be registered before API routes.
// =====================================================

app.use(
  cors(corsOptions)
);

// =====================================================
// BODY PARSERS
// =====================================================

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
// BASIC SERVER INFORMATION
// =====================================================

app.get(
  "/",
  (req, res) => {
    res.status(200).json({
      success: true,

      message:
        "DIGITAL LYF PVT. LTD. Platform Backend is running.",

      version:
        "1.0.0",

      environment:
        process.env.NODE_ENV ||
        "development",

      health:
        "/api/health",

      api: {
        auth:
          "/api/auth",

        captcha:
          "/api/captcha",

        referral:
          "/api/referral",

        binary:
          "/api/binary",

        wallet:
          "/api/wallet",

        cms:
          "/api/cms",

        admin:
          "/api/admin",
      },
    });
  }
);

// =====================================================
// HEALTH CHECK
// =====================================================
//
// Public endpoint.
//
// Does NOT expose:
// - DB host
// - DB name
// - usernames
// - customer counts
// - credentials
// =====================================================

app.get(
  "/api/health",
  (req, res) => {
    const mongoConnected =
      mongoose.connection
        .readyState === 1;

    return res
      .status(
        mongoConnected
          ? 200
          : 503
      )
      .json({
        success:
          mongoConnected,

        status:
          mongoConnected
            ? "online"
            : "degraded",

        timestamp:
          new Date().toISOString(),

        database:
          mongoConnected
            ? "connected_mongodb"
            : "mongodb_not_connected",

        uptimeSeconds:
          Math.round(
            process.uptime()
          ),
      });
  }
);

// =====================================================
// API ROUTES
// =====================================================

//
// Authentication
//
app.use(
  "/api/auth",
  authRoutes
);

//
// CAPTCHA
//
app.use(
  "/api/captcha",
  captchaRoutes
);

//
// Sponsor / Referral Tree
//
// Examples:
// /api/referral/tree
// /api/referral/directs
//
app.use(
  "/api/referral",
  referralRoutes
);

//
// Wallet
//
app.use(
  "/api/wallet",
  walletRoutes
);

//
// CMS
//
app.use(
  "/api/cms",
  cmsRoutes
);

//
// Admin
//
app.use(
  "/api/admin",
  adminRoutes
);

//
// Binary Tree
//
// Examples:
// /api/binary/tree
// /api/binary/children
// /api/binary/parent
// /api/binary/status
// /api/binary/counts
//
app.use(
  "/api/binary",
  binaryRoutes
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use(
  (req, res) => {
    return res.status(404).json({
      success: false,

      message:
        `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    if (
      res.headersSent
    ) {
      return next(err);
    }

    const statusCode =
      Number(
        err?.status ||
          err?.statusCode ||
          500
      );

    console.error("");

    console.error(
      "================================================="
    );

    console.error(
      "❌ SERVER ERROR"
    );

    console.error(
      "================================================="
    );

    console.error(
      err
    );

    console.error(
      "================================================="
    );

    console.error("");

    // Never expose internal 5xx
    // information in production.

    const message =
      statusCode >= 500 &&
      isProduction
        ? "Internal server error."
        : err?.message ||
          "Internal server error.";

    return res
      .status(statusCode)
      .json({
        success: false,
        message,
      });
  }
);

// =====================================================
// MONGODB CONNECTION EVENTS
// =====================================================

mongoose.connection.on(
  "connected",
  () => {
    console.log(
      "🟢 MongoDB connection established."
    );
  }
);

mongoose.connection.on(
  "error",
  (error) => {
    console.error(
      "🔴 MongoDB connection error:",
      error?.message ||
        error
    );
  }
);

mongoose.connection.on(
  "disconnected",
  () => {
    console.log(
      "🟡 MongoDB disconnected."
    );
  }
);

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

let httpServer =
  null;

let shuttingDown =
  false;

// =====================================================
// SHUTDOWN FUNCTION
// =====================================================

const shutdownServer =
  async (
    signal,
    exitCode = 0
  ) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown =
      true;

    console.log("");

    console.log(
      `🛑 ${signal} received. Shutting down server...`
    );

    // ---------------------------------------------------
    // Force exit if shutdown hangs.
    // ---------------------------------------------------

    const forceExitTimer =
      setTimeout(
        () => {
          console.error(
            "❌ Shutdown timed out. Forcing exit."
          );

          process.exit(1);
        },
        10000
      );

    forceExitTimer.unref();

    try {
      // =================================================
      // 1. STOP HTTP SERVER
      // =================================================

      if (
        httpServer
      ) {
        await new Promise(
          (
            resolve,
            reject
          ) => {
            httpServer.close(
              (
                error
              ) => {
                if (error) {
                  return reject(
                    error
                  );
                }

                resolve();
              }
            );

            // Node.js newer versions
            // support this method.
            httpServer.closeIdleConnections?.();
          }
        );

        console.log(
          "✅ HTTP server closed."
        );
      }

      // =================================================
      // 2. CLOSE MONGODB
      // =================================================

      if (
        mongoose.connection
          .readyState !== 0
      ) {
        await mongoose.connection.close();

        console.log(
          "✅ MongoDB connection closed."
        );
      }

      console.log(
        "✅ Server shutdown completed."
      );

      process.exit(
        exitCode
      );
    } catch (error) {
      console.error(
        "❌ Error during shutdown:",
        error?.message ||
          error
      );

      process.exit(1);
    }
  };

// =====================================================
// SIGNAL HANDLERS
// =====================================================

process.on(
  "SIGINT",
  () =>
    shutdownServer(
      "SIGINT"
    )
);

process.on(
  "SIGTERM",
  () =>
    shutdownServer(
      "SIGTERM"
    )
);

// =====================================================
// UNHANDLED PROMISE REJECTION
// =====================================================

process.on(
  "unhandledRejection",
  (reason) => {
    console.error(
      "❌ Unhandled promise rejection:",
      reason
    );
  }
);

// =====================================================
// UNCAUGHT EXCEPTION
// =====================================================

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "❌ Uncaught exception:",
      error
    );

    shutdownServer(
      "uncaughtException",
      1
    );
  }
);

// =====================================================
// START SERVER
// =====================================================

const startServer =
  async () => {
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

      // =================================================
      // CONNECT TO MONGODB
      // =================================================

      console.log(
        "🔄 Connecting to MongoDB..."
      );

      await connectDB();

      console.log(
        "✅ MongoDB connection successful."
      );

      // =================================================
      // START EXPRESS
      // =================================================

      httpServer =
        app.listen(
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
              `🌐 API Server:   http://localhost:${PORT}`
            );

            console.log(
              `❤️ Health Check: http://localhost:${PORT}/api/health`
            );

            console.log(
              `🗄️ Database:     ${mongoose.connection.name}`
            );

            console.log(
              `🌍 Environment:  ${
                process.env.NODE_ENV ||
                "development"
              }`
            );

            console.log(
              "================================================="
            );

            console.log("");

            // =================================================
            // API ROUTES
            // =================================================

            console.log(
              "📌 API ROUTES"
            );

            console.log(
              "-------------------------------------------------"
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
              `🌳 Binary:    http://localhost:${PORT}/api/binary`
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
              "-------------------------------------------------"
            );

            console.log("");

            // =================================================
            // BINARY ROUTES
            // =================================================

            console.log(
              "🌳 BINARY TREE ENDPOINTS"
            );

            console.log(
              "-------------------------------------------------"
            );

            console.log(
              `GET /api/binary/tree`
            );

            console.log(
              `GET /api/binary/tree?depth=5`
            );

            console.log(
              `GET /api/binary/children`
            );

            console.log(
              `GET /api/binary/parent`
            );

            console.log(
              `GET /api/binary/status`
            );

            console.log(
              `GET /api/binary/counts`
            );

            console.log(
              "-------------------------------------------------"
            );

            console.log("");

            // =================================================
            // DATABASE STATUS
            // =================================================

            console.log(
              "📦 DATABASE MIGRATION STATUS"
            );

            console.log(
              "-------------------------------------------------"
            );

            console.log(
              "MongoDB: CONNECTED"
            );

            console.log(
              "User/Auth, CAPTCHA, Wallet, Referral, Binary, CMS, Admin: MONGODB"
            );

            console.log(
              "Legacy dataStore.js: TEMPORARILY ACTIVE"
            );

            console.log(
              "-------------------------------------------------"
            );

            console.log("");
          }
        );

      // =================================================
      // HTTP SERVER ERROR
      // =================================================

      httpServer.on(
        "error",
        (error) => {
          console.error("");

          console.error(
            "❌ HTTP SERVER ERROR"
          );

          if (
            error?.code ===
            "EADDRINUSE"
          ) {
            console.error(
              `Port ${PORT} is already in use.`
            );

            console.error(
              "Stop the existing Node.js process or use another PORT."
            );
          } else {
            console.error(
              error
            );
          }

          console.error("");

          process.exit(1);
        }
      );
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

      console.error(
        error?.message ||
          error
      );

      console.error(
        "================================================="
      );

      console.error("");

      process.exit(1);
    }
  };

// =====================================================
// START
// =====================================================

startServer();