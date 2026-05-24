"use strict";

/**
 * Broadcast a new alert to all relevant socket rooms.
 * @param {object} io     - Socket.IO server instance
 * @param {object} alert  - Saved Alert document (plain object)
 */
const broadcastNewAlert = (io, alert) => {
  io.emit("alert:new", alert);

  if (["critical","high"].includes(alert.severityLevel)) {
    io.to("role:responder").to("role:admin").to("role:ngo").emit("alert:urgent", alert);
  }
  if (alert.location?.country) {
    io.to(`region:${alert.location.country.toLowerCase()}`).emit("alert:region", alert);
  }
};

const broadcastAlertUpdate = (io, alertId, changes) => {
  io.emit("alert:updated", { _id: alertId, ...changes });
};

const broadcastAlertDelete = (io, alertId) => {
  io.emit("alert:deleted", { _id: alertId });
};

const notifyResponders = (io, message) => {
  io.to("role:responder").to("role:admin").emit("system:notification", message);
};

module.exports = { broadcastNewAlert, broadcastAlertUpdate, broadcastAlertDelete, notifyResponders };