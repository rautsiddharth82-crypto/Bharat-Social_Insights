from typing import List, Dict, Any
from ml.loader import model_registry

def predict_batch_stance(items: List[Dict[str, str]]) -> List[str]:
    """
    items = [{"text": "...", "topic_name": "..."}, ...]
    Returns list of 'for', 'against', or 'neutral'.
    """
    results = []
    pipeline = model_registry.nli_pipeline

    for item in items:
        text = item.get("text", "")
        topic_name = item.get("topic_name", "General")

        if pipeline and text:
            try:
                res = pipeline(text, ["in support", "against", "neutral"], hypothesis_template=f"This post is {{}} the topic of {topic_name}.")
                top = res['labels'][0]
                if top == "in support":
                    results.append("for")
                elif top == "against":
                    results.append("against")
                else:
                    results.append("neutral")
                continue
            except Exception:
                pass

        t_lower = text.lower()
        if any(w in t_lower for w in ["against", "oppose", "worst", "fail", "protest"]):
            results.append("against")
        elif any(w in t_lower for w in ["support", "great", "favor", "welcome", "best"]):
            results.append("for")
        else:
            results.append("neutral")

    return results
