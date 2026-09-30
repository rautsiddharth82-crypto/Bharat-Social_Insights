import logging
from typing import Any

logger = logging.getLogger("bsi.ml.loader")

class ModelRegistry:
    def __init__(self):
        self.sentiment_head = None
        self.stance_pipeline = None
        self.embedding_model = None

    def load_models(self):
        logger.info("Initializing HuggingFace AI inference models...")
        try:
            from sentence_transformers import SentenceTransformer
            # Lightweight sentence embedding model capable of Indian languages & English
            self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("SentenceTransformer embedding model loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer embedding model: {e}")
            self.embedding_model = None

        try:
            from transformers import pipeline
            # Zero-shot NLI pipeline for stance detection
            self.stance_pipeline = pipeline("zero-shot-classification", model="typeform/distilbert-base-uncased-mnli")
            logger.info("Zero-shot NLI stance detection model loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load HuggingFace NLI pipeline: {e}")
            self.stance_pipeline = None

model_registry = ModelRegistry()
