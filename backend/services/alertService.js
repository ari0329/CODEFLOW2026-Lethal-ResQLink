"use strict";
const Alert           = require("../models/Alert");
const nlpService      = require("./nlpService");
const geocodeService  = require("./geocodeService");
const { checkDuplicate } = require("./deduplicationService");
const { calculate: calcSeverity } = require("./severityService");
const { publish, TOPICS } = require("../config/kafka");
const logger          = require("../utils/logger");

const SAMPLE_FEEDS = [
  { text: "URGENT!! Massive flood, families stranded on rooftops. 50+ people need rescue. MG Road bridge, Kolkata. Please send boats!! #SOS", source:"twitter" },
  { text: "আমাদের বাঁচান!! আমাদের বাড়িতে আগুন লেগেছে। শিশুরা আটকে আছে। বগুড়া জেলা, সাতমাথা মোড়। ফায়ার সার্ভিস নম্বরে কেউ ধরছে না।", source:"telegram" },
  { text: "Tremors felt, buildings collapsed near Nehru Street. People trapped under rubble. coordinates: 22.5726, 88.3639. Need cranes ASAP!!", source:"twitter" },
  { text: "SOCORRO!! Accidente grave en la autopista A-4 km 23. Hay heridos graves, al menos 8 personas. Necesitamos ambulancias urgentemente!", source:"reddit" },
  { text: "SOS!! Chemical plant explosion near sector 7 industrial zone. Toxic fumes spreading. Workers trapped. Hazmat needed. 23.0225, 72.5714", source:"news" },
  { text: "HILFE!! Gasexplosion Wohnblock Musterstraße 14, Berlin-Mitte. Mehrere Verletzte, Gebäude droht einzustürzen. Sofort Feuerwehr!", source:"facebook" },
  { text: "Flash flood — entire village submerged. 200+ residents need evacuation. Old age home affected. Assam, near Brahmaputra river bank", source:"whatsapp" },
  { text: "बचाओ बचाओ!! भूकंप आया है। हमारी इमारत गिर गई। दिल्ली के करोल बाग में। बहुत सारे लोग दबे हैं। जल्दी मदद भेजो", source:"sms" },
  { text: "Missing child alert: 8-year-old girl last seen near Central Park east entrance. Name: Priya. Red dress. Parents desperate. 9876543210", source:"facebook" },
  { text: "Shooting reported at Central Market. Multiple injuries. Ambulance needed NOW! Sector 14, Noida.", source:"twitter" },
  { text: "Building collapse! 4-storey residential building down. Dharavi, Mumbai. Over 30 people unaccounted for. Rescue teams not here yet!", source:"reddit" },
  { text: "Just had amazing pizza 😋 #food #lunch – not an emergency lol", source:"twitter" },
  { text: "Cyclone approaching coastal areas Odisha. Villagers refusing to evacuate. Need authorities to help evacuate 500+ families. Puri district", source:"news" },
  { text: "Au secours! Incendie dans un immeuble résidentiel rue Victor Hugo Paris 15e. Plusieurs personnes bloquées aux étages supérieurs!", source:"telegram" },
  { text: "test test this is just a test message ignore please", source:"api" },
];

let sampleIndex = 0;

/**
 * Process a single raw text through the full AI → geocode → severity pipeline
 * and persist to MongoDB, returning the saved Alert document.
 */
const processAndSave = async ({ text, source, sourceId = null, sourceUrl = null }) => {
 
  const dup = await checkDuplicate(text, sourceId, source);
  if (dup.duplicate) return null;

  let analysis;
  try   { analysis = await nlpService.analyzeText(text); }
  catch { analysis = nlpService.fallbackAnalysis(text); }

  if (analysis.distressScore < 0.25) return null;  


  let location = null;
  const { locations = [], coordinates = [] } = analysis.entities || {};
  if (locations.length || coordinates.length) {
    try { location = await geocodeService.geocode(locations, coordinates); }
    catch {}
  }

  const sev = calcSeverity({
    distressScore: analysis.distressScore,
    emergencyType: analysis.emergencyType,
    victimCount:   analysis.entities?.victimCount || 0,
    urgencyFlags:  analysis.urgencyFlags || [],
    hasLocation:   !!location,
  });

  const alert = await Alert.create({
    originalText: text,
    cleanedText:  analysis.cleanedText,
    language:     analysis.language,
    source, sourceUrl, sourceId,
    distressScore:           analysis.distressScore,
    emergencyType:           analysis.emergencyType,
    emergencyTypeConfidence: analysis.emergencyTypeConfidence,
    extractedEntities:       analysis.entities || {},
    location,
    severityScore:  sev.score,
    severityLevel:  sev.level,
    urgencyFlags:   sev.flags,
    isFake:         analysis.isFake,
    fakeConfidence: analysis.fakeConfidence,
    status:         "pending",
    reportedAt:     new Date(),
  });

  
  await publish(TOPICS.PROCESSED_ALERTS, { alertId: alert._id, ...sev }, String(alert._id));

  return alert;
};

/**
 * Cron-driven scrape cycle — runs every 45s
 */
const runScrapeCycle = async (io) => {
  const batchSize = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < batchSize; i++) {
    const sample = SAMPLE_FEEDS[sampleIndex % SAMPLE_FEEDS.length];
    sampleIndex++;

    const sourceId = `auto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      const alert = await processAndSave({ text: sample.text, source: sample.source, sourceId });
      if (!alert) continue;

      io.emit("alert:new", alert.toObject());
      if (["critical","high"].includes(alert.severityLevel))
        io.to("role:responder").to("role:admin").to("role:ngo").emit("alert:urgent", alert.toObject());
      if (alert.location?.country)
        io.to(`region:${alert.location.country.toLowerCase()}`).emit("alert:region", alert.toObject());

      logger.info(`[Scraper] ${alert._id} | ${alert.emergencyType} | ${alert.severityLevel}`);
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      logger.error(`[Scraper] Error: ${err.message}`);
    }
  }
};

module.exports = { processAndSave, runScrapeCycle };