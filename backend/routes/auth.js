const express = require("express");
const router = express.Router();
const { Responder } = require("../models/Responder");
const { jwt: { signToken } } = require("../config/security");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const { auditLog } = require("../middleware/auditLogger");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const responder = await Responder.findOne({ email: email.toLowerCase(), isActive: true });
    if (!responder) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await responder.comparePassword(password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    responder.lastLogin = new Date();
    await responder.save();

    const token = signToken({ id: responder._id, email: responder.email, role: responder.role, name: responder.name });

    await auditLog(responder, "LOGIN", responder._id.toString(), "Responder", {}, req);

    return res.json({ token, user: responder });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register (admin only — or open for first user)
router.post("/register", async (req, res) => {
  try {
    const count = await Responder.countDocuments();
    const { name, email, password, role, organization, phone } = req.body;

    // Only first user can register without auth (becomes admin)
    const assignedRole = count === 0 ? "admin" : (role || "responder");

    const existing = await Responder.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const responder = await Responder.create({
      name, email: email.toLowerCase(), password, role: assignedRole, organization, phone,
    });

    const token = signToken({ id: responder._id, email: responder.email, role: responder.role, name: responder.name });
    return res.status(201).json({ token, user: responder });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  const responder = await Responder.findById(req.user.id);
  if (!responder) return res.status(404).json({ error: "Not found" });
  return res.json(responder);
});

module.exports = router;