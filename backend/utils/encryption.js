"use strict";
const CryptoJS = require("crypto-js");

const KEY = process.env.ENCRYPTION_KEY || "fallback_key_change_in_production!";

/**
 * AES-256 encrypt a string value.
 * Used for Pillar 4 — field-level encryption of sensitive data.
 */
const encryptField = (plaintext) => {
  if (!plaintext) return plaintext;
  return CryptoJS.AES.encrypt(String(plaintext), KEY).toString();
};

/**
 * Decrypt an AES-256 encrypted string.
 */
const decryptField = (ciphertext) => {
  if (!ciphertext) return ciphertext;
  const bytes = CryptoJS.AES.decrypt(ciphertext, KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Hash a value with SHA-256 (for checksums/integrity, NOT passwords).
 */
const hashValue = (value) => {
  return CryptoJS.SHA256(String(value)).toString(CryptoJS.enc.Hex);
};

module.exports = { encryptField, decryptField, hashValue };