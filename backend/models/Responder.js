const mongoose = require("mongoose");

const responderSchema = new mongoose.Schema(
  {
    
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    
    badgeNumber: {
      type: String,
      unique: true,
      default: () => `RES-${Math.floor(1000 + Math.random() * 9000)}`,
    },

    specialization: {
      type: String,
      enum: ["fire", "flood", "medical", "police", "disaster", "general"],
      default: "general",
    },

    district: {
      type: String,
      default: null,
    },

    
    status: {
      type: String,
      enum: ["available", "busy", "off-duty"],
      default: "available",
    },

    
    assignedAlerts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Alert",
      },
    ],

   
    totalResolved: {
      type: Number,
      default: 0,
    },

    totalAssigned: {
      type: Number,
      default: 0,
    },

    
    currentLocation: {
      lat: { type: Number, default: null },
      lon: { type: Number, default: null },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Responder", responderSchema);