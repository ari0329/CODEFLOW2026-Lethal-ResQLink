"""
Train NER Model — spaCy v3 with custom labels
Run: python training/train_ner.py

PREREQUISITE: Place annotated data in training/data/
  - ner_train.json  (spaCy v3 DocBin format or list of {text, entities})
  - ner_val.json
"""
import json
import random
import os
from pathlib import Path

DATA_DIR = Path("training/data")
OUTPUT_DIR = Path("models/saved/ner_model")
BASE_MODEL = "xx_ent_wiki_sm"  # multilingual spaCy model (install: python -m spacy download xx_ent_wiki_sm)
ITERATIONS = 30
DROPOUT = 0.3
BATCH_SIZE = 8
LABELS = ["LOC_COORD", "LOC_ADDRESS", "LOC_LANDMARK", "VICTIM_COUNT", "EMERGENCY_TYPE", "CONTACT", "TIME_REF"]

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def load_data(path: Path):
    with open(path) as f:
        data = json.load(f)
    training_data = []
    for item in data:
        text = item["text"]
        entities = [(e["start"], e["end"], e["label"]) for e in item["entities"]]
        training_data.append((text, {"entities": entities}))
    return training_data


def main():
    import spacy
    from spacy.training import Example
    from spacy.util import minibatch, compounding

    print("Loading data...")
    train_data = load_data(DATA_DIR / "ner_train.json")
    val_data = load_data(DATA_DIR / "ner_val.json")
    print(f"Train: {len(train_data)} | Val: {len(val_data)}")

   
    try:
        nlp = spacy.load(BASE_MODEL)
        print(f"Loaded base model: {BASE_MODEL}")
    except OSError:
        print(f"Base model {BASE_MODEL} not found. Using blank multilingual model.")
        nlp = spacy.blank("xx")

    if "ner" not in nlp.pipe_names:
        ner = nlp.add_pipe("ner", last=True)
    else:
        ner = nlp.get_pipe("ner")

    for label in LABELS:
        ner.add_label(label)

    train_examples = []
    for text, annotations in train_data:
        doc = nlp.make_doc(text)
        example = Example.from_dict(doc, annotations)
        train_examples.append(example)

    other_pipes = [pipe for pipe in nlp.pipe_names if pipe != "ner"]
    best_f1 = 0.0

    print("Training NER...")
    with nlp.disable_pipes(*other_pipes):
        optimizer = nlp.begin_training()
        for itn in range(ITERATIONS):
            random.shuffle(train_examples)
            losses = {}
            batches = minibatch(train_examples, size=compounding(4.0, BATCH_SIZE, 1.001))
            for batch in batches:
                nlp.update(batch, drop=DROPOUT, losses=losses, sgd=optimizer)

            # Evaluate on val set
            val_examples = []
            for text, annotations in val_data:
                doc = nlp.make_doc(text)
                val_examples.append(Example.from_dict(doc, annotations))
            scores = nlp.evaluate(val_examples)
            ent_f = scores.get("ents_f", 0)

            print(f"Iter {itn+1}/{ITERATIONS} | Loss: {losses.get('ner', 0):.2f} | NER F1: {ent_f:.3f}")

            if ent_f > best_f1:
                best_f1 = ent_f
                nlp.to_disk(OUTPUT_DIR)
                print(f"  ✅ Saved new best model (F1={best_f1:.3f})")

    print(f"\nTraining complete. Best NER F1: {best_f1:.3f}")
    print(f"Model saved to: {OUTPUT_DIR}")

    # Update model_info.json
    info_path = OUTPUT_DIR.parent / "model_info.json"
    try:
        with open(info_path) as f:
            info = json.load(f)
    except Exception:
        info = {}
    info["ner"] = {"base_model": BASE_MODEL, "f1": best_f1, "labels": LABELS}
    with open(info_path, "w") as f:
        json.dump(info, f, indent=2)


if __name__ == "__main__":
    main()