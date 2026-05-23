"""
NER Extractor — spaCy + Transformers Named Entity Recognition
Extracts: LOC_COORD, LOC_ADDRESS, LOC_LANDMARK, VICTIM_COUNT, EMERGENCY_TYPE, CONTACT, TIME_REF
Falls back to regex heuristics when USE_MOCK_MODELS=true
"""
import re
import logging
from config import NER_MODEL_PATH, USE_MOCK_MODELS, EMERGENCY_KEYWORDS

logger = logging.getLogger("ner")

COORD_PATTERN = re.compile(
    r'(-?\d{1,3}\.?\d*)[°\s,]+([NSns]?)[\s,]+(-?\d{1,3}\.?\d*)[°\s,]+([EWew]?)'
)
PHONE_PATTERN = re.compile(r'(\+?\d[\d\s\-]{8,14}\d)')
NUMBER_PATTERN = re.compile(
    r'(\d+)\s*(people|persons|families|children|victims|individuals|survivors|trapped)',
    re.IGNORECASE
)
ADDRESS_PATTERN = re.compile(
    r'\d+[,\s]+[A-Za-z\s]+(road|street|lane|avenue|rd|st|ln|ave|nagar|marg|colony|sector|block)',
    re.IGNORECASE
)


class NERExtractor:
    def __init__(self):
        self.nlp = None
        self.is_loaded = False
        self._use_mock = USE_MOCK_MODELS

    def load(self):
        if self._use_mock:
            logger.warning("USE_MOCK_MODELS=true — using regex NER.")
            self.is_loaded = True
            return

        try:
            import spacy
            logger.info(f"Loading NER model from {NER_MODEL_PATH}")
            self.nlp = spacy.load(NER_MODEL_PATH)
            self.is_loaded = True
            logger.info("NER model loaded.")
        except Exception as e:
            logger.error(f"Failed to load NER model: {e}. Using regex fallback.")
            self._use_mock = True
            self.is_loaded = True

    def extract(self, text: str) -> dict:
        if self._use_mock:
            return self._regex_extract(text)

        doc = self.nlp(text)
        entities = {
            "emergency_type": None,
            "victim_count": None,
            "coordinates": None,
            "address": None,
            "landmark": None,
            "contact": None,
            "time_ref": None,
            "raw_location_string": None,
            "raw_entities": [],
        }

        for ent in doc.ents:
            entities["raw_entities"].append({"text": ent.text, "label": ent.label_})
            if ent.label_ == "EMERGENCY_TYPE" and not entities["emergency_type"]:
                entities["emergency_type"] = ent.text.lower()
            elif ent.label_ == "VICTIM_COUNT" and not entities["victim_count"]:
                entities["victim_count"] = ent.text
            elif ent.label_ == "LOC_COORD" and not entities["coordinates"]:
                entities["coordinates"] = self._parse_coord(ent.text)
            elif ent.label_ == "LOC_ADDRESS" and not entities["address"]:
                entities["address"] = ent.text
                entities["raw_location_string"] = ent.text
            elif ent.label_ == "LOC_LANDMARK" and not entities["landmark"]:
                entities["landmark"] = ent.text
                if not entities["raw_location_string"]:
                    entities["raw_location_string"] = ent.text
            elif ent.label_ == "CONTACT" and not entities["contact"]:
                entities["contact"] = ent.text
            elif ent.label_ == "TIME_REF" and not entities["time_ref"]:
                entities["time_ref"] = ent.text

        return entities

    def _regex_extract(self, text: str) -> dict:
        entities = {
            "emergency_type": None,
            "victim_count": None,
            "coordinates": None,
            "address": None,
            "landmark": None,
            "contact": None,
            "time_ref": None,
            "raw_location_string": None,
            "raw_entities": [],
        }

        text_lower = text.lower()

        for etype, keywords in EMERGENCY_KEYWORDS.items():
            for kw in keywords:
                if kw.lower() in text_lower:
                    entities["emergency_type"] = etype
                    break
            if entities["emergency_type"]:
                break

        coord_match = COORD_PATTERN.search(text)
        if coord_match:
            try:
                lat = float(coord_match.group(1))
                lon = float(coord_match.group(3))
                entities["coordinates"] = {"lat": lat, "lon": lon}
            except ValueError:
                pass

        num_match = NUMBER_PATTERN.search(text)
        if num_match:
            entities["victim_count"] = f"{num_match.group(1)} {num_match.group(2)}"

        addr_match = ADDRESS_PATTERN.search(text)
        if addr_match:
            entities["address"] = addr_match.group(0)
            entities["raw_location_string"] = addr_match.group(0)

        phone_match = PHONE_PATTERN.search(text)
        if phone_match:
            entities["contact"] = phone_match.group(1).strip()

        time_match = re.search(
            r'(since|for|about|past)\s+(\d+\s*(hour|minute|day|hr|min)s?)', text_lower
        )
        if time_match:
            entities["time_ref"] = time_match.group(0)

        landmark_match = re.search(
            r'(?:near|beside|opposite|at|in front of|behind)\s+([A-Z][a-zA-Z\s]{3,30})',
            text
        )
        if landmark_match and not entities["landmark"]:
            entities["landmark"] = landmark_match.group(1).strip()
            if not entities["raw_location_string"]:
                entities["raw_location_string"] = entities["landmark"]

        return entities

    def _parse_coord(self, coord_str: str) -> dict:
        try:
            match = COORD_PATTERN.search(coord_str)
            if match:
                return {"lat": float(match.group(1)), "lon": float(match.group(3))}
        except Exception:
            pass
        return None