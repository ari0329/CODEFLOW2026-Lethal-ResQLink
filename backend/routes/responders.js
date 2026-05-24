"use strict";
const router   = require("express").Router();
const User     = require("../models/Responder");
const Alert    = require("../models/Alert");
const AuditLog = require("../models/AuditLog");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const { auditAction } = require("../middleware/auditLogger");

// GET /api/responders — list all (admin only)
router.get("/", protect, restrictTo("admin"), async (_req, res) => {
  const responders = await User.find({ role:{ $in:["responder","ngo"] }, isActive:true })
    .select("-password").lean();
  res.json({ responders });
});

// GET /api/responders/my-alerts — alerts assigned to me
router.get("/my-alerts", protect, restrictTo("responder","admin"), async (req, res) => {
  const alerts = await Alert.find({
    assignedResponders: req.user._id,
    status: { $in:["active","pending","verified"] },
  }).sort({ severityScore:-1 }).lean();
  res.json({ alerts });
});

// PATCH /api/responders/alerts/:id/note — add field note
router.patch("/alerts/:id/note",
  protect, restrictTo("responder","admin"),
  auditAction("ADD_RESPONSE_NOTE","Alert"),
  async (req, res) => {
    const { note } = req.body;
    if (!note?.trim()) return res.status(400).json({ error: "Note is required." });
    const alert = await Alert.findByIdAndUpdate(req.params.id, {
      $push: { responseNotes: { note: String(note).substring(0,1000), by: req.user._id } }
    }, { new:true });
    if (!alert) return res.status(404).json({ error: "Alert not found." });
    res.json({ alert });
  }
);

// GET /api/responders/audit — audit log (admin)
router.get("/audit", protect, restrictTo("admin"), async (req, res) => {
  const { page=1, limit=50 } = req.query;
  const skip = (Math.max(+page,1)-1)*Math.min(+limit,100);
  const [logs, total] = await Promise.all([
    AuditLog.find().sort({ createdAt:-1 }).skip(skip).limit(Math.min(+limit,100))
      .populate("actor","name role email").lean(),
    AuditLog.countDocuments(),
  ]);
  res.json({ logs, pagination:{ total, page:+page, pages:Math.ceil(total/Math.min(+limit,100)) }});
});

module.exports = router;