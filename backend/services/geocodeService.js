"use strict";
const axios  = require("axios");
const logger = require("../utils/logger");

const API_KEY = process.env.GEOCODING_API_KEY;
const BASE    = "https://api.opencagedata.com/geocode/v1/json";

// Simple TTL cache
const cache = new Map();
const CACHE_TTL = 3_600_000; // 1 hour

const cacheGet = (k) => {
  const e = cache.get(k);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) { cache.delete(k); return null; }
  return e.val;
};
const cacheSet = (k, v) => cache.set(k, { val: v, ts: Date.now() });

const parseCoords = (str) => {
  const m = str.match(/(-?\d{1,3}\.?\d*)[,\s]+(-?\d{1,3}\.?\d*)/);
  if (!m) return null;
  const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
  return (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) ? { lat, lng } : null;
};

const reverseGeocode = async (lat, lng) => {
  if (!API_KEY) return { formatted: `${lat},${lng}` };
  const { data } = await axios.get(BASE, {
    params: { q: `${lat}+${lng}`, key: API_KEY, limit: 1, no_annotations: 1 },
    timeout: 5000,
  });
  const r = data.results?.[0];
  return r ? { formatted: r.formatted, city: r.components?.city || r.components?.town, country: r.components?.country } : {};
};

const forwardGeocode = async (query) => {
  const ck = query.toLowerCase().trim();
  const cached = cacheGet(ck);
  if (cached) return cached;
  if (!API_KEY) return null;

  const { data } = await axios.get(BASE, {
    params: { q: query, key: API_KEY, limit: 1, no_annotations: 0, language: "en" },
    timeout: 5000,
  });
  if (!data.results?.length) return null;

  const r = data.results[0];
  const result = {
    type:        "Point",
    coordinates: [r.geometry.lng, r.geometry.lat],
    address:     r.formatted,
    city:        r.components?.city || r.components?.town || r.components?.village,
    country:     r.components?.country,
    geocodedFrom: query,
    confidence:  r.confidence / 10,
  };
  cacheSet(ck, result);
  return result;
};

const geocode = async (locations = [], rawCoords = []) => {
  for (const c of rawCoords) {
    const p = parseCoords(c);
    if (p) {
      try {
        const d = await reverseGeocode(p.lat, p.lng);
        return { type:"Point", coordinates:[p.lng, p.lat], address:d.formatted, city:d.city,
                 country:d.country, geocodedFrom:c, confidence:0.95 };
      } catch {}
    }
  }
  for (const loc of locations) {
    if (!loc || loc.length < 3) continue;
    try {
      const r = await forwardGeocode(loc);
      if (r) return r;
    } catch (e) {
      logger.warn(`Geocode failed for "${loc}": ${e.message}`);
    }
  }
  return null;
};

module.exports = { geocode };