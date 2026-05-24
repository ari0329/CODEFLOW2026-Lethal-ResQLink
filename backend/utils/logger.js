"use strict";
const winston = require("winston");

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: "HH:mm:ss" }),
  printf(({ level, message, timestamp: ts }) => `[${ts}] ${level}: ${message}`)
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = winston.createLogger({
  level:            process.env.LOG_LEVEL || "info",
  format:           process.env.NODE_ENV === "production" ? prodFormat : devFormat,
  defaultMeta:      { service: "resqlink-backend" },
  transports: [
    new winston.transports.Console(),
  ],
  exceptionHandlers: [new winston.transports.Console()],
  rejectionHandlers: [new winston.transports.Console()],
});

module.exports = logger;