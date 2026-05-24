"use strict";
const axios  = require("axios");
const logger = require("../utils/logger");

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const analyzeText = async (text) => {
  const { data } = await axios.post(`${AI_URL}/analyze`, { text }, {
    timeout: 12_000,
    headers: { "Content-Type": "application/json" },
  });
  return data;
};

// ── Keyword lists ─────────────────────────────────────────────────────────────
const DISTRESS_KW = [
  "help","sos","emergency","urgent","please help","need help","mayday","danger",
  "rescue","save us","trapped","injured","dying","critical","fire","flood",
  "earthquake","missing","attack","explosion","drowning","bleeding","unconscious",
  // Bengali
  "বাঁচাও","সাহায্য","জরুরি","আগুন","পানি","বন্যা","ভূমিকম্প",
  // Hindi
  "बचाओ","मदद","जरूरी","आपातकाल",
  // Spanish/French/German
  "socorro","ayuda","urgente","au secours","hilfe","notfall",
];

const TYPE_KW = {
  flood:      ["flood","water","drowning","river","submerge","পানি","বন্যা","बाढ़"],
  fire:       ["fire","burning","flame","smoke","আগুন","incendie","feuer","fuego"],
  earthquake: ["earthquake","tremor","quake","rubble","ভূমিকম্প","भूकंप"],
  accident:   ["accident","crash","collision","vehicle","দুর্ঘটনা","दुर्घटना"],
  medical:    ["heart attack","stroke","unconscious","ambulance","hospital","icu"],
  violence:   ["shooting","attack","bomb","explosion","gunfire","stabbing"],
  collapse:   ["collapsed","building down","rubble","buried","structure"],
  landslide:  ["landslide","mudslide","hill slide"],
  storm:      ["cyclone","tornado","hurricane","typhoon","storm","ঘূর্ণিঝড়"],
  missing:    ["missing","lost","disappeared","cannot find","last seen"],
  trapped:    ["trapped","stuck","buried","elevator","mine"],
};

const FAKE_KW = ["test","testing","just kidding","joke","prank","not real","fake alert","this is a drill"];

const detectLanguage = (text) => {
  if (/[\u0980-\u09FF]/.test(text)) return "bn";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  return "en";
};

const fallbackAnalysis = (text) => {
  const lower = text.toLowerCase();
  let score = 0;
  DISTRESS_KW.forEach(kw => { if (lower.includes(kw)) score = Math.min(score + 0.13, 1); });

  let emergencyType = "other", maxHits = 0;
  Object.entries(TYPE_KW).forEach(([type, kws]) => {
    const hits = kws.filter(k => lower.includes(k)).length;
    if (hits > maxHits) { maxHits = hits; emergencyType = type; }
  });
  if (maxHits) score = Math.min(score + 0.15, 1);

  const victimMatch   = text.match(/(\d+)\s*(people|persons|victims|dead|injured|trapped|missing)/i);
  const victimCount   = victimMatch ? parseInt(victimMatch[1]) : 0;
  const coordMatch    = text.match(/(-?\d{1,3}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
  const isFake        = FAKE_KW.some(k => lower.includes(k)) && score < 0.3;
  const phoneNums     = (text.match(/\+?[\d][\d\s\-]{8,14}[\d]/g) || []).slice(0, 3);

  return {
    distressScore:           Math.round(score * 100) / 100,
    emergencyType,
    emergencyTypeConfidence: maxHits > 0 ? 0.6 : 0.2,
    language:                detectLanguage(text),
    cleanedText:             text.trim(),
    isFake,
    fakeConfidence:          isFake ? 0.75 : 0.05,
    urgencyFlags:            [],
    entities: {
      locations:    [],
      persons:      [],
      organizations:[],
      victimCount,
      landmarks:    [],
      phoneNumbers: phoneNums,
      coordinates:  coordMatch ? [`${coordMatch[1]},${coordMatch[2]}`] : [],
    },
  };
};

module.exports = { analyzeText, fallbackAnalysis };