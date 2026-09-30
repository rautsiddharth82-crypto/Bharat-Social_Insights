export function detectLanguage(text: string): string {
  if (!text) return "en";

  // Devanagari character count for Hindi
  const devanagariMatches = text.match(/[\u0900-\u097F]/g);
  if (devanagariMatches && devanagariMatches.length / text.length > 0.15) {
    return "hi";
  }

  // Common Hinglish keywords
  const hinglishKeywords = ["kya", "hai", "hain", "nahi", "raha", "rahi", "rahe", "kar", "bhai", "sab", "yeh", "woh", "baat", "aaj", "barish", "pani"];
  const words = text.toLowerCase().split(/\W+/);
  const matches = words.filter(w => hinglishKeywords.includes(w));

  if (matches.length >= 2) {
    return "hinglish";
  }

  return "en";
}
