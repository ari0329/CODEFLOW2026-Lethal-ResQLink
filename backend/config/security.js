/**
 * Apply all security middleware to the Express app.
 * Implements Pillar 4 — zero-trust, secure headers, rate limiting.
 */


"use strict";
const helmet      = require("helmet");
const rateLimit   = require("express-rate-limit");
const morgan      = require("morgan");
const logger      = require("../utils/logger");

const applySecurityMiddleware = (app) => {
  
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'"],
        styleSrc:    ["'self'", "'unsafe-inline'"],
        imgSrc:      ["'self'", "data:", "https:"],
        connectSrc:  ["'self'", "wss:", "ws:"],
        frameAncestors: ["'none'"],
      },
    },
    hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
  }));


  app.use(morgan("combined", {
    stream: { write: msg => logger.http(msg.trim()) },
  }));


  app.use("/api/", rateLimit({
    windowMs: 15 * 60 * 1000,    // 15 min
    max: 300,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { error: "Too many requests. Try again in 15 minutes." },
  }));


  app.use("/api/auth", rateLimit({
    windowMs: 60 * 60 * 1000,    // 1 hour
    max: 20,
    message: { error: "Too many auth attempts. Account temporarily restricted." },
    skipSuccessfulRequests: true,
  }));


  app.use("/api/alerts", rateLimit({
    windowMs: 60 * 1000,          // 1 min
    max: 30,
    message: { error: "Alert submission rate limit exceeded." },
  }));
};

module.exports = { applySecurityMiddleware };