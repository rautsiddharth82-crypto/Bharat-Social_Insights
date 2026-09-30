from typing import List, Dict, Any

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

def predict_batch_topics(texts: List[str]) -> List[Dict[str, Any]]:
    results = []
    for text in texts:
        t_lower = text.lower() if text else ""
        best_id = "topic_general"
        best_name = "General Discussion"
        best_kws = ["general"]
        max_m = 0

        for tid, info in TOPIC_CATALOG.items():
            m = sum(1 for kw in info["keywords"] if kw in t_lower)
            if m > max_m:
                max_m = m
                best_id = info["id"]
                best_name = info["name"]
                best_kws = info["keywords"]

        results.append({
            "topic_id": best_id,
            "topic_name": best_name,
            "keywords": best_kws
        })
    return results
