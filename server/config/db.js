import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error(
        "MONGO_URI is not defined in the .env file."
      );
    }

    const connection = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      `✅ MongoDB connected: ${connection.connection.host}`
    );

    console.log(
      `🗄️ Database: ${connection.connection.name}`
    );

    return connection;
  } catch (error) {
    console.error("");
    console.error("❌ MongoDB connection failed.");
    console.error(`Reason: ${error.message}`);
    console.error("");

    throw error;
  }
};

export default connectDB;