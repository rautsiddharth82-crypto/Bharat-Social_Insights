import logging
from ml.model_loader import model_registry

logger = logging.getLogger("bsi.ml.stance")

def detect_stance(text: str, topic_name: str) -> str:
    """
    Zero-shot stance detection classifying post as 'for', 'against', or 'neutral'
    towards the given topic claim.
    """
    if not text or not topic_name:
        return "neutral"

    pipeline = model_registry.stance_pipeline
    candidate_labels = ["in support", "against", "neutral"]

    if pipeline:
        try:
            hypothesis_template = f"This post is {{}} the topic of {topic_name}."
            res = pipeline(text, candidate_labels, hypothesis_template=hypothesis_template)
            top_label = res['labels'][0]
            if top_label == "in support":
                return "for"
            elif top_label == "against":
                return "against"
            else:
                return "neutral"
        except Exception as e:
            logger.warning(f"NLI stance classification error: {e}")

    # Fallback keyword heuristic stance classification
    text_lower = text.lower()
    against_kws = ["oppose", "against", "stop", "ban", "worst", "fail", "protest", "boycott", "रद्द", "विरोध"]
    for_kws = ["support", "for", "great", "favor", "welcome", "best", "praise", "समर्थन", "स्वागत"]

    against_count = sum(1 for kw in against_kws if kw in text_lower)
    for_count = sum(1 for kw in for_kws if kw in text_lower)

    if against_count > for_count:
        return "against"
    elif for_count > against_count:
        return "for"
    return "neutral"
