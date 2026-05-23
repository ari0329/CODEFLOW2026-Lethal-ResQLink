"""training/evaluate.py — Evaluate both classifier and NER model"""
import argparse, json, logging
import pandas as pd
from sklearn.metrics import classification_report, f1_score

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def evaluate_classifier(data_path, model_path):
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    import torch

    clf_path = f"{model_path}/classifier"
    tokenizer = AutoTokenizer.from_pretrained(clf_path)
    model = AutoModelForSequenceClassification.from_pretrained(clf_path)
    model.eval()

    with open(f"{clf_path}/label_map.json") as f:
        id2label = {int(k): v for k, v in json.load(f).items()}

    df = pd.read_csv(data_path).dropna(subset=["text","emergency_type"])
    label2id = {v: k for k, v in id2label.items()}
    df["label"] = df["emergency_type"].fillna("not_emergency").map(label2id)

    preds = []
    for _, row in df.iterrows():
        enc = tokenizer(row["text"], return_tensors="pt", truncation=True, max_length=256)
        with torch.no_grad():
            out = model(**enc)
        preds.append(out.logits.argmax(-1).item())

    labels = [id2label[i] for i in range(len(id2label))]
    print("\n=== Classifier Evaluation ===")
    print(classification_report(df["label"].tolist(), preds, target_names=labels))
    macro_f1 = f1_score(df["label"].tolist(), preds, average="macro")
    print(f"Macro F1: {macro_f1:.4f}")


def evaluate_ner(data_path, model_path):
    from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
    import torch
    from seqeval.metrics import classification_report as seq_report

    ner_path = f"{model_path}/ner"
    ner_pipe = pipeline("ner", model=ner_path, aggregation_strategy="simple")

    df = pd.read_csv(data_path).dropna(subset=["tokens","ner_tags"])

    true_tags, pred_tags = [], []
    for _, row in df.iterrows():
        tokens = json.loads(row["tokens"]) if isinstance(row["tokens"], str) else row["tokens"]
        gold   = json.loads(row["ner_tags"]) if isinstance(row["ner_tags"], str) else row["ner_tags"]
        text   = " ".join(tokens)
        preds  = ner_pipe(text)
        # Align predictions to token count (simplified)
        pred = ["O"] * len(tokens)
        for p in preds:
            # Simple word-index alignment
            start_tok = len(text[:p["start"]].split())
            if start_tok < len(pred):
                pred[start_tok] = p["entity_group"]
        true_tags.append(gold)
        pred_tags.append(pred)

    print("\n=== NER Evaluation ===")
    print(seq_report(true_tags, pred_tags))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--data",  required=True)
    p.add_argument("--model", default="../models/saved/emergency_ner")
    p.add_argument("--task",  choices=["classifier","ner","both"], default="both")
    a = p.parse_args()

    if a.task in ("classifier","both"):
        evaluate_classifier(a.data, a.model)
    if a.task in ("ner","both"):
        evaluate_ner(a.data, a.model)