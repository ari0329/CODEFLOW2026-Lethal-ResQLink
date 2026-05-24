"use strict";
const rateLimit = require("express-rate-limit");

const createLimiter = (windowMs, max, message) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false,
    message: { error: message } });

module.exports = {
  generalLimiter: createLimiter(15 * 60_000, 300, "Rate limit exceeded."),
  authLimiter:    createLimiter(60 * 60_000,  20, "Too many auth attempts."),
  alertLimiter:   createLimiter(60_000,        30, "Alert submission rate limited."),
};