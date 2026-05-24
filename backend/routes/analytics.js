"use strict";
const router = require("express").Router();
const Alert  = require("../models/Alert");
const { protect, restrictTo } = require("../middleware/authMiddleware");

// GET /api/analytics/summary
router.get("/summary", async (_req, res) => {
  try {
    const [total, bySeverity, byType, byStatus, recent24h] = await Promise.all([
      Alert.countDocuments({ status:{$ne:"fake"} }),
      Alert.aggregate([{ $match:{status:{$ne:"fake"}} }, { $group:{_id:"$severityLevel",count:{$sum:1}} }]),
      Alert.aggregate([{ $match:{status:{$ne:"fake"}} }, { $group:{_id:"$emergencyType",count:{$sum:1}} }, { $sort:{count:-1} }]),
      Alert.aggregate([{ $group:{_id:"$status",count:{$sum:1}} }]),
      Alert.countDocuments({ createdAt:{ $gte:new Date(Date.now()-86_400_000) }, status:{$ne:"fake"} }),
    ]);
    res.json({ total, bySeverity, byType, byStatus, recent24h });
  } catch { res.status(500).json({ error:"Analytics fetch failed." }); }
});

// GET /api/analytics/heatmap
router.get("/heatmap", async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to)   dateFilter.$lte = new Date(to);
    const alerts = await Alert.find({
      "location.coordinates":{ $exists:true, $ne:[] },
      status:{ $ne:"fake" },
      ...(from||to ? {createdAt:dateFilter} : {})
    }).select("location.coordinates severityScore emergencyType").lean();
    const heatmapData = alerts
      .filter(a => a.location?.coordinates?.length===2)
      .map(a => ({ lat:a.location.coordinates[1], lng:a.location.coordinates[0],
                   weight:a.severityScore/100, type:a.emergencyType }));
    res.json({ heatmapData });
  } catch { res.status(500).json({ error:"Heatmap fetch failed." }); }
});

// GET /api/analytics/timeline
router.get("/timeline", async (req, res) => {
  try {
    const { days=7 } = req.query;
    const start = new Date(Date.now() - Math.min(+days,90)*86_400_000);
    const timeline = await Alert.aggregate([
      { $match:{ createdAt:{$gte:start}, status:{$ne:"fake"} } },
      { $group:{ _id:{ date:{ $dateToString:{format:"%Y-%m-%d",date:"$createdAt"} }, type:"$emergencyType" },
                 count:{$sum:1}, avgSeverity:{$avg:"$severityScore"} } },
      { $sort:{ "_id.date":1 } },
    ]);
    res.json({ timeline });
  } catch { res.status(500).json({ error:"Timeline fetch failed." }); }
});

// GET /api/analytics/regions
router.get("/regions", async (_req, res) => {
  try {
    const regions = await Alert.aggregate([
      { $match:{ status:{$ne:"fake"}, region:{$exists:true,$ne:null} } },
      { $group:{ _id:"$region", count:{$sum:1}, avgSeverity:{$avg:"$severityScore"},
                 critical:{ $sum:{ $cond:[{$eq:["$severityLevel","critical"]},1,0] } } } },
      { $sort:{ count:-1 } }, { $limit:20 },
    ]);
    res.json({ regions });
  } catch { res.status(500).json({ error:"Regions fetch failed." }); }
});

// GET /api/analytics/response-time — admin/analyst only
router.get("/response-time", protect, restrictTo("admin","analyst"), async (_req, res) => {
  try {
    const data = await Alert.aggregate([
      { $match:{ status:"resolved", resolvedAt:{$exists:true} } },
      { $addFields:{ responseMin:{ $divide:[{ $subtract:["$resolvedAt","$createdAt"] },60000] } } },
      { $group:{ _id:"$emergencyType", avg:{$avg:"$responseMin"}, min:{$min:"$responseMin"},
                 max:{$max:"$responseMin"}, count:{$sum:1} } },
    ]);
    res.json({ data });
  } catch { res.status(500).json({ error:"Response time fetch failed." }); }
});

module.exports = router;