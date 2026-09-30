import logging

logger = logging.getLogger("bsi.ml.loader")

class MLModelRegistry:
    def __init__(self):
        self.sentiment_version = "muril-indic-v1.2-finetuned"
        self.stance_version = "distilbert-mnli-v1.0"
        self.embedding_version = "all-MiniLM-L6-v2"
        self.embedding_model = None
        self.nli_pipeline = None

    def load_all_models(self):
        logger.info("Initializing HuggingFace AI models in Python ML Service...")
        try:
            from sentence_transformers import SentenceTransformer
            self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Loaded SentenceTransformer embeddings model.")
        except Exception as e:
            logger.warning(f"Embedding model fallback: {e}")

        try:
            from transformers import pipeline
            self.nli_pipeline = pipeline("zero-shot-classification", model="typeform/distilbert-base-uncased-mnli")
            logger.info("Loaded Zero-shot NLI stance model.")
        except Exception as e:
            logger.warning(f"NLI model fallback: {e}")

model_registry = MLModelRegistry()
