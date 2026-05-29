const express = require("express");
const router = express.Router();
const axios = require("axios");
const Alert = require("../models/Alert");

router.post("/sos", async (req, res) => {
  try {
    const {
      message,
      location,
      contactNumber,
      emergencyType,
      latitude,
      longitude,
    } = req.body;

    if (!message || !location) {
      return res.status(400).json({
        success: false,
        message: "Message and location are required",
      });
    }

    // Save alert to MongoDB Atlas
    const alert = await Alert.create({
      message,
      location,
      contactNumber: contactNumber || "Anonymous",
      emergencyType: emergencyType || "unknown",
      coordinates: {
        lat: latitude || null,
        lon: longitude || null,
      },
      status: "pending",
      source: "public",
    });

    // Directly call AI service instead of Kafka
    try {
      const aiResponse = await axios.post(
        `${process.env.AI_SERVICE_URL}/analyze`,
        {
          alertId: alert._id,
          message,
          location,
        }
      );

      // Update alert with AI results
      await Alert.findByIdAndUpdate(alert._id, {
        severity: aiResponse.data.severity || "moderate",
        emergencyType: aiResponse.data.emergencyType || emergencyType,
      });

    } catch (aiError) {
      // AI service failure shouldn't block SOS
      console.warn("⚠️ AI service unavailable:", aiError.message);
    }

    res.status(201).json({
      success: true,
      message: "SOS alert received. Help is on the way.",
      alertId: alert._id,
    });

  } catch (error) {
    console.error("SOS error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to send SOS.",
      error: error.message,
    });
  }
});

// Get all alerts (for dashboard)
router.get("/", async (req, res) => {
  try {
    const alerts = await Alert.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;