from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from ml.loader import model_registry
from ml.sentiment_emotion import predict_batch_sentiment_and_emotions
from ml.stance import predict_batch_stance
from ml.topics import predict_batch_topics
from ml.forecast import predict_batch_forecast
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bsi.ml_service")

app = FastAPI(
    title="Bharat Social Insights - ML Microservice",
    description="Stateless internal inference microservice for Sentiment, Emotion, Stance, Topic, and Forecast ML models.",
    version="1.0.0"
)

@app.on_event("startup")
def startup_event():
    try:
        model_registry.load_all_models()
    except Exception as e:
        logger.warning(f"Startup init error: {e}")

@app.get("/")
def root():
    return {
        "service": "Bharat Social Insights - ML Microservice",
        "status": "healthy",
        "version": "1.0.0",
        "models": {
            "sentiment": model_registry.sentiment_version,
            "stance": model_registry.stance_version,
            "embeddings": model_registry.embedding_version
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ml-service",
        "models": {
            "sentiment": model_registry.sentiment_version,
            "stance": model_registry.stance_version,
            "embeddings": model_registry.embedding_version
        }
    }

class SentimentRequest(BaseModel):
    texts: List[str]

@app.post("/infer/sentiment")
def infer_sentiment(req: SentimentRequest):
    return {"results": predict_batch_sentiment_and_emotions(req.texts)}

class StanceItem(BaseModel):
    text: str
    topic_name: str

class StanceRequest(BaseModel):
    items: List[StanceItem]

@app.post("/infer/stance")
def infer_stance(req: StanceRequest):
    items_dict = [{"text": item.text, "topic_name": item.topic_name} for item in req.items]
    return {"results": predict_batch_stance(items_dict)}

class TopicsRequest(BaseModel):
    texts: List[str]

@app.post("/infer/topics")
def infer_topics(req: TopicsRequest):
    return {"results": predict_batch_topics(req.texts)}

class ForecastRequest(BaseModel):
    series_list: List[List[int]]

@app.post("/infer/forecast")
def infer_forecast(req: ForecastRequest):
    return {"results": predict_batch_forecast(req.series_list)}
