const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
    lat: Number,
    lon: Number,
    display_name: String,
    source: { type: String, enum: ["extracted_coordinates", "nominatim", "google", "manual"] },
}, { _id: false });

const alertSchema = new mongoose.Schema({
    source: { type: String, required: true, 
    enum: ["twitter", "whatsapp", "email", "form", "manual", "facebook", "telegram", "unknown"] },
    source_id: { type: String },
    original_text: { type: String, required: true },
    cleaned_text: String,
    language: { type: String, default: "en" },
    is_distress: { type: Boolean, default: true },
    confidence: { type: Number, min: 0, max: 1 },
    emergency_type: {
        type: String,
        enum: ["flood", "fire", "earthquake", "medical", "accident", "violence", "missing", "landslide", "cyclone", "unknown"],
        default: "unknown",
    },
    victim_count: String,
    location: locationSchema,
    entities: { type: mongoose.Schema.Types.Mixed, default: {} },
    severity_score: { type: Number, min: 0, max: 100, default: 0 },
    severity_level: { type: String, enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"], default: "LOW" },
    is_duplicate: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ["PENDING", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "FALSE_ALARM"],
        default: "PENDING",
    },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: "Responder" },
    resolved_at: Date,
    notes: String,
}, {
    timestamps: true,
    toJSON: { virtuals: true },
});

alertSchema.index({ "location.lat": 1, "location.lon": 1 });
alertSchema.index({ severity_level: 1, status: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ emergency_type: 1 });

module.exports = mongoose.model("Alert", alertSchema);