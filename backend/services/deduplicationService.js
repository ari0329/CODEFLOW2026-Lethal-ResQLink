"use strict";
const Alert  = require("../models/Alert");
const logger = require("../utils/logger");

const jaccard = (a, b) => {
  const sa = new Set(a.toLowerCase().split(/\s+/));
  const sb = new Set(b.toLowerCase().split(/\s+/));
  const inter = new Set([...sa].filter(x => sb.has(x)));
  const union = new Set([...sa, ...sb]);
  return union.size === 0 ? 0 : inter.size / union.size;
};

const checkDuplicate = async (text, sourceId, source) => {
  if (sourceId) {
    const ex = await Alert.findOne({ sourceId, source }).lean();
    if (ex) { logger.debug(`Dup by sourceId: ${sourceId}`); return { duplicate:true, existingId:ex._id }; }
  }

  const cutoff = new Date(Date.now() - 3_600_000);
  const recent = await Alert.find({ createdAt:{$gte:cutoff}, status:{$ne:"fake"} })
    .select("originalText _id").limit(150).lean();

  for (const a of recent) {
    const sim = jaccard(text, a.originalText);
    if (sim >= 0.82) {
      
      await Alert.findByIdAndUpdate(a._id, { $min: { distressScore: 0.1 } });
      logger.debug(`Dup by similarity (${(sim*100).toFixed(1)}%): ${a._id}`);
      return { duplicate:true, existingId:a._id, similarity:sim };
    }
  }
  return { duplicate:false };
};

module.exports = { checkDuplicate };