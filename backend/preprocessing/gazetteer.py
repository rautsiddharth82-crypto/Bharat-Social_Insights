import re
from typing import Dict, Any, List

INDIAN_GAZETTEER = {
    "Maharashtra": ["mumbai", "pune", "nagpur", "nashik", "thane", "konkan", "maharashtra", "dadar", "kurla"],
    "Delhi": ["delhi", "new delhi", "ncr", "noida", "gurugram", "gurgaon", "anand vihar"],
    "Karnataka": ["bengaluru", "bangalore", "mysuru", "hubli", "karnataka"],
    "Tamil Nadu": ["chennai", "coimbatore", "madurai", "tamil nadu"],
    "Gujarat": ["ahmedabad", "surat", "vadodara", "gandhinagar", "gujarat"],
    "Uttar Pradesh": ["lucknow", "kanpur", "varanasi", "noida", "ghaziabad", "uttar pradesh", "up"],
    "West Bengal": ["kolkata", "howrah", "west bengal", "bengal"],
    "Telangana": ["hyderabad", "secunderabad", "telangana"],
    "Kerala": ["kochi", "thiruvananthapuram", "trivandrum", "kerala"],
    "Punjab": ["chandigarh", "ludhiana", "amritsar", "punjab"]
}

PROFESSION_KEYWORDS = {
    "Journalist / Media": ["journalist", "reporter", "media", "editor", "news", "correspondent", "anchor"],
    "Tech & Engineering": ["developer", "engineer", "software", "tech", "programmer", "coder", "data scientist"],
    "Student / Academic": ["student", "scholar", "phd", "university", "college", "student leader"],
    "Public Service & Defence": ["government", "ias", "ips", "defence", "army", "police", "civil servant"],
    "Business & Trader": ["entrepreneur", "trader", "business", "founder", "investor", "crypto"]
}

INTEREST_KEYWORDS = {
    "Politics & Governance": ["politics", "governance", "policy", "election", "bjp", "inc", "aap", "govt"],
    "Environment & AQI": ["environment", "aqi", "pollution", "climate", "rain", "flood", "weather"],
    "Economy & Markets": ["economy", "market", "finance", "stocks", "upi", "fintech", "crypto"],
    "Infrastructure": ["railways", "metro", "traffic", "road", "subway", "train", "bridge"]
}

def extract_demographics(raw_bio: str, post_text: str) -> Dict[str, Any]:
    combined_text = f"{raw_bio or ''} {post_text or ''}".lower()

    # Region matching
    detected_region = "Unknown"
    for region, keywords in INDIAN_GAZETTEER.items():
        if any(re.search(r'\b' + re.escape(kw) + r'\b', combined_text) for kw in keywords):
            detected_region = region
            break

    # Profession matching
    detected_profession = "General Citizen"
    for prof, keywords in PROFESSION_KEYWORDS.items():
        if any(re.search(r'\b' + re.escape(kw) + r'\b', combined_text) for kw in keywords):
            detected_profession = prof
            break

    # Interests matching
    detected_interests = []
    for category, keywords in INTEREST_KEYWORDS.items():
        if any(re.search(r'\b' + re.escape(kw) + r'\b', combined_text) for kw in keywords):
            detected_interests.append(category)

    if not detected_interests:
        detected_interests = ["General Discussion"]

    return {
        "region": detected_region,
        "profession": detected_profession,
        "interests": detected_interests
    }
