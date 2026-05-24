"use strict";
const router = require("express").Router();
const xss = require("xss");
const { body, param, validationResult } = require("express-validator");
const Alert = require("../models/Alert");
const { protect, optionalAuth, restrictTo } = require("../middleware/authMiddleware");
const { auditAction } = require("../middleware/auditLogger");
const { processAndSave } = require("../services/alertService");
const { broadcastNewAlert, broadcastAlertUpdate, broadcastAlertDelete } = require("../services/socketService");
const logger = require("../utils/logger");

// GET /api/alerts
router.get("/", optionalAuth, async (req, res) => {
    try {
        const { status, severity, type, region, page = 1, limit = 50, lat, lng, radius, from, to } = req.query;
        const filter = {};

        if (status) filter.status = status;
        else filter.status = { $in: ["pending", "verified", "active"] };

        if (severity) filter.severityLevel = severity;
        if (type) filter.emergencyType = type;
        if (region) filter.region = { $regex: region, $options: "i" };
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }
        if (lat && lng && radius) {
            filter.location = {
                $near: {
                    $geometry: { type: "Point", coordinates: [+lng, +lat] },
                    $maxDistance: +radius * 1000,
                }
            };
        }

        const skip = (Math.max(+page, 1) - 1) * Math.min(+limit, 200);
        const [alerts, total] = await Promise.all([
            Alert.find(filter).sort({ severityScore: -1, createdAt: -1 }).skip(skip).limit(Math.min(+limit, 200))
                .populate("verifiedBy", "name role").lean(),
            Alert.countDocuments(filter),
        ]);

        res.json({ alerts, pagination: { total, page: +page, pages: Math.ceil(total / Math.min(+limit, 200)), limit: +limit } });
    } catch (e) {
        logger.error("GET /alerts:", e.message);
        res.status(500).json({ error: "Failed to fetch alerts." });
    }
});

// GET /api/alerts/:id
router.get("/:id", optionalAuth, [param("id").isMongoId()], async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
    const alert = await Alert.findById(req.params.id)
        .populate("verifiedBy", "name role organization")
        .populate("assignedResponders", "name role organization phone");
    if (!alert) return res.status(404).json({ error: "Alert not found." });
    res.json({ alert });
});

// POST /api/alerts — submit raw SOS text for AI processing
router.post("/", [
    body("text").trim().notEmpty().isLength({ min: 5, max: 5000 }),
    body("source").isIn(["twitter", "facebook", "telegram", "whatsapp", "email", "sms", "manual", "api", "reddit", "news"]),
    body("sourceUrl").optional().isURL(),
    body("sourceId").optional().trim(),
], async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

    try {
        const { text, source, sourceUrl, sourceId } = req.body;
        const alert = await processAndSave({ text: xss(text), source, sourceUrl, sourceId });
        if (!alert) return res.status(409).json({ message: "Duplicate or non-distress message." });

        broadcastNewAlert(req.app.get("io"), alert.toObject());
        res.status(201).json({ alert });
    } catch (e) {
        logger.error("POST /alerts:", e.message);
        res.status(500).json({ error: "Failed to process alert." });
    }
});

// PATCH /api/alerts/:id/verify
router.patch("/:id/verify",
    protect, restrictTo("admin", "responder"),
    auditAction("VERIFY_ALERT", "Alert"),
    async (req, res) => {
        const { status, notes } = req.body;
        if (!["verified", "fake", "resolved", "active"].includes(status))
            return res.status(400).json({ error: "Invalid status." });

        const update = { status, verifiedBy: req.user._id, verifiedAt: new Date(), isFake: status === "fake" };
        if (status === "resolved") update.resolvedAt = new Date();

        const alert = await Alert.findByIdAndUpdate(req.params.id, {
            $set: update,
            ...(notes ? { $push: { responseNotes: { note: xss(String(notes)), by: req.user._id } } } : {})
        }, { new: true }).populate("verifiedBy", "name role");

        if (!alert) return res.status(404).json({ error: "Alert not found." });
        broadcastAlertUpdate(req.app.get("io"), alert._id, { status: alert.status, verifiedBy: alert.verifiedBy });
        res.json({ alert });
    }
);

// PATCH /api/alerts/:id/assign
router.patch("/:id/assign",
    protect, restrictTo("admin"),
    auditAction("ASSIGN_RESPONDERS", "Alert"),
    async (req, res) => {
        const { responderIds, responseTeam } = req.body;
        const alert = await Alert.findByIdAndUpdate(req.params.id, {
            $set: { assignedResponders: responderIds, responseTeam, status: "active" }
        }, { new: true }).populate("assignedResponders", "name email phone role");
        if (!alert) return res.status(404).json({ error: "Alert not found." });
        req.app.get("io").to("role:responder").emit("alert:assigned", { alertId: alert._id, team: responseTeam });
        res.json({ alert });
    }
);

// DELETE /api/alerts/:id
router.delete("/:id",
    protect, restrictTo("admin"),
    auditAction("DELETE_ALERT", "Alert"),
    async (req, res) => {
        const alert = await Alert.findByIdAndDelete(req.params.id);
        if (!alert) return res.status(404).json({ error: "Alert not found." });
        broadcastAlertDelete(req.app.get("io"), req.params.id);
        res.json({ message: "Alert deleted." });
    }
);

module.exports = router;