const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("🔄 [DB] Connecting to MongoDB Atlas...");

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,  // Fail fast if Atlas unreachable
      socketTimeoutMS: 45000,
    });

    console.log(`✅ [DB] Connected: ${conn.connection.host}`);
    console.log(`📦 [DB] Database: ${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on("error", (err) => {
      console.error(`❌ [DB] Connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn(`⚠️  [DB] MongoDB disconnected`);
    });

    mongoose.connection.on("reconnected", () => {
      console.log(`🔄 [DB] MongoDB reconnected`);
    });
  } catch (error) {
    console.error(`❌ [DB] Initial connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
