"use strict";
const mongoose = require("mongoose");
const logger   = require("../utils/logger");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/resqlink";
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      maxPoolSize: 20,
      minPoolSize: 2,
    });
    logger.info(`MongoDB connected → ${mongoose.connection.host}`);

    mongoose.connection.on("error",        e  => logger.error("MongoDB error:",        e.message));
    mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
    mongoose.connection.on("reconnected",  () => logger.info("MongoDB reconnected"));
  } catch (err) {
    logger.error("MongoDB initial connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;