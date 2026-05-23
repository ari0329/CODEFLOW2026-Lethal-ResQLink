"""
Train Distress Classifier — Fine-tune XLM-RoBERTa on your labeled dataset
Run: python training/train_classifier.py

PREREQUISITE: Place your CSV files in training/data/
  - classifier_train.csv (columns: text, label)
  - classifier_val.csv
"""
import os
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
DATA_DIR = "training/data"
OUTPUT_DIR = "models/saved/distress_classifier"
NUM_LABELS = 2
MAX_LEN = 256
BATCH_SIZE = 16
EPOCHS = 5
LEARNING_RATE = 2e-5
LABEL_MAP = {"NON_DISTRESS": 0, "DISTRESS": 1}

os.makedirs(OUTPUT_DIR, exist_ok=True)


class DistressDataset(Dataset):
    def __init__(self, texts, labels, tokenizer):
        self.encodings = tokenizer(
            list(texts), truncation=True, max_length=MAX_LEN,
            padding="max_length", return_tensors="pt"
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
    report = classification_report(labels, preds, target_names=list(LABEL_MAP.keys()), output_dict=True)
    return {
        "f1_distress": report["DISTRESS"]["f1-score"],
        "precision_distress": report["DISTRESS"]["precision"],
        "recall_distress": report["DISTRESS"]["recall"],
        "accuracy": report["accuracy"],
    }


def main():
    print("Loading datasets...")
    train_df = pd.read_csv(f"{DATA_DIR}/classifier_train.csv")
    val_df = pd.read_csv(f"{DATA_DIR}/classifier_val.csv")

    train_df["label_id"] = train_df["label"].map(LABEL_MAP)
    val_df["label_id"] = val_df["label"].map(LABEL_MAP)

    train_df = train_df.dropna(subset=["text", "label_id"])
    val_df = val_df.dropna(subset=["text", "label_id"])

    print(f"Train: {len(train_df)} | Val: {len(val_df)}")
    print(f"Class distribution:\n{train_df['label'].value_counts()}")

    print(f"Loading tokenizer: {BASE_MODEL}")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)

    train_dataset = DistressDataset(train_df["text"].values, train_df["label_id"].values, tokenizer)
    val_dataset = DistressDataset(val_df["text"].values, val_df["label_id"].values, tokenizer)

    print("Loading model...")
    model = AutoModelForSequenceClassification.from_pretrained(BASE_MODEL, num_labels=NUM_LABELS)

    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        learning_rate=LEARNING_RATE,
        warmup_steps=200,
        weight_decay=0.01,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1_distress",
        logging_steps=50,
        fp16=torch.cuda.is_available(),
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
    )

    print("Training...")
    trainer.train()

    print(f"Saving model to {OUTPUT_DIR}")
    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)

    print("Final evaluation:")
    results = trainer.evaluate()
    print(results)

    # Save model info
    import json
    with open(f"{OUTPUT_DIR}/../model_info.json", "w") as f:
        json.dump({
            "classifier": {
                "base_model": BASE_MODEL,
                "f1_distress": results.get("eval_f1_distress"),
                "accuracy": results.get("eval_accuracy"),
            }
        }, f, indent=2)

    print("✅ Classifier training complete!")


if __name__ == "__main__":
    main()