
import dns from "dns";
import dotenv from "dotenv";
import mongoose from "mongoose";

dns.setDefaultResultOrder("ipv4first");

dotenv.config();

console.log("=================================");
console.log("MongoDB Detailed Connection Test");
console.log("=================================");

console.log(
  "MONGO_URI:",
  process.env.MONGO_URI ? "FOUND" : "NOT FOUND"
);

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing.");
  process.exit(1);
}

try {
  console.log("🔄 Connecting to MongoDB Atlas...");
  console.log("🔹 IPv4 forced");
  console.log("🔹 Timeout: 15 seconds");

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 10000,
    family: 4,
  });

  console.log("");
  console.log("=================================");
  console.log("✅ MONGODB CONNECTION SUCCESS");
  console.log("=================================");
  console.log("Host:", mongoose.connection.host);
  console.log("Database:", mongoose.connection.name);
  console.log("Ready State:", mongoose.connection.readyState);

  await mongoose.connection.close();

  console.log("✅ Connection closed.");
  process.exit(0);
} catch (error) {
  console.log("");
  console.log("=================================");
  console.log("❌ MONGODB CONNECTION FAILED");
  console.log("=================================");

  console.log("Error Name:");
  console.log(error.name);

  console.log("");
  console.log("Error Message:");
  console.log(error.message);

  console.log("");
  console.log("Underlying Errors:");
  
  if (error.reason?.servers) {
    for (const [server, details] of error.reason.servers) {
      console.log("");
      console.log("---------------------------------");
      console.log("Server:", server);
      console.log("---------------------------------");

      if (details.error) {
        console.log("Error Type:", details.error.name);
        console.log("Error Message:", details.error.message);

        if (details.error.cause) {
          console.log("Cause:", details.error.cause);
        }

        if (details.error.code) {
          console.log("Code:", details.error.code);
        }

        if (details.error.codeName) {
          console.log("Code Name:", details.error.codeName);
        }
      } else {
        console.log("No underlying error available.");
      }
    }
  }

  console.log("");
  console.log("=================================");
  console.log("END DIAGNOSTIC");
  console.log("=================================");

  process.exit(1);
}

