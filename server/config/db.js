import dns from "node:dns";
import mongoose from "mongoose";

// =====================================================
// DNS CONFIGURATION
// =====================================================
//
// Use public DNS for MongoDB Atlas SRV resolution.
// This affects only this Node.js process.
//
// IMPORTANT:
// server.js also configures DNS. That is okay, but this
// file keeps the setting explicit for database connection.
// =====================================================

dns.setServers(["8.8.8.8", "1.1.1.1"]);

// =====================================================
// MONGODB CONNECTION
// =====================================================

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    // -------------------------------------------------
    // ENV VALIDATION
    // -------------------------------------------------

    if (!mongoURI) {
      throw new Error(
        "MONGO_URI is not defined in the .env file."
      );
    }

    // -------------------------------------------------
    // BASIC URI VALIDATION
    // -------------------------------------------------

    if (
      !mongoURI.startsWith("mongodb://") &&
      !mongoURI.startsWith("mongodb+srv://")
    ) {
      throw new Error(
        "Invalid MONGO_URI. It must start with mongodb:// or mongodb+srv://"
      );
    }

    console.log(
      "🌐 Node.js DNS servers:",
      dns.getServers()
    );

    console.log(
      "🔄 Connecting to MongoDB Atlas..."
    );

    // -------------------------------------------------
    // MONGOOSE CONNECTION
    // -------------------------------------------------
    //
    // family: 4
    // Forces IPv4. This can help on Windows systems where
    // IPv6/network routing causes Atlas connection problems.
    //
    // tls: true
    // Explicitly enables TLS for MongoDB Atlas.
    //
    // serverSelectionTimeoutMS
    // Gives Atlas enough time to select a server.
    //
    // connectTimeoutMS
    // Controls initial TCP connection timeout.
    //
    // socketTimeoutMS
    // Controls inactive socket timeout.
    //
    // retryWrites
    // Safe default for MongoDB Atlas.
    // -------------------------------------------------

    const connection = await mongoose.connect(
      mongoURI,
      {
        family: 4,

        tls: true,

        serverSelectionTimeoutMS: 30000,

        connectTimeoutMS: 30000,

        socketTimeoutMS: 45000,

        retryWrites: true,

        retryReads: true,

        maxPoolSize: 10,

        minPoolSize: 0,
      }
    );

    // -------------------------------------------------
    // SUCCESS
    // -------------------------------------------------

    console.log("");
    console.log(
      "================================================="
    );
    console.log(
      "🟢 MONGODB ATLAS CONNECTED"
    );
    console.log(
      "================================================="
    );

    console.log(
      `🌐 Host:     ${connection.connection.host}`
    );

    console.log(
      `🗄️ Database: ${connection.connection.name}`
    );

    console.log(
      `🔌 ReadyState: ${connection.connection.readyState}`
    );

    console.log(
      "================================================="
    );
    console.log("");

    return connection;
  } catch (error) {
    console.error("");
    console.error(
      "================================================="
    );
    console.error(
      "❌ MONGODB CONNECTION FAILED"
    );
    console.error(
      "================================================="
    );

    console.error(
      "Message:",
      error.message
    );

    if (error.code) {
      console.error(
        "Code:",
        error.code
      );
    }

    if (error.reason) {
      console.error(
        "Reason:",
        error.reason
      );
    }

    console.error(
      "================================================="
    );
    console.error("");

    throw error;
  }
};

// =====================================================
// EXPORT
// =====================================================

export default connectDB;