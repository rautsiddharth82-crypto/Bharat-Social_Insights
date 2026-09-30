import os
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from datasets import Dataset

def train_sentiment_head():
    print("Initializing fine-tuning script for MuRIL/IndicBERT sentiment head...")

    model_name = "google/muril-base-cased"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=3)

    # Labeled training dataset sample (Indian multilingual sentiment corpus)
    raw_data = {
        "text": [
            "Heavy rain flooding alert in Mumbai, central railway stalled!",
            "Digital India milestone achieved, awesome achievement!",
            "Normal traffic conditions on Delhi ring road today.",
            "मुंबई में भारी बारिश, प्रशासन सतर्क।",
            "देश का नया विकास देखकर बहुत गर्व है!"
        ],
        "label": [2, 0, 1, 2, 0]  # 0: positive, 1: neutral, 2: negative
    }

    dataset = Dataset.from_dict(raw_data)

    def tokenize_function(examples):
        return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=128)

    tokenized_datasets = dataset.map(tokenize_function, batched=True)

    training_args = TrainingArguments(
        output_dir="./results",
        num_train_epochs=1,
        per_device_train_batch_size=2,
        logging_steps=10,
        save_strategy="no"
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_datasets
    )

    print("Starting fine-tuning trainer...")
    trainer.train()

    # Save fine-tuned checkpoint
    os.makedirs("./checkpoints/muril_sentiment", exist_ok=True)
    model.save_pretrained("./checkpoints/muril_sentiment")
    tokenizer.save_pretrained("./checkpoints/muril_sentiment")
    print("Fine-tuned checkpoint successfully saved to ./checkpoints/muril_sentiment")

if __name__ == "__main__":
    train_sentiment_head()
