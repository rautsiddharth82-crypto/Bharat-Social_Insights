import re
from typing import Dict, Any

ANXIETY_KEYWORDS = ["flooding", "alert", "stalled", "stuck", "worried", "panic", "aqi", "danger", "delayed", "evacuation", "warning", "चेतावनी", "जलभराव", "खतरा"]
ANGER_KEYWORDS = ["corruption", "worst", "fail", "useless", "shame", "rage", "illegal", "protest", "delay", "घोटाला", "गुस्सा", "खराब"]
SARCASM_KEYWORDS = ["great job", "amazing infra", "superb work", "wah", "kya baat hai", "obviously", "brilliant"]
SUPPORT_KEYWORDS = ["support", "bravo", "thank you", "kudos", "great initiative", "salute", "proud", "जय", "धन्यवाद"]
EXCITED_KEYWORDS = ["record", "milestone", "revolution", "breakthrough", "exciting", "launch", "game changer", "जीत", "बधाई"]
FEAR_KEYWORDS = ["death", "die", "collapse", "severe", "threat", "destroy", "fear", "खौफ", "डर"]

def analyze_sentiment_and_emotions(text: str) -> Dict[str, Any]:
    text_lower = text.lower() if text else ""

    # Emotion scoring heuristic initialized from text lexicon + semantic features
    anxiety_score = sum(1 for k in ANXIETY_KEYWORDS if k in text_lower) * 0.35
    anger_score = sum(1 for k in ANGER_KEYWORDS if k in text_lower) * 0.40
    sarcasm_score = sum(1 for k in SARCASM_KEYWORDS if k in text_lower) * 0.30
    support_score = sum(1 for k in SUPPORT_KEYWORDS if k in text_lower) * 0.40
    excitement_score = sum(1 for k in EXCITED_KEYWORDS if k in text_lower) * 0.40
    fear_score = sum(1 for k in FEAR_KEYWORDS if k in text_lower) * 0.45

    # Normalize to range [0.0, 1.0]
    emotions = {
        "anxiety": round(min(anxiety_score, 1.0), 2),
        "anger": round(min(anger_score, 1.0), 2),
        "sarcasm": round(min(sarcasm_score, 1.0), 2),
        "support": round(min(support_score, 1.0), 2),
        "excitement": round(min(excitement_score, 1.0), 2),
        "fear": round(min(fear_score, 1.0), 2)
    }

    # Determine polarity
    neg_weight = emotions["anxiety"] + emotions["anger"] + emotions["fear"]
    pos_weight = emotions["support"] + emotions["excitement"]

    if neg_weight > pos_weight and neg_weight > 0.3:
        sentiment = "negative"
        sentiment_score = -round(min(neg_weight, 1.0), 2)
    elif pos_weight > neg_weight and pos_weight > 0.3:
        sentiment = "positive"
        sentiment_score = round(min(pos_weight, 1.0), 2)
    else:
        sentiment = "neutral"
        sentiment_score = 0.0

    return {
        "sentiment": sentiment,
        "sentiment_score": sentiment_score,
        "emotions": emotions
    }
