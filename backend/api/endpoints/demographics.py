from fastapi import APIRouter
from database.postgres import get_sync_db_conn

router = APIRouter()

def apply_k_anonymity(buckets: list, threshold: int = 5) -> list:
    """
    Enforces k-anonymity threshold (n >= 5) in API layer.
    Any bucket with count < threshold returns {suppressed: true} instead of count/value.
    """
    processed = []
    for b in buckets:
        count = b.get("value", 0) or b.get("count", 0)
        if count < threshold:
            processed.append({
                "name": b.get("name"),
                "value": 0,
                "suppressed": True,
                "note": "k-anonymity (n<5) suppressed"
            })
        else:
            processed.append({
                "name": b.get("name"),
                "value": count,
                "suppressed": False
            })
    return processed

@router.get("/summary")
def get_demographics_summary():
    raw_regions = [
        {"name": "Maharashtra", "value": 4850},
        {"name": "Delhi", "value": 2420},
        {"name": "Karnataka", "value": 1890},
        {"name": "Gujarat", "value": 1450},
        {"name": "Tamil Nadu", "value": 980},
        {"name": "Uttar Pradesh", "value": 750},
        {"name": "West Bengal", "value": 410},
        {"name": "Sikkim", "value": 3},      # Under k-anonymity threshold!
        {"name": "Nagaland", "value": 2}      # Under k-anonymity threshold!
    ]

    raw_professions = [
        {"name": "Journalist / Media", "value": 3400},
        {"name": "Tech & Engineering", "value": 2890},
        {"name": "Public Service & Defence", "value": 1420},
        {"name": "Student / Academic", "value": 980},
        {"name": "Business & Trader", "value": 720},
        {"name": "Niche Researcher", "value": 4}  # Under k-anonymity threshold!
    ]

    raw_languages = [
        {"name": "English", "value": 5200},
        {"name": "Hindi", "value": 3800},
        {"name": "Hinglish", "value": 2900},
        {"name": "Sanskrit", "value": 1}          # Under k-anonymity threshold!
    ]

    # Enforce k-anonymity threshold n >= 5 strictly in the API layer
    regions_sanitized = apply_k_anonymity(raw_regions, threshold=5)
    professions_sanitized = apply_k_anonymity(raw_professions, threshold=5)
    languages_sanitized = apply_k_anonymity(raw_languages, threshold=5)

    return {
        "k_threshold": 5,
        "region_distribution": regions_sanitized,
        "profession_distribution": professions_sanitized,
        "language_distribution": languages_sanitized
    }
