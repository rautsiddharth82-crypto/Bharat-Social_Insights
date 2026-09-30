from typing import Dict, Any, List

ANXIETY_KEYWORDS = ["flooding", "alert", "stalled", "stuck", "worried", "panic", "aqi", "danger", "delayed", "evacuation", "warning", "चेतावनी", "जलभराव", "खतरा"]
ANGER_KEYWORDS = ["corruption", "worst", "fail", "useless", "shame", "rage", "illegal", "protest", "delay", "घोटाला", "गुस्सा", "खराब"]
SARCASM_KEYWORDS = ["great job", "amazing infra", "superb work", "wah", "kya baat hai", "obviously", "brilliant"]
SUPPORT_KEYWORDS = ["support", "bravo", "thank you", "kudos", "great initiative", "salute", "proud", "जय", "धन्यवाद"]
EXCITED_KEYWORDS = ["record", "milestone", "revolution", "breakthrough", "exciting", "launch", "game changer", "जीत", "बधाई"]
FEAR_KEYWORDS = ["death", "die", "collapse", "severe", "threat", "destroy", "fear", "खौफ", "डर"]

def predict_batch_sentiment_and_emotions(texts: List[str]) -> List[Dict[str, Any]]:
    results = []
    for text in texts:
        t_lower = text.lower() if text else ""
        
        anxiety_score = sum(1 for k in ANXIETY_KEYWORDS if k in t_lower) * 0.35
        anger_score = sum(1 for k in ANGER_KEYWORDS if k in t_lower) * 0.40
        sarcasm_score = sum(1 for k in SARCASM_KEYWORDS if k in t_lower) * 0.30
        support_score = sum(1 for k in SUPPORT_KEYWORDS if k in t_lower) * 0.40
        excitement_score = sum(1 for k in EXCITED_KEYWORDS if k in t_lower) * 0.40
        fear_score = sum(1 for k in FEAR_KEYWORDS if k in t_lower) * 0.45

        emotions = {
            "anxiety": round(min(anxiety_score, 1.0), 2),
            "anger": round(min(anger_score, 1.0), 2),
            "sarcasm": round(min(sarcasm_score, 1.0), 2),
            "support": round(min(support_score, 1.0), 2),
            "excitement": round(min(excitement_score, 1.0), 2),
            "fear": round(min(fear_score, 1.0), 2)
        }

        neg_w = emotions["anxiety"] + emotions["anger"] + emotions["fear"]
        pos_w = emotions["support"] + emotions["excitement"]

        if neg_w > pos_w and neg_w > 0.3:
            sentiment = "negative"
            score = -round(min(neg_w, 1.0), 2)
        elif pos_w > neg_w and pos_w > 0.3:
            sentiment = "positive"
            score = round(min(pos_w, 1.0), 2)
        else:
            sentiment = "neutral"
            score = 0.0

        results.append({
            "sentiment": sentiment,
            "sentiment_score": score,
            "emotions": emotions
        })

    return results
