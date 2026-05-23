import os
import json
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report

import torch
from torch.utils.data import Dataset

from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback,
)


BASE_MODEL = "xlm-roberta-base"

# Get absolute path of current file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# training/data folder
DATA_DIR = os.path.join(BASE_DIR, "data")

# models/saved/distress_classifier
OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "..",
    "models",
    "saved",
    "distress_classifier"
)

NUM_LABELS = 2
MAX_LEN = 256
BATCH_SIZE = 16
EPOCHS = 5
LEARNING_RATE = 2e-5

LABEL_MAP = {
    "NON_DISTRESS": 0,
    "DISTRESS": 1
}

os.makedirs(OUTPUT_DIR, exist_ok=True)

class DistressDataset(Dataset):
    def __init__(self, texts, labels, tokenizer):

        self.encodings = tokenizer(
            list(texts),
            truncation=True,
            padding="max_length",
            max_length=MAX_LEN,
            return_tensors="pt"
        )

        self.labels = torch.tensor(labels, dtype=torch.long)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return {
            "input_ids": self.encodings["input_ids"][idx],
            "attention_mask": self.encodings["attention_mask"][idx],
            "labels": self.labels[idx],
        }


def compute_metrics(eval_pred):

    logits, labels = eval_pred

    preds = np.argmax(logits, axis=-1)

    report = classification_report(
        labels,
        preds,
        target_names=list(LABEL_MAP.keys()),
        output_dict=True,
        zero_division=0
    )

    return {
        "accuracy": report["accuracy"],
        "f1_distress": report["DISTRESS"]["f1-score"],
        "precision_distress": report["DISTRESS"]["precision"],
        "recall_distress": report["DISTRESS"]["recall"],
    }


def main():

    print("=" * 60)
    print("DISTRESS CLASSIFIER TRAINING")
    print("=" * 60)

    print("\nCurrent Working Directory:")
    print(os.getcwd())

    print("\nDataset Directory:")
    print(DATA_DIR)

    train_path = os.path.join(DATA_DIR, "classifier_train.csv")
    val_path = os.path.join(DATA_DIR, "classifier_val.csv")

    print("\nChecking dataset files...")

    print("Train File:", train_path)
    print("Exists:", os.path.exists(train_path))

    print("Validation File:", val_path)
    print("Exists:", os.path.exists(val_path))

    if not os.path.exists(train_path):
        raise FileNotFoundError(
            f"\nclassifier_train.csv NOT FOUND!\nExpected path:\n{train_path}"
        )

    if not os.path.exists(val_path):
        raise FileNotFoundError(
            f"\nclassifier_val.csv NOT FOUND!\nExpected path:\n{val_path}"
        )


    print("\nLoading datasets...")

    train_df = pd.read_csv(train_path)
    val_df = pd.read_csv(val_path)

    print("\nTrain Dataset Shape:", train_df.shape)
    print("Validation Dataset Shape:", val_df.shape)


    required_columns = ["text", "label"]

    for col in required_columns:

        if col not in train_df.columns:
            raise ValueError(
                f"Missing column '{col}' in classifier_train.csv"
            )

        if col not in val_df.columns:
            raise ValueError(
                f"Missing column '{col}' in classifier_val.csv"
            )


    train_df["label_id"] = train_df["label"].map(LABEL_MAP)
    val_df["label_id"] = val_df["label"].map(LABEL_MAP)

    # Remove invalid rows
    train_df = train_df.dropna(subset=["text", "label_id"])
    val_df = val_df.dropna(subset=["text", "label_id"])

    print("\nClass Distribution:")
    print(train_df["label"].value_counts())

    print(f"\nTrain Samples: {len(train_df)}")
    print(f"Validation Samples: {len(val_df)}")


    print(f"\nLoading tokenizer: {BASE_MODEL}")

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)


    train_dataset = DistressDataset(
        train_df["text"].values,
        train_df["label_id"].values,
        tokenizer
    )

    val_dataset = DistressDataset(
        val_df["text"].values,
        val_df["label_id"].values,
        tokenizer
    )


    print("\nLoading model...")

    model = AutoModelForSequenceClassification.from_pretrained(
        BASE_MODEL,
        num_labels=NUM_LABELS
    )


    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,

        num_train_epochs=EPOCHS,

        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,

        learning_rate=LEARNING_RATE,

        warmup_steps=200,
        weight_decay=0.01,

        eval_strategy="epoch",
        save_strategy="epoch",

        load_best_model_at_end=True,
        metric_for_best_model="f1_distress",

        logging_steps=50,

        fp16=torch.cuda.is_available(),

        report_to="none"
    )

    trainer = Trainer(
        model=model,
        args=training_args,

        train_dataset=train_dataset,
        eval_dataset=val_dataset,

        compute_metrics=compute_metrics,

        callbacks=[
            EarlyStoppingCallback(
                early_stopping_patience=2
            )
        ],
    )


    print("\nStarting Training...\n")

    trainer.train()


    print(f"\nSaving model to:\n{OUTPUT_DIR}")

    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)


    print("\nRunning final evaluation...\n")

    results = trainer.evaluate()

    print(results)


    model_info_path = os.path.join(
        BASE_DIR,
        "..",
        "models",
        "saved",
        "model_info.json"
    )

    model_info = {
        "classifier": {
            "base_model": BASE_MODEL,
            "accuracy": results.get("eval_accuracy"),
            "f1_distress": results.get("eval_f1_distress"),
            "precision_distress": results.get("eval_precision_distress"),
            "recall_distress": results.get("eval_recall_distress"),
        }
    }

    with open(model_info_path, "w") as f:
        json.dump(model_info, f, indent=2)

    print("\nModel info saved:")
    print(model_info_path)

    print("\n✅ TRAINING COMPLETE!")


if __name__ == "__main__":
    main()