"""
Severity Scorer — assigns 0-100 score + level to each distress alert
"""
import re
from config import SEVERITY_THRESHOLDS


class SeverityScorer:
    HIGH_SEVERITY_TYPES = {"fire", "earthquake", "violence", "cyclone", "landslide"}
    MED_SEVERITY_TYPES = {"flood", "medical", "accident", "missing"}
    URGENCY_WORDS = [
        "dying", "dead", "critical", "unconscious", "cannot breathe",
        "bleeding", "trapped", "sinking", "no exit", "no food", "no water",
    ]

    def score(self, entities: dict, confidence: float, text: str) -> tuple[int, str]:
        score = 0

        score += int(confidence * 30)  
        etype = entities.get("emergency_type")
        if etype in self.HIGH_SEVERITY_TYPES:
            score += 30
        elif etype in self.MED_SEVERITY_TYPES:
            score += 20
        elif etype:
            score += 10

        victim_str = entities.get("victim_count", "") or ""
        num_match = re.search(r'\d+', victim_str)
        if num_match:
            count = int(num_match.group())
            if count >= 10:
                score += 20
            elif count >= 3:
                score += 10
            else:
                score += 5

        text_lower = text.lower()
        for uw in self.URGENCY_WORDS:
            if uw in text_lower:
                score += 5
                break  # cap at one match to avoid over-scoring

        if entities.get("coordinates"):
            score += 5

        score = min(score, 100)

        level = "LOW"
        for lvl, threshold in sorted(SEVERITY_THRESHOLDS.items(), key=lambda x: -x[1]):
            if score >= threshold:
                level = lvl
                break

        return score, level