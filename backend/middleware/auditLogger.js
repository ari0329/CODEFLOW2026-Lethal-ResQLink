"use strict";
const AuditLog = require("../models/AuditLog");
const logger   = require("../utils/logger");

/**
 * Factory that returns middleware recording an audit event.
 * Usage: router.patch("/:id/verify", protect, auditAction("VERIFY_ALERT","Alert"), handler)
 */
const auditAction = (action, resourceType) => async (req, _res, next) => {

  AuditLog.record({
    actor:        req.user?._id,
    actorRole:    req.user?.role,
    action,
    resourceId:   req.params?.id,
    resourceType,
    ipAddress:    req.ip,
    userAgent:    req.headers["user-agent"]?.substring(0, 200),
    details:      { body: req.body, params: req.params, query: req.query },
  }).catch(e => logger.warn("Audit log failed:", e.message));
  next();
};

module.exports = { auditAction };