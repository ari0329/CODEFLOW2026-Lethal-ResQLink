const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes  = require("./routes/auth");
const alertRoutes = require("./routes/alerts");

const app    = express();
const server = http.createServer(app);

// WebSocket for real-time alerts to dashboard
const io = new Server(server, {
  cors: { origin: "*" }
});

// Middleware
app.use(cors());
app.use(express.json());

// Make io accessible in routes
app.set("io", io);

// Routes
app.use("/api/auth",   authRoutes);
app.use("/api/alerts", alertRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "resqlink-backend",
    timestamp: new Date().toISOString(),
  });
});

// WebSocket connection
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
console.log("🔍 URI:", process.env.MONGODB_URI);
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});