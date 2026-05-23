"""Language Detector utility"""
import logging

logger = logging.getLogger("lang")


class LanguageDetector:
    def detect(self, text: str) -> str:
        try:
            from langdetect import detect
            return detect(text)
        except Exception:
            return "en"  