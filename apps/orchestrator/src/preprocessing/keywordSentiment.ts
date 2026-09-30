export interface KeywordSentimentResult {
  sentiment: "positive" | "negative" | "neutral";
  sentiment_score: number;
  emotions: {
    anxiety?: number;
    anger?: number;
    sarcasm?: number;
    support?: number;
    excitement?: number;
    fear?: number;
  };
}

const POSITIVE_WORDS = [
  "great", "good", "excellent", "amazing", "love", "thank", "thanks", "helpful",
  "best", "awesome", "wonderful", "fantastic", "positive", "support", "win",
  "success", "happy", "celebrate", "achieve", "launch", "growth", "improved",
  "safe", "relief", "solved", "fixed", "confirmed", "official", "clarified",
  "प्रशंसा", "शाबाश", "धन्यवाद", "बढ़िया", "अच्छा", "सफल", "खुश", "सुरक्षित",
  "समाधान", "हल", "पुष्टि", "स्पष्टीकरण", "उत्साह", "सहयोग", "समर्थन", "जीत"
];

const NEGATIVE_WORDS = [
  "bad", "terrible", "awful", "horrible", "worst", "hate", "angry", "anger",
  "scam", "fake", "fraud", "cheat", "fail", "failed", "failure", "wrong",
  "broken", "issue", "problem", "complaint", "complain", "stuck", "outage",
  "cut", "delay", "delayed", "cancel", "cancelled", "panic", "crisis",
  "emergency", "alert", "warning", "danger", "flood", "pollution", "smog",
  "anxiety", "anxious", "stress", "fear", "scared", "afraid", "worry", "worried",
  "tension", "hopeless", "despair", "cheated", "मुसीबत", "समस्या", "बुरा", "घटिया",
  "गड़बड़", "फर्जी", "धोखा", "घबराहट", "चिंता", "डर", "गुस्सा", "क्रोध", "नुकसान",
  "बाधा", "विलंब", "रद्द", "आपत्ति", "सतर्कता", "संकट", "चेतावनी", "बाढ़", "प्रदूषण",
  "परेशान", "हताशा", "रोना", "बेवकूफी", "ठगी"
];

const ANXIETY_WORDS = [
  "worry", "worried", "anxiety", "anxious", "panic", "scared", "afraid", "fear",
  "tension", "stress", "nervous", "hesitate", "doubt", "confused", "shocked",
  "suspicious", "suspense", "uncertain", "चिंता", "घबराहट", "डर", "भय", "हैरान",
  "संदेह", "अनिश्चितता", "घबराना", "हताश", "उदास", "बैठकी", "सटका", "टेंशन"
];

const ANGER_WORDS = [
  "angry", "anger", "furious", "outrage", "rage", "mad", "frustrated", "annoyed",
  "irritated", "hate", "shame", "shameful", "disgusting", "disgrace", "insult",
  "betray", "cheated", "क्रोध", "गुस्सा", "नाराजगी", "बदतमीजी", "अपमान", "धोखा",
  "बेइज्जती", "नफरत", "झुंड", "रोष", "आक्रोश"
];

const SUPPORT_WORDS = [
  "support", "help", "assist", "stand with", "together", "unity", "encourage",
  "motivate", "inspire", "thank", "appreciate", "great work", "salute",
  "respect", "समर्थन", "सहयोग", "साथ देना", "एकजुट", "प्रोत्साहित", "धन्यवाद",
  "आभार", "सलाम", "सम्मान", "बधाई"
];

const EXCITEMENT_WORDS = [
  "excited", "excitement", "wow", "amazing", "celebrate", "launch", "big news",
  "historic", "game changer", "breakthrough", "win", "victory", "जय", "उत्साह",
  "खुशी", "जश्न", "इतिहास", "जीत", "बड़ी खुशी", "चमत्कार"
];

const FEAR_WORDS = [
  "fear", "afraid", "scared", "terror", "threat", "dangerous", "risk",
  "emergency", "evacuate", "alert", "warning", "deadly", "fatal",
  "भय", "डर", "आतंक", "खतरा", "संकट", "चेतावनी", "भागो", "हत्या"
];

const SARCASM_MARKERS = [
  "sarcasm", "yeah right", "surely", " /s ", "obviously not", "totally ",
  "as if", "जाहिर है नहीं", "हाँ जी बिल्कुल", "बहुत बढ़िया ", "निश्चय ही"
];

function countMatches(textLower: string, wordList: string[]): number {
  let count = 0;
  for (const w of wordList) {
    const pattern = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = textLower.match(pattern);
    if (matches) count += matches.length;
  }
  return count;
}

export function analyzeSentimentKeywords(text: string): KeywordSentimentResult {
  const t = (text || "").toLowerCase();
  if (!t.trim()) {
    return {
      sentiment: "neutral",
      sentiment_score: 0.0,
      emotions: {}
    };
  }

  const posCount = countMatches(t, POSITIVE_WORDS);
  const negCount = countMatches(t, NEGATIVE_WORDS);

  const anxietyCount = countMatches(t, ANXIETY_WORDS);
  const angerCount = countMatches(t, ANGER_WORDS);
  const supportCount = countMatches(t, SUPPORT_WORDS);
  const excitementCount = countMatches(t, EXCITEMENT_WORDS);
  const fearCount = countMatches(t, FEAR_WORDS);
  const sarcasmCount = countMatches(t, SARCASM_MARKERS);

  const total = posCount + negCount + 1;
  const score = (posCount - negCount) / total;

  let sentiment: KeywordSentimentResult["sentiment"] = "neutral";
  if (score > 0.15) sentiment = "positive";
  else if (score < -0.15) sentiment = "negative";

  const emoTotal = anxietyCount + angerCount + supportCount + excitementCount + fearCount + sarcasmCount + 1;
  const emotions: KeywordSentimentResult["emotions"] = {};
  if (anxietyCount > 0) emotions.anxiety = Math.min(0.95, anxietyCount / emoTotal + 0.1);
  if (angerCount > 0) emotions.anger = Math.min(0.95, angerCount / emoTotal + 0.1);
  if (supportCount > 0) emotions.support = Math.min(0.95, supportCount / emoTotal + 0.1);
  if (excitementCount > 0) emotions.excitement = Math.min(0.95, excitementCount / emoTotal + 0.1);
  if (fearCount > 0) emotions.fear = Math.min(0.95, fearCount / emoTotal + 0.1);
  if (sarcasmCount > 0) emotions.sarcasm = Math.min(0.95, sarcasmCount / emoTotal + 0.1);

  return {
    sentiment,
    sentiment_score: Math.max(-1, Math.min(1, score)),
    emotions
  };
}
