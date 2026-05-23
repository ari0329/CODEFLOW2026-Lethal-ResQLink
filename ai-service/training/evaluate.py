
import os
import json
import argparse
import logging

import pandas as pd
import torch

from sklearn.metrics import (
    classification_report,
    f1_score,
    accuracy_score,
    precision_score,
    recall_score
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODELS_DIR = os.path.join(
    BASE_DIR,
    "..",
    "models",
    "saved"
)

CLASSIFIER_DIR = os.path.join(
    MODELS_DIR,
    "distress_classifier"
)

NER_DIR = os.path.join(
    MODELS_DIR,
    "ner_model"
)

# CLASSIFIER EVALUATION

def evaluate_classifier(data_path):

    from transformers import (
        AutoTokenizer,
        AutoModelForSequenceClassification
    )

    print("\n" + "=" * 60)
    print("DISTRESS CLASSIFIER EVALUATION")
    print("=" * 60)

    if not os.path.exists(data_path):
        raise FileNotFoundError(
            f"Classifier dataset not found:\n{data_path}"
        )

    if not os.path.exists(CLASSIFIER_DIR):
        raise FileNotFoundError(
            f"Classifier model not found:\n{CLASSIFIER_DIR}"
        )

    # Load label map
    label_map_path = os.path.join(
        CLASSIFIER_DIR,
        "label_map.json"
    )

    if not os.path.exists(label_map_path):
        raise FileNotFoundError(
            f"label_map.json not found:\n{label_map_path}"
        )

    with open(label_map_path, "r") as f:
        id2label = {
            int(k): v
            for k, v in json.load(f).items()
        }

    label2id = {
        v: k
        for k, v in id2label.items()
    }

    print("\nLoading classifier model...")

    tokenizer = AutoTokenizer.from_pretrained(
        CLASSIFIER_DIR
    )

    model = AutoModelForSequenceClassification.from_pretrained(
        CLASSIFIER_DIR
    )

    model.eval()

    print("\nLoading evaluation dataset...")

    df = pd.read_csv(data_path)

    required_columns = ["text", "label"]

    for col in required_columns:
        if col not in df.columns:
            raise ValueError(
                f"Missing required column '{col}'"
            )

    df = df.dropna(subset=["text", "label"])

    df["label_id"] = df["label"].map(label2id)

    df = df.dropna(subset=["label_id"])

    true_labels = df["label_id"].astype(int).tolist()

    predictions = []

    print(f"\nTotal Samples: {len(df)}")

    for _, row in df.iterrows():

        text = row["text"]

        encoding = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=256
        )

        with torch.no_grad():
            outputs = model(**encoding)

        pred_id = outputs.logits.argmax(-1).item()

        predictions.append(pred_id)

    print("\nClassification Report:\n")

    labels_sorted = [
        id2label[i]
        for i in sorted(id2label.keys())
    ]

    print(
        classification_report(
            true_labels,
            predictions,
            target_names=labels_sorted,
            zero_division=0
        )
    )

    accuracy = accuracy_score(
        true_labels,
        predictions
    )

    macro_f1 = f1_score(
        true_labels,
        predictions,
        average="macro"
    )

    precision = precision_score(
        true_labels,
        predictions,
        average="macro",
        zero_division=0
    )

    recall = recall_score(
        true_labels,
        predictions,
        average="macro",
        zero_division=0
    )

    print("=" * 60)
    print("CLASSIFIER METRICS")
    print("=" * 60)

    print(f"Accuracy      : {accuracy:.4f}")
    print(f"Macro F1      : {macro_f1:.4f}")
    print(f"Macro Precision: {precision:.4f}")
    print(f"Macro Recall   : {recall:.4f}")


# NER EVALUATION

def evaluate_ner(data_path):

    import spacy
    from spacy.training import Example

    print("\n" + "=" * 60)
    print("NER MODEL EVALUATION")
    print("=" * 60)

    if not os.path.exists(data_path):
        raise FileNotFoundError(
            f"NER dataset not found:\n{data_path}"
        )

    if not os.path.exists(NER_DIR):
        raise FileNotFoundError(
            f"NER model not found:\n{NER_DIR}"
        )

    print("\nLoading NER model...")

    nlp = spacy.load(NER_DIR)

    print("\nLoading evaluation dataset...")

    with open(data_path, "r", encoding="utf-8") as f:
        val_data = json.load(f)

    examples = []

    for item in val_data:

        text = item["text"]

        entities = [
            (
                ent["start"],
                ent["end"],
                ent["label"]
            )
            for ent in item["entities"]
        ]

        doc = nlp.make_doc(text)

        example = Example.from_dict(
            doc,
            {"entities": entities}
        )

        examples.append(example)

    print(f"\nTotal Validation Samples: {len(examples)}")

    print("\nRunning NER evaluation...")

    scores = nlp.evaluate(examples)

    print("\n" + "=" * 60)
    print("NER METRICS")
    print("=" * 60)

    print(f"NER Precision : {scores['ents_p']:.4f}")
    print(f"NER Recall    : {scores['ents_r']:.4f}")
    print(f"NER F1 Score  : {scores['ents_f']:.4f}")

    print("\nPer-Entity Scores:\n")

    if "ents_per_type" in scores:

        for label, metrics in scores["ents_per_type"].items():

            print(f"{label}")

            print(
                f"  Precision: {metrics['p']:.4f}"
            )

            print(
                f"  Recall   : {metrics['r']:.4f}"
            )

            print(
                f"  F1 Score : {metrics['f']:.4f}"
            )

            print()


# MAIN

if __name__ == "__main__":

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--task",
        choices=["classifier", "ner", "both"],
        default="both"
    )

    parser.add_argument(
        "--data",
        help="Single dataset path"
    )

    parser.add_argument(
        "--classifier-data",
        help="Classifier CSV dataset path"
    )

    parser.add_argument(
        "--ner-data",
        help="NER JSON dataset path"
    )

    args = parser.parse_args()

    try:

        if args.task == "classifier":

            if not args.data:
                raise ValueError(
                    "--data is required for classifier evaluation"
                )

            evaluate_classifier(args.data)

        elif args.task == "ner":

            if not args.data:
                raise ValueError(
                    "--data is required for NER evaluation"
                )

            evaluate_ner(args.data)

        elif args.task == "both":

            if not args.classifier_data:
                raise ValueError(
                    "--classifier-data is required"
                )

            if not args.ner_data:
                raise ValueError(
                    "--ner-data is required"
                )

            evaluate_classifier(args.classifier_data)

            evaluate_ner(args.ner_data)

        print("\n✅ Evaluation Complete!")

    except Exception as e:

        logger.exception("Evaluation failed")

        print(f"\n❌ ERROR: {str(e)}")