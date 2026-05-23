import os
import random
import json
import pandas as pd
from faker import Faker

fake = Faker()
random.seed(42)


BASE_DIR = "ai-service/training/data"
os.makedirs(BASE_DIR, exist_ok=True)

# SAMPLE DATA POOLS

DISTRESS_TEMPLATES = [
    "help flood water entering our house near {location}",
    "please rescue {count} people trapped near {location}",
    "fire broke out in apartment at {location}",
    "earthquake damage severe around {location}",
    "need ambulance urgently at {location}",
    "family stuck on rooftop near {location}",
    "SOS no food or water since {time}",
    "child injured after accident near {location}",
    "building collapsed near {location}",
    "trapped in flood please help us near {location}",
    "call emergency rescue team at {location}",
    "boat overturned near {location} people drowning",
    "need oxygen support immediately at {location}",
    "landslide blocked road near {location}",
    "people trapped under debris near {location}",
]

NON_DISTRESS_TEMPLATES = [
    "watching cricket match tonight",
    "going to office now",
    "weather is very nice today",
    "learning machine learning and AI",
    "new movie released this weekend",
    "travelling to {location} tomorrow",
    "market price increased today",
    "family dinner was amazing",
    "reading a good book tonight",
    "working on my college project",
    "just bought a new phone",
    "music concert happening near {location}",
    "shopping mall crowded today",
    "attending online classes now",
    "morning walk near {location}",
]

LOCATIONS = [
    "Howrah Bridge",
    "MG Road Kolkata",
    "Salt Lake Sector V",
    "Park Street",
    "Mumbai Central",
    "Delhi Market",
    "Chennai Beach",
    "Bangalore City Mall",
    "Kolkata Station",
    "City Hospital",
    "Main Road",
    "Airport Gate",
]

TIMES = [
    "2 hours",
    "3am",
    "5 hours",
    "midnight",
    "yesterday",
]

LANGUAGES = ["en", "bn", "hi", "es", "fr", "ar"]

# TEXT AUGMENTATION

def augment_text(text):
    replacements = {
        "help": "hlp",
        "please": "pls",
        "emergency": "emrgncy",
        "people": "ppl",
        "urgent": "urgnt",
    }

    for k, v in replacements.items():
        if random.random() < 0.3:
            text = text.replace(k, v)

    if random.random() < 0.2:
        text += " !!!"

    return text

# CLASSIFIER DATASET GENERATION

def generate_classifier_dataset(rows=30000):
    data = []

    for i in range(rows):
        label = random.choice(["DISTRESS", "NON_DISTRESS"])
        language = random.choice(LANGUAGES)

        if label == "DISTRESS":
            template = random.choice(DISTRESS_TEMPLATES)
        else:
            template = random.choice(NON_DISTRESS_TEMPLATES)

        text = template.format(
            location=random.choice(LOCATIONS),
            count=random.randint(1, 20),
            time=random.choice(TIMES)
        )

        text = augment_text(text)

        data.append({
            "text": text,
            "label": label,
            "language": language
        })

    df = pd.DataFrame(data)
    df = df.sample(frac=1).reset_index(drop=True)

    train = df.iloc[:24000]
    val = df.iloc[24000:27000]
    test = df.iloc[27000:30000]

    train.to_csv(f"{BASE_DIR}/classifier_train.csv", index=False)
    val.to_csv(f"{BASE_DIR}/classifier_val.csv", index=False)
    test.to_csv(f"{BASE_DIR}/classifier_test.csv", index=False)

    print("Classifier datasets generated successfully.")

# NER DATASET GENERATION

def create_ner_sample():
    location = random.choice(LOCATIONS)
    emergency = random.choice([
        "flood",
        "fire",
        "earthquake",
        "accident",
        "landslide"
    ])
    victim_count = f"{random.randint(1, 15)} people"

    text = f"help trapped near {location} {emergency} {victim_count} need rescue"

    entities = []

    loc_start = text.find(location)
    entities.append({
        "start": loc_start,
        "end": loc_start + len(location),
        "label": "LOC_LANDMARK"
    })

    emer_start = text.find(emergency)
    entities.append({
        "start": emer_start,
        "end": emer_start + len(emergency),
        "label": "EMERGENCY_TYPE"
    })

    vic_start = text.find(victim_count)
    entities.append({
        "start": vic_start,
        "end": vic_start + len(victim_count),
        "label": "VICTIM_COUNT"
    })

    return {
        "text": text,
        "entities": entities
    }


def generate_ner_dataset(rows=30000):
    dataset = [create_ner_sample() for _ in range(rows)]

    train = dataset[:24000]
    val = dataset[24000:27000]
    test = dataset[27000:30000]

    with open(f"{BASE_DIR}/ner_train.json", "w", encoding="utf-8") as f:
        json.dump(train, f, indent=2, ensure_ascii=False)

    with open(f"{BASE_DIR}/ner_val.json", "w", encoding="utf-8") as f:
        json.dump(val, f, indent=2, ensure_ascii=False)

    with open(f"{BASE_DIR}/ner_test.json", "w", encoding="utf-8") as f:
        json.dump(test, f, indent=2, ensure_ascii=False)

    print("NER datasets generated successfully.")

# MAIN EXECUTION

if __name__ == "__main__":
    generate_classifier_dataset(rows=30000)
    generate_ner_dataset(rows=30000)

    print("\nAll 6 dataset files created successfully.")
    print(f"Saved inside: {BASE_DIR}")
