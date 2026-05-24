"use strict";
const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema({
    type: { type: String, default: "Point", enum: ["Point"] },
    coordinates: { type: [Number], required: true },   // [lng, lat]
    address: String,
    landmark: String,
    city: String,
    country: String,
    geocodedFrom: String,
    confidence: { type: Number, min: 0, max: 1, default: 0 },
}, { _id: false });

const EntitiesSchema = new mongoose.Schema({
    locations: [String],
    persons: [String],
    organizations: [String],
    victimCount: { type: Number, default: 0 },
    landmarks: [String],
    phoneNumbers: [String],
    coordinates: [String],
}, { _id: false });

const AlertSchema = new mongoose.Schema({
  
    originalText: { type: String, required: true, maxlength: 5000 },
    cleanedText: { type: String },
    language: { type: String, default: "en", maxlength: 10 },
    source: {
        type: String, required: true,
        enum: ["twitter", "facebook", "telegram", "whatsapp", "email", "sms", "manual", "api", "reddit", "news"]
    },
    sourceUrl: { type: String, maxlength: 2048 },
    sourceId: { type: String, index: true },          

  
    distressScore: { type: Number, min: 0, max: 1, default: 0 },
    emergencyType: {
        type: String, default: "other",
        enum: ["flood", "fire", "earthquake", "accident", "medical", "violence",
            "collapse", "landslide", "storm", "missing", "trapped", "other"]
    },
    emergencyTypeConfidence: { type: Number, min: 0, max: 1, default: 0 },

   
    extractedEntities: { type: EntitiesSchema, default: () => ({}) },

  
    location: LocationSchema,
    region: { type: String, index: true },

    
    severityScore: { type: Number, min: 0, max: 100, default: 0 },
    severityLevel: { type: String, enum: ["critical", "high", "medium", "low"], default: "medium" },
    urgencyFlags: [{
        type: String, enum: [
            "multiple_victims", "children_involved", "elderly_involved",
            "rapid_spread", "infrastructure_damage", "no_communication",
        ]
    }],

    
    status: {
        type: String, default: "pending",
        enum: ["pending", "verified", "active", "resolved", "fake", "duplicate"]
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date,
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: "Alert" },
    isFake: { type: Boolean, default: false },
    fakeConfidence: { type: Number, default: 0 },

    
    assignedResponders: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    responseTeam: String,
    responseNotes: [{
        note: { type: String, maxlength: 1000 },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
    }],
    resolvedAt: Date,
    reportedAt: { type: Date, default: Date.now },
}, { timestamps: true });


AlertSchema.index({ location: "2dsphere" });
AlertSchema.index({ status: 1, severityScore: -1 });
AlertSchema.index({ createdAt: -1 });
AlertSchema.index({ emergencyType: 1 });
AlertSchema.index({ sourceId: 1, source: 1 }, { unique: true, sparse: true });


AlertSchema.pre("save", function (next) {
    if (this.location) {
        this.region = this.location.city || this.location.country || "unknown";
    }
    next();
});

module.exports = mongoose.model("Alert", AlertSchema);