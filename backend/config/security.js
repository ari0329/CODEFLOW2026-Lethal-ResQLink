/**
 * Security Configuration — Pillar 4
 * Implements: Rate limiting, JWT, AES-256 encryption, audit logging
 */
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");

const JWT_SECRET = process.env.JWT_SECRET || "resqlink-dev-jwt-secret-change-in-production";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "resqlink-dev-encryption-key-32b!";


const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

function signToken(payload, expiresIn = "12h") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn, algorithm: "HS256" });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}


function encryptField(plaintext) {
  if (!plaintext) return "";
  return CryptoJS.AES.encrypt(String(plaintext), ENCRYPTION_KEY).toString();
}

function decryptField(ciphertext) {
  if (!ciphertext) return "";
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return "[decryption error]";
  }
}

module.exports = {
  security: { rateLimiter },
  jwt: { signToken, verifyToken },
  crypto: { encryptField, decryptField },
};