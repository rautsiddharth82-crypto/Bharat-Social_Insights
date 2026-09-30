import re

HINGLISH_NORM_MAP = {
    "nhn": "nahi",
    "nhi": "nahi",
    "nahin": "nahi",
    "bhaii": "bhai",
    "bhaai": "bhai",
    "plzz": "please",
    "pls": "please",
    "kyaaa": "kya",
    "kyu": "kyun",
    "kyuu": "kyun",
    "hogaa": "hoga",
    "rha": "raha",
    "rhi": "rahi",
    "rhe": "rahe",
    "aaj": "aaj",
    "subah": "subah",
    "paani": "pani",
    "baarish": "barish"
}

def clean_text(text: str) -> str:
    if not text:
        return ""

    # Strip URLs
    text = re.sub(r'https?://\S+|www\.\S+', '', text)

    # Normalize repeated characters (3+ consecutive -> 2)
    text = re.sub(r'(.)\1{2,}', r'\1\1', text)

    # Replace common Hinglish variants
    words = text.split()
    normalized_words = []
    for w in words:
        clean_w = re.sub(r'[^\w]', '', w.lower())
        if clean_w in HINGLISH_NORM_MAP:
            normalized_words.append(HINGLISH_NORM_MAP[clean_w])
        else:
            normalized_words.append(w)

    cleaned = " ".join(normalized_words)
    return cleaned.strip()
