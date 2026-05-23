"""
Duplicate Detector — prevents same incident from being reported multiple times
Uses TF-IDF + location proximity for similarity detection
"""
import re
import math
import logging
from collections import deque
from datetime import datetime, timedelta

logger = logging.getLogger("dedup")

_recent_alerts = deque(maxlen=500)


class DuplicateDetector:
    SIMILARITY_THRESHOLD = 0.75
    LOCATION_RADIUS_KM = 0.5  # alerts within 500m considered same location

    def check(self, text: str, location: dict) -> bool:
       
        cleaned = self._normalize(text)
        now = datetime.utcnow()

        for entry in _recent_alerts:
            if (now - entry["timestamp"]) > timedelta(hours=2):
                continue

            sim = self._jaccard_similarity(cleaned, entry["text"])

            loc_match = False
            if location and entry.get("location"):
                dist = self._haversine(
                    location.get("lat", 0), location.get("lon", 0),
                    entry["location"].get("lat", 0), entry["location"].get("lon", 0),
                )
                loc_match = dist < self.LOCATION_RADIUS_KM

            if sim > self.SIMILARITY_THRESHOLD or (sim > 0.5 and loc_match):
                logger.info(f"Duplicate detected (sim={sim:.2f}, loc_match={loc_match})")
                return True

        _recent_alerts.append({
            "text": cleaned,
            "location": location,
            "timestamp": now,
        })
        return False

    def _normalize(self, text: str) -> str:
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        return text

    def _jaccard_similarity(self, a: str, b: str) -> float:
        set_a = set(a.split())
        set_b = set(b.split())
        if not set_a or not set_b:
            return 0.0
        intersection = set_a & set_b
        union = set_a | set_b
        return len(intersection) / len(union)

    def _haversine(self, lat1, lon1, lat2, lon2) -> float:
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        return R * c