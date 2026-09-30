from typing import Dict, Any, List

def calculate_rumor_risk(
    anxiety_score: float,
    neg_sentiment_ratio: float,
    velocity: float,
    cross_platform_count: int,
    bot_cluster_count: int = 0
) -> Dict[str, Any]:
    """
    Computes rumor risk score [0.0 - 100.0], risk level (Low/Medium/High),
    contributing factors list, and plain-language explanation string.
    """
    # Weight factors
    w_anxiety = min(anxiety_score * 35.0, 35.0)
    w_neg = min(neg_sentiment_ratio * 25.0, 25.0)
    w_velocity = min(max(velocity, 0.0) * 20.0, 20.0)
    w_spread = min(cross_platform_count * 5.0, 15.0)
    w_bot = min(bot_cluster_count * 5.0, 10.0)

    score = round(min(w_anxiety + w_neg + w_velocity + w_spread + w_bot, 100.0), 1)

    if score >= 65.0:
        level = "High"
    elif score >= 35.0:
        level = "Medium"
    else:
        level = "Low"

    contributing_factors = []
    if anxiety_score > 0.4:
        contributing_factors.append(f"Elevated anxiety/panic index ({int(anxiety_score*100)}%) in post content")
    if neg_sentiment_ratio > 0.4:
        contributing_factors.append(f"High negative sentiment concentration ({int(neg_sentiment_ratio*100)}%)")
    if velocity > 0.3:
        contributing_factors.append(f"Rapid volume acceleration (+{int(velocity*100)}% velocity)")
    if cross_platform_count >= 3:
        contributing_factors.append(f"Simultaneous cross-platform propagation across {cross_platform_count} platforms")
    if bot_cluster_count > 0:
        contributing_factors.append(f"Detected {bot_cluster_count} coordinated bot text clusters")

    if not contributing_factors:
        contributing_factors.append("Normal conversational baseline parameters observed")

    # Generate plain-language explanation string built dynamically from actual factors
    if level == "High":
        explanation = (
            f"HIGH RUMOR RISK DETECTED: {contributing_factors[0]}. "
            f"Cross-platform tracking confirms simultaneous activity across {cross_platform_count} platforms "
            f"with a velocity spike of +{int(velocity*100)}%. Immediate verification recommended."
        )
    elif level == "Medium":
        explanation = (
            f"MODERATE RUMOR RISK: {contributing_factors[0]}. "
            f"Volume growth is accelerating at +{int(velocity*100)}% across {cross_platform_count} platforms. "
            f"Monitoring active."
        )
    else:
        explanation = (
            "LOW RUMOR RISK: Topic exhibits normal discussion flow with balanced sentiment and no unverified velocity spikes."
        )

    action_cards = [
        {
            "id": "action_1",
            "title": "Issue Official Clarification Broadcast",
            "type": "Communication",
            "description": "Deploy pre-approved fact-check bulletin to verified news channels and emergency broadcast feeds."
        },
        {
            "id": "action_2",
            "title": "Alert Ground Administration & NDRF Control",
            "type": "Response",
            "description": "Notify regional emergency responders and transit police regarding high-anxiety urban waterlogging rumors."
        },
        {
            "id": "action_3",
            "title": "Monitor Coordinated Accounts",
            "type": "Investigation",
            "description": "Flag coordination cluster accounts for automated network cascade tracing and bot isolation."
        }
    ]

    return {
        "score": score,
        "level": level,
        "contributing_factors": contributing_factors,
        "explanation": explanation,
        "action_cards": action_cards
    }
