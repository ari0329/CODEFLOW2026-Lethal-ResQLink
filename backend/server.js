/**
 * ResQLink Backend Server
 * Express + Socket.IO + Kafka Consumer
 */
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const winston = require("winston");

const { connectDB } = require("./config/db");
const { security } = require("./config/security");
const alertRoutes = require("./routes/alerts");
const responderRoutes = require("./routes/responders");
const analyticsRoutes = require("./routes/analytics");
const authRoutes = require("./routes/auth");
const { startKafkaConsumer } = require("./services/kafkaConsumer");
const { initSocketService } = require("./services/socketService");


const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) =>
      `[${timestamp}] ${level.toUpperCase()}: ${message}`
    )
  ),
  transports: [new winston.transports.Console()],
});


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
});


app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*" }));
app.use(express.json({ limit: "1mb" }));
app.use(security.rateLimiter);


app.use("/api/auth", authRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/responders", responderRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/health", (req, res) => res.json({ status: "ok", service: "resqlink-backend" }));

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: "Internal server error" });
});


const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();
  initSocketService(io);
  await startKafkaConsumer(io);

  server.listen(PORT, () => {
    logger.info(`ResQLink backend running on port ${PORT}`);
  });
}

start().catch((err) => {
  logger.error(`Startup failed: ${err.message}`);
  process.exit(1);
});

module.exports = { app, io };