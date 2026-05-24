"use strict";
require("dotenv").config();

const express    = require("express");
const http       = require("http");
const socketIo   = require("socket.io");
const cors       = require("cors");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const jwt        = require("jsonwebtoken");
const cron       = require("node-cron");

const { applySecurityMiddleware } = require("./config/security");
const connectDB   = require("./config/db");
const { initKafkaProducer, closeKafka } = require("./config/kafka");
const logger      = require("./utils/logger");

const authRoutes       = require("./routes/auth");
const alertRoutes      = require("./routes/alerts");
const analyticsRoutes  = require("./routes/analytics");
const responderRoutes  = require("./routes/responders");

const { startKafkaConsumer } = require("./services/kafkaConsumer");
const scraperService  = require("./services/alertService");


const app    = express();
const server = http.createServer(app);


const io = socketIo(server, {
  cors: {
    origin:      process.env.FRONTEND_URL || "*",
    methods:     ["GET", "POST"],
    credentials: true,
  },
  pingTimeout:  60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});


applySecurityMiddleware(app);
app.use(compression());
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));
app.use(mongoSanitize());             


connectDB();
initKafkaProducer().catch(e => logger.warn("Kafka producer init failed:", e.message));


io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) { socket.user = { role: "public", id: "anonymous" }; return next(); }
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET, { issuer: "ResQLink" });
    next();
  } catch {
    socket.user = { role: "public", id: "anonymous" };
    next();
  }
});

app.set("io", io);
global.io = io;


app.use("/api/auth",       authRoutes);
app.use("/api/alerts",     alertRoutes);
app.use("/api/analytics",  analyticsRoutes);
app.use("/api/responders", responderRoutes);

app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "ResQLink Backend", uptime: process.uptime() })
);


io.on("connection", socket => {
  logger.info(`WS connected: ${socket.id} | role: ${socket.user?.role}`);
  socket.join(`role:${socket.user?.role}`);

  socket.on("subscribe:region", region => {
    if (region && typeof region === "string")
      socket.join(`region:${region.toLowerCase().trim()}`);
  });

  socket.on("alert:claim", alertId => {
    if (["responder","admin"].includes(socket.user?.role))
      io.to("role:admin").emit("alert:claimed", { alertId, responder: socket.user.id, ts: Date.now() });
  });

  socket.on("disconnect", reason =>
    logger.debug(`WS disconnected: ${socket.id} (${reason})`)
  );
});

cron.schedule("*/45 * * * * *", () => {
  scraperService.runScrapeCycle(io).catch(e =>
    logger.error("Scrape cycle error:", e.message)
  );
});


cron.schedule("0 * * * *", async () => {
  const Alert = require("./models/Alert");
  const cutoff = new Date(Date.now() - 86_400_000);
  const { deletedCount } = await Alert.deleteMany({ status: "fake", createdAt: { $lt: cutoff } });
  if (deletedCount) logger.info(`Purged ${deletedCount} fake alerts`);
});

startKafkaConsumer(io).catch(e =>
  logger.warn("Kafka consumer failed (non-fatal):", e.message)
);


app.use((err, _req, res, _next) => {
  logger.error(err.message, { stack: err.stack });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  logger.info(`🚨 ResQLink Backend → port ${PORT} [${process.env.NODE_ENV || "development"}]`)
);


const shutdown = async () => {
  logger.info("Shutting down…");
  await closeKafka();
  server.close(() => { logger.info("HTTP server closed"); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT",  shutdown);

module.exports = { app, io };