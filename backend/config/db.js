"use strict";
const mongoose = require("mongoose");
const logger   = require("../utils/logger");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      maxPoolSize: 20,
      minPoolSize: 2,
    });
    logger.info(`MongoDB connected → ${mongoose.connection.host}`);
  } catch (err) {
    console.error("❌ FULL ERROR:", err); // ← changed this
    process.exit(1);
  }
};

module.exports = connectDB;