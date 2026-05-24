"use strict";
const router   = require("express").Router();
const jwt      = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const xss      = require("xss");
const User     = require("../models/Responder");
const { protect } = require("../middleware/authMiddleware");
const AuditLog = require("../models/AuditLog");
const logger   = require("../utils/logger");

const sign = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET,
           { expiresIn: process.env.JWT_EXPIRES_IN || "7d", issuer: "ResQLink" });

// POST /api/auth/register
router.post("/register", [
  body("name").trim().notEmpty().isLength({ max: 100 }),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }).matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body("role").optional().isIn(["responder","ngo","analyst","public"]),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

  try {
    const { name, email, password, role, organization, badgeId, phone } = req.body;
    if (await User.findOne({ email })) return res.status(409).json({ error: "Email already registered." });

    const user = await User.create({
      name: xss(name), email, password,
      role: role || "public",
      organization: xss(organization || ""),
      badgeId: xss(badgeId || ""),
      phone: xss(phone || ""),
    });

    await AuditLog.record({ action:"USER_REGISTER", resourceId:String(user._id),
      resourceType:"User", ipAddress:req.ip, userAgent:req.headers["user-agent"] });

    logger.info(`Registered: ${user.email} [${user.role}]`);
    res.status(201).json({ token: sign(user._id, user.role),
      user: { id:user._id, name:user.name, email:user.email, role:user.role, permissions:user.permissions }});
  } catch (e) {
    logger.error("Register:", e.message);
    res.status(500).json({ error: "Registration failed." });
  }
});

// POST /api/auth/login
router.post("/login", [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ error: "Invalid credentials." });
    if (user.isLocked) return res.status(423).json({ error: "Account locked.", lockUntil: user.lockUntil });
    if (!user.isActive) return res.status(403).json({ error: "Account deactivated." });

    if (!await user.comparePassword(password)) {
      await user.incLoginAttempts();
      return res.status(401).json({ error: "Invalid credentials." });
    }

    await user.updateOne({ $set:{ loginAttempts:0, lockUntil:undefined, lastLogin:Date.now() } });
    await AuditLog.record({ actor:user._id, actorRole:user.role, action:"USER_LOGIN",
      ipAddress:req.ip, userAgent:req.headers["user-agent"] });

    res.json({ token: sign(user._id, user.role),
      user: { id:user._id, name:user.name, email:user.email, role:user.role,
              permissions:user.permissions, organization:user.organization }});
  } catch (e) {
    logger.error("Login:", e.message);
    res.status(500).json({ error: "Login failed." });
  }
});

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -loginHistory").lean();
  if (!user) return res.status(404).json({ error: "Not found." });
  res.json({ user });
});

// POST /api/auth/refresh
router.post("/refresh", protect, (req, res) =>
  res.json({ token: sign(req.user._id, req.user.role) })
);

module.exports = router;