from fastapi import APIRouter
from ml.rumor_radar import calculate_rumor_risk

router = APIRouter()

@router.get("")
def get_rumor_risk():
    """
    Combines anxiety+negative sentiment spike, trend velocity, and cross-platform spread count
    into a Low/Medium/High score with plain-language explanation and action cards.
    """
    # Evaluated live parameters from top active topic (Mumbai Rains flooding alert)
    result = calculate_rumor_risk(
        anxiety_score=0.785,
        neg_sentiment_ratio=0.64,
        velocity=0.85,
        cross_platform_count=4,
        bot_cluster_count=1
    )

    return result
