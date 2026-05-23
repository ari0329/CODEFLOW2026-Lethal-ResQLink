"""
ResQLink AI Service — FastAPI entry point
Handles: NLP inference, Kafka ingestion pipeline, REST endpoints for direct processing
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import asyncio
import uvicorn
import logging

from config import KAFKA_BOOTSTRAP_SERVERS
from models.distress_classifier import DistressClassifier
from models.ner_extractor import NERExtractor
from models.severity_scorer import SeverityScorer
from models.duplicate_detector import DuplicateDetector
from pipelines.ingestion_pipeline import IngestionPipeline
from pipelines.geocoding import GeocodingPipeline
from utils.text_cleaner import TextCleaner
from utils.language_detector import LanguageDetector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("resqlink-ai")

app = FastAPI(title="ResQLink AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


classifier = DistressClassifier()
ner = NERExtractor()
scorer = SeverityScorer()
deduplicator = DuplicateDetector()
geocoder = GeocodingPipeline()
cleaner = TextCleaner()
lang_detector = LanguageDetector()


class MessageRequest(BaseModel):
    text: str
    source: Optional[str] = "manual"
    source_id: Optional[str] = None
    metadata: Optional[dict] = {}


class ProcessedAlert(BaseModel):
    is_distress: bool
    confidence: float
    language: str
    cleaned_text: str
    emergency_type: Optional[str]
    entities: dict
    location: Optional[dict]
    severity_score: int
    severity_level: str
    is_duplicate: bool
    source: str


@app.on_event("startup")
async def startup_event():
    logger.info("Loading AI models...")
    classifier.load()
    ner.load()
    logger.info("Models loaded. Starting Kafka consumer...")
    # Start Kafka pipeline in background
    pipeline = IngestionPipeline(classifier, ner, scorer, deduplicator, geocoder, cleaner, lang_detector)
    asyncio.create_task(pipeline.run())
    logger.info("ResQLink AI Service ready.")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "classifier_loaded": classifier.is_loaded,
        "ner_loaded": ner.is_loaded,
    }


@app.post("/process", response_model=ProcessedAlert)
async def process_message(req: MessageRequest):
    """
    Process a single message through the full NLP pipeline.
    Used for direct API testing and manual SOS submissions.
    """
    try:
        #Clean text
        cleaned = cleaner.clean(req.text)

        #Detect language
        language = lang_detector.detect(cleaned)

        #Classify distress
        is_distress, confidence = classifier.predict(cleaned)

        if not is_distress and confidence < 0.3:
            return ProcessedAlert(
                is_distress=False,
                confidence=confidence,
                language=language,
                cleaned_text=cleaned,
                emergency_type=None,
                entities={},
                location=None,
                severity_score=0,
                severity_level="NONE",
                is_duplicate=False,
                source=req.source,
            )

        #NER extraction
        entities = ner.extract(cleaned)

        #Geocoding
        location = await geocoder.resolve(entities)

        #Severity scoring
        severity_score, severity_level = scorer.score(entities, confidence, cleaned)

        #Duplicate detection
        is_duplicate = deduplicator.check(cleaned, location)

        return ProcessedAlert(
            is_distress=is_distress,
            confidence=round(confidence, 3),
            language=language,
            cleaned_text=cleaned,
            emergency_type=entities.get("emergency_type"),
            entities=entities,
            location=location,
            severity_score=severity_score,
            severity_level=severity_level,
            is_duplicate=is_duplicate,
            source=req.source,
        )

    except Exception as e:
        logger.error(f"Processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/batch-process")
async def batch_process(messages: List[MessageRequest]):
    """Process multiple messages (for bulk ingestion)."""
    results = []
    for msg in messages[:50]:  # cap at 50
        try:
            result = await process_message(msg)
            results.append(result)
        except Exception as e:
            results.append({"error": str(e), "text": msg.text[:100]})
    return results


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)