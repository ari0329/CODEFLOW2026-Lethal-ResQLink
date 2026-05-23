const express = require("express");
const router = express.Router();
const axios = require("axios");
const Alert = require("../models/Alert");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");
const { auditLog } = require("../middleware/auditLogger");
const { getIO } = require("../services/socketService");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai-service:8000";

// GET /api/alerts — list with filters
router.get("/", authMiddleware, async (req, res) => {
    try {
        const {
            status, severity_level, emergency_type,
            limit = 50, skip = 0, from, to,
        } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (severity_level) filter.severity_level = severity_level;
        if (emergency_type) filter.emergency_type = emergency_type;
        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) filter.createdAt.$lte = new Date(to);
        }

        const alerts = await Alert.find(filter)
            .sort({ severity_score: -1, createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip))
            .populate("assigned_to", "name email organization");

        const total = await Alert.countDocuments(filter);
        return res.json({ alerts, total, limit: Number(limit), skip: Number(skip) });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// GET /api/alerts/live — for map (only with location, last 6h)
router.get("/live", authMiddleware, async (req, res) => {
    try {
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const alerts = await Alert.find({
            "location.lat": { $exists: true },
            status: { $ne: "RESOLVED" },
            is_duplicate: false,
            createdAt: { $gte: sixHoursAgo },
        }).sort({ severity_score: -1 }).limit(200);
        return res.json(alerts);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// GET /api/alerts/:id
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id).populate("assigned_to", "name email");
        if (!alert) return res.status(404).json({ error: "Alert not found" });
        await auditLog(req.user, "VIEW_ALERT", req.params.id, "Alert", {}, req);
        return res.json(alert);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/alerts — manual submission -> send through AI pipeline
router.post("/", async (req, res) => {
    try {
        const { text, source = "form", metadata = {} } = req.body;
        if (!text) return res.status(400).json({ error: "Text is required" });

        // Send to AI service for processing
        let processed;
        try {
            const aiResp = await axios.post(`${AI_SERVICE_URL}/process`, {
                text, source, metadata,
            }, { timeout: 10000 });
            processed = aiResp.data;
        } catch (aiErr) {
            // AI service unavailable — store raw
            processed = { is_distress: true, confidence: 0.5, severity_level: "LOW", severity_score: 20, entities: {}, language: "en" };
        }

        if (!processed.is_distress) {
            return res.status(200).json({ message: "Not classified as distress", processed });
        }

        const alert = await Alert.create({
            source,
            original_text: text,
            cleaned_text: processed.cleaned_text || text,
            language: processed.language || "en",
            is_distress: processed.is_distress,
            confidence: processed.confidence,
            emergency_type: processed.emergency_type || "unknown",
            victim_count: processed.entities?.victim_count,
            location: processed.location || undefined,
            entities: processed.entities || {},
            severity_score: processed.severity_score || 0,
            severity_level: processed.severity_level || "LOW",
            is_duplicate: processed.is_duplicate || false,
        });

        // Broadcast to connected clients
        getIO()?.emit("new_alert", alert);

        return res.status(201).json(alert);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// PATCH /api/alerts/:id/status
router.patch("/:id/status", authMiddleware, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const allowed = ["ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "FALSE_ALARM"];
        if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });

        const update = { status };
        if (notes) update.notes = notes;
        if (status === "RESOLVED") update.resolved_at = new Date();

        const alert = await Alert.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!alert) return res.status(404).json({ error: "Alert not found" });

        await auditLog(req.user, status === "RESOLVED" ? "RESOLVE_ALERT" : "ACKNOWLEDGE_ALERT", req.params.id, "Alert", { status, notes }, req);
        getIO()?.emit("alert_updated", alert);

        return res.json(alert);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// PATCH /api/alerts/:id/assign
router.patch("/:id/assign", authMiddleware, requireRole("admin", "responder"), async (req, res) => {
    try {
        const { responder_id } = req.body;
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            { assigned_to: responder_id, status: "ACKNOWLEDGED" },
            { new: true }
        ).populate("assigned_to", "name email");
        if (!alert) return res.status(404).json({ error: "Alert not found" });

        await auditLog(req.user, "ASSIGN_ALERT", req.params.id, "Alert", { responder_id }, req);
        getIO()?.emit("alert_updated", alert);
        return res.json(alert);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;