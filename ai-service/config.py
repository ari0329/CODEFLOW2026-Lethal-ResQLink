import os
from dotenv import load_dotenv

load_dotenv()

# Model paths — set these AFTER training your models
CLASSIFIER_MODEL_PATH = os.getenv("CLASSIFIER_MODEL_PATH", "models/saved/distress_classifier")
NER_MODEL_PATH = os.getenv("NER_MODEL_PATH", "models/saved/ner_model")
USE_MOCK_MODELS = os.getenv("USE_MOCK_MODELS", "true").lower() == "true"  # Set false after training

# Kafka
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
KAFKA_INPUT_TOPIC = os.getenv("KAFKA_INPUT_TOPIC", "raw-messages")
KAFKA_OUTPUT_TOPIC = os.getenv("KAFKA_OUTPUT_TOPIC", "processed-alerts")
KAFKA_GROUP_ID = os.getenv("KAFKA_GROUP_ID", "resqlink-ai")

# MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongo:27017/resqlink")

# Geocoding
GEOCODING_API_KEY = os.getenv("GEOCODING_API_KEY", "")
GEOCODING_PROVIDER = os.getenv("GEOCODING_PROVIDER", "nominatim")  
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "resqlink-dev-key-32bytes-padding!")[:32]

# Severity thresholds
SEVERITY_THRESHOLDS = {
    "CRITICAL": 85,
    "HIGH": 65,
    "MEDIUM": 40,
    "LOW": 0,
}

# Emergency type keywords (fallback when NER model not loaded)
EMERGENCY_KEYWORDS = {
    "flood": ["flood", "flooding", "water rising", "submerged", "inundated", "বন্যা", "बाढ़"],
    "fire": ["fire", "burning", "flames", "smoke", "আগুন", "आग", "incendie"],
    "earthquake": ["earthquake", "quake", "tremor", "seismic", "भूकंप", "ভূমিকম্প"],
    "medical": ["medical", "heart attack", "unconscious", "breathing", "injured", "ambulance"],
    "accident": ["accident", "crash", "collision", "vehicle", "দুর্ঘটনা", "दुर्घटना"],
    "violence": ["attack", "shooting", "violence", "gunshot", "assault", "threat"],
    "missing": ["missing", "lost", "disappeared", "cannot find", "নিখোঁজ"],
    "landslide": ["landslide", "mudslide", "collapse", "ধস"],
    "cyclone": ["cyclone", "hurricane", "tornado", "storm", "ঘূর্ণিঝড়"],
}

# Distress keywords (fallback classifier)
DISTRESS_KEYWORDS = [
    "help", "sos", "emergency", "trapped", "stuck", "save", "rescue",
    "urgent", "please", "dying", "dead", "injured", "need help",
    "বাঁচান", "সাহায্য", "আটকে", "बचाओ", "मदद", "socorro", "secours",
    "hilfe", "ajuda", "помогите", "救命", "مساعدة", "بچاؤ",
]