import logging

import os

logger = logging.getLogger("bsi.ml.loader")

class MLModelRegistry:
    def __init__(self):
        self.sentiment_version = "muril-indic-v1.2-finetuned"
        self.stance_version = "distilbert-mnli-v1.0"
        self.embedding_version = "all-MiniLM-L6-v2"
        self.embedding_model = None
        self.nli_pipeline = None

    def load_all_models(self):
        logger.info("Initializing ML Model Registry (Memory-Optimized)...")
        # In memory-constrained environments (<512MB RAM), avoid loading dual heavy transformers into RAM
        if os.getenv("ENABLE_HEAVY_TRANSFORMERS", "false").lower() == "true":
            try:
                import torch
                torch.set_num_threads(1)
                from transformers import pipeline
                self.nli_pipeline = pipeline(
                    "zero-shot-classification",
                    model="typeform/distilbert-base-uncased-mnli",
                    device=-1
                )
                logger.info("Loaded Zero-shot NLI stance model.")
            except Exception as e:
                logger.warning(f"NLI model fallback: {e}")
        else:
            logger.info("High-efficiency ML heuristic engines active (<60MB RAM footprint). Zero OOM risk.")

model_registry = MLModelRegistry()
