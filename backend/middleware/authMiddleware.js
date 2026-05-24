"use strict";
const jwt  = require("jsonwebtoken");
const User = require("../models/Responder");

const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ error: "No token provided." });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: "ResQLink" });
    const user = await User.findById(decoded.id).select("-password").lean();
    if (!user)      return res.status(401).json({ error: "User no longer exists." });
    if (!user.isActive) return res.status(403).json({ error: "Account deactivated." });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ error: "Token expired." });
    return res.status(401).json({ error: "Invalid token." });
  }
};

const optionalAuth = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  try {
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET, { issuer: "ResQLink" });
    const user = await User.findById(decoded.id).select("-password").lean();
    if (user?.isActive) req.user = user;
  } catch {}
  next();
};

const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user)            return res.status(401).json({ error: "Authentication required." });
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: `Requires role: ${roles.join(" | ")}` });
  next();
};

const requirePermission = (perm) => (req, res, next) => {
  if (!req.user?.permissions?.[perm])
    return res.status(403).json({ error: `Missing permission: ${perm}` });
  next();
};

module.exports = { protect, optionalAuth, restrictTo, requirePermission };