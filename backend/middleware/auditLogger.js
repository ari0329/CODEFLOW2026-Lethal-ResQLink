const AuditLog = require("../models/AuditLog");
const { crypto: { encryptField } } = require("../config/security");

async function auditLog(user, action, targetId, targetType, details = {}, req = null) {
  try {
    const ipAddress = req ? (req.headers["x-forwarded-for"] || req.socket.remoteAddress) : "unknown";
    
    const encryptedDetails = encryptField(JSON.stringify(details));

    await AuditLog.create({
      userId: user.id || user._id,
      userName: user.name,
      role: user.role,
      action,
      targetId,
      targetType,
      ipAddress,
      details: encryptedDetails,
    });
  } catch (err) {
    console.error("Failed to write audit log:", err.message);
  }
}

module.exports = { auditLog };
