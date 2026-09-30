import re
import logging

logger = logging.getLogger("bsi.preprocessing.lang")

def detect_language(text: str) -> str:
    """
    Detects language: hi (Hindi), en (English), hinglish, or other.
    """
    if not text:
        return "en"

    # Devanagari script detection (Hindi)
    devanagari_chars = len(re.findall(r'[\u0900-\u097F]', text))
    total_chars = max(len(text), 1)

    if devanagari_chars / total_chars > 0.15:
        return "hi"

    # Hinglish detection heuristics (common romanized Hindi words)
    hinglish_keywords = {
        "kya", "hai", "hain", "nahi", "nahin", "raha", "rahi", "rahe", "kar", "bhai",
        "kaise", "sab", "yeh", "woh", "baat", "aaj", "kal", "log", "hoga", "ho", "ji",
        "wale", "pani", "barish", "bhi", "toh", "se", "ko", "par", "mein"
    }
    words = set(re.findall(r'\b[a-zA-Z]+\b', text.lower()))
    matches = words.intersection(hinglish_keywords)

    if len(matches) >= 2:
        return "hinglish"

    # Default fallback via langdetect if available
    try:
        from langdetect import detect
        code = detect(text)
        if code == 'hi':
            return 'hi'
        elif code == 'en':
            return 'en'
    except Exception:
        pass

    return "en"
