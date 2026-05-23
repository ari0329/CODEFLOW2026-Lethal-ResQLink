"""
Distress Classifier — XLM-RoBERTa fine-tuned model
Falls back to keyword heuristic when USE_MOCK_MODELS=true (before training)
"""
import logging
import re
from config import CLASSIFIER_MODEL_PATH, USE_MOCK_MODELS, DISTRESS_KEYWORDS

logger = logging.getLogger("classifier")


class DistressClassifier:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.is_loaded = False
        self._use_mock = USE_MOCK_MODELS

    def load(self):
        if self._use_mock:
            logger.warning("USE_MOCK_MODELS=true — using keyword heuristic classifier.")
            self.is_loaded = True
            return

        try:
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            import torch

            logger.info(f"Loading classifier from {CLASSIFIER_MODEL_PATH}")
            self.tokenizer = AutoTokenizer.from_pretrained(CLASSIFIER_MODEL_PATH)
            self.model = AutoModelForSequenceClassification.from_pretrained(CLASSIFIER_MODEL_PATH)
            self.model.eval()
            self.is_loaded = True
            logger.info("Classifier loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load classifier: {e}. Falling back to mock.")
            self._use_mock = True
            self.is_loaded = True

    def predict(self, text: str) -> tuple[bool, float]:
        
        if self._use_mock:
            return self._keyword_predict(text)

        import torch

        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=256,
            padding=True,
        )
        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1)[0]

        
        distress_prob = probs[1].item()
        is_distress = distress_prob >= 0.5
        return is_distress, distress_prob

    def _keyword_predict(self, text: str) -> tuple[bool, float]:
        text_lower = text.lower()
        score = 0.0
        matched = 0

        for kw in DISTRESS_KEYWORDS:
            if kw.lower() in text_lower:
                matched += 1
                score += 0.15

        
        upper_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        if upper_ratio > 0.4:
            score += 0.15
        if re.search(r'[!?]{2,}', text):
            score += 0.1
        if re.search(r'\d+\s*(people|persons|families|children|victims)', text_lower):
            score += 0.1

        score = min(score, 0.99)
        is_distress = score >= 0.3 or matched >= 1
        return is_distress, score if is_distress else (1 - score)