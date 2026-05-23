const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  const uri = process.env.MONGO_URI || "mongodb://mongo:27017/resqlink";
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  isConnected = true;
  console.log("MongoDB connected.");
}

module.exports = { connectDB };