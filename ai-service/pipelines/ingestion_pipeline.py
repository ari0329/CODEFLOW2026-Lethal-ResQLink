"""
Ingestion Pipeline — Kafka consumer that processes raw messages
through the full NLP stack and publishes results to processed-alerts topic
"""
import json
import asyncio
import logging
from datetime import datetime

from config import KAFKA_BOOTSTRAP_SERVERS, KAFKA_INPUT_TOPIC, KAFKA_OUTPUT_TOPIC, KAFKA_GROUP_ID
from utils.encryption import encrypt_field

logger = logging.getLogger("pipeline")


class IngestionPipeline:
    def __init__(self, classifier, ner, scorer, deduplicator, geocoder, cleaner, lang_detector):
        self.classifier = classifier
        self.ner = ner
        self.scorer = scorer
        self.deduplicator = deduplicator
        self.geocoder = geocoder
        self.cleaner = cleaner
        self.lang_detector = lang_detector

    async def run(self):
        try:
            from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
            await self._kafka_loop(AIOKafkaConsumer, AIOKafkaProducer)
        except ImportError:
            logger.warning("aiokafka not installed. Pipeline in standby mode.")
        except Exception as e:
            logger.error(f"Kafka connection failed: {e}. Pipeline in standby.")

    async def _kafka_loop(self, AIOKafkaConsumer, AIOKafkaProducer):
        consumer = AIOKafkaConsumer(
            KAFKA_INPUT_TOPIC,
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            group_id=KAFKA_GROUP_ID,
            value_deserializer=lambda v: json.loads(v.decode("utf-8")),
            auto_offset_reset="latest",
        )
        producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )

        await consumer.start()
        await producer.start()
        logger.info("Kafka pipeline running.")

        try:
            async for msg in consumer:
                try:
                    result = await self.process_message(msg.value)
                    if result and result.get("is_distress"):
                        await producer.send_and_wait(KAFKA_OUTPUT_TOPIC, result)
                        logger.info(f"Alert published: {result.get('emergency_type')} severity={result.get('severity_level')}")
                except Exception as e:
                    logger.error(f"Message processing error: {e}")
        finally:
            await consumer.stop()
            await producer.stop()

    async def process_message(self, raw: dict) -> dict:
        """Process one raw message through the NLP stack."""
        text = raw.get("text", "")
        if not text:
            return None

        cleaned = self.cleaner.clean(text)
        language = self.lang_detector.detect(cleaned)

        is_distress, confidence = self.classifier.predict(cleaned)
        if not is_distress:
            return None

        entities = self.ner.extract(cleaned)

        location = await self.geocoder.resolve(entities)

        severity_score, severity_level = self.scorer.score(entities, confidence, cleaned)

        is_duplicate = self.deduplicator.check(cleaned, location)

        encrypted_source_id = encrypt_field(raw.get("source_id", ""))

        return {
            "id": raw.get("id"),
            "source": raw.get("source", "unknown"),
            "source_id": encrypted_source_id,
            "original_text": text,
            "cleaned_text": cleaned,
            "language": language,
            "is_distress": is_distress,
            "confidence": round(confidence, 3),
            "emergency_type": entities.get("emergency_type"),
            "victim_count": entities.get("victim_count"),
            "location": location,
            "entities": entities,
            "severity_score": severity_score,
            "severity_level": severity_level,
            "is_duplicate": is_duplicate,
            "timestamp": raw.get("timestamp", datetime.utcnow().isoformat()),
            "status": "PENDING",
        }