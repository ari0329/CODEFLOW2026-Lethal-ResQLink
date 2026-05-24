"use strict";
const mongoose = require("mongoose");
const { encryptField, decryptField } = require("../utils/encryption");

const AuditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  actorRole: String,
  action: { type: String, required: true },
  resourceId: String,
  resourceType: String,
  ipAddress: String,
  userAgent: String,

  _encryptedDetails: { type: String },

  integrityHash: String,
}, { timestamps: true });

AuditLogSchema.index({ actor: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: -1 });


AuditLogSchema.methods.setDetails = function (details) {
  this._encryptedDetails = encryptField(JSON.stringify(details));
  return this;
};


AuditLogSchema.methods.getDetails = function () {
  if (!this._encryptedDetails) return null;
  try {
    return JSON.parse(decryptField(this._encryptedDetails));
  } catch { return null; }
};


AuditLogSchema.statics.record = async function ({
  actor, actorRole, action, resourceId, resourceType,
  details, ipAddress, userAgent,
}) {
  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha256", process.env.ENCRYPTION_KEY || "fallback")
    .update(`${action}:${resourceId}:${actor}:${Date.now()}`)
    .digest("hex");

  const doc = new this({
    actor, actorRole, action, resourceId, resourceType,
    ipAddress, userAgent, integrityHash: hash
  });
  if (details) doc.setDetails(details);
  await doc.save();
  return doc;
};

module.exports = mongoose.model("AuditLog", AuditLogSchema);