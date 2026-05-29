const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    coordinates: {
      lat: { type: Number, default: null },
      lon: { type: Number, default: null },
    },

    contactNumber: {
      type: String,
      default: "Anonymous",
    },

    emergencyType: {
      type: String,
      enum: [
        "fire",
        "flood",
        "medical",
        "accident",
        "violence",
        "earthquake",
        "unknown",
      ],
      default: "unknown",
    },

    severity: {
      type: String,
      enum: ["low", "moderate", "critical"],
      default: "moderate",
    },

    status: {
      type: String,
      enum: ["pending", "assigned", "resolved", "dismissed"],
      default: "pending",
    },

    source: {
      type: String,
      enum: ["public", "mobile", "responder"],
      default: "public",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Responder",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Alert", alertSchema);