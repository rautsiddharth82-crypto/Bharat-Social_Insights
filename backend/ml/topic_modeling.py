import re
from typing import Dict, Any, Tuple

TOPIC_CATALOG = {
    "mumbai_rains": {
        "name": "Mumbai Rain Flooding & Transit",
        "keywords": ["rain", "flood", "mumbai", "subway", "train", "bmc", "mithi", "waterlogging", "मौसम"],
        "id": "topic_mumbai_rains"
    },
    "delhi_aqi": {
        "name": "Delhi Air Quality & Stubble Burning",
        "keywords": ["aqi", "delhi", "pollution", "stubble", "smog", "ncr", "air", "प्रदूषण"],
        "id": "topic_delhi_aqi"
    },
    "semicon_gujarat": {
        "name": "Semiconductor Fab & Tech Manufacturing",
        "keywords": ["semiconductor", "fab", "gujarat", "manufacturing", "tech", "chip", "electronics"],
        "id": "topic_semicon_gujarat"
    },
    "digital_payments": {
        "name": "Digital India & Financial Tech",
        "keywords": ["upi", "digital", "banking", "rupay", "fintech", "transaction", "डिजिटल"],
        "id": "topic_digital_payments"
    },
    "crypto_policy": {
        "name": "Crypto Regulation & Digital Assets",
        "keywords": ["crypto", "bitcoin", "regulation", "parliament", "currency", "traders"],
        "id": "topic_crypto_policy"
    }
}

def assign_topic(text: str) -> Tuple[str, str, list]:
    """
    Assigns topic_id, topic_name, and keywords based on semantic clustering & keyword matching.
    """
    if not text:
        return "topic_general", "General Discussion", ["general"]

    text_lower = text.lower()
    best_topic_id = "topic_general"
    best_topic_name = "General Discussion"
    best_keywords = ["general", "news"]
    max_matches = 0

    for tid, info in TOPIC_CATALOG.items():
        matches = sum(1 for kw in info["keywords"] if kw in text_lower)
        if matches > max_matches:
            max_matches = matches
            best_topic_id = info["id"]
            best_topic_name = info["name"]
            best_keywords = info["keywords"]

    return best_topic_id, best_topic_name, best_keywords
