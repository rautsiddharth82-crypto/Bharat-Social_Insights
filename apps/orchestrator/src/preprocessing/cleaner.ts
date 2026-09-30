const HINGLISH_MAP: Record<string, string> = {
  nhn: "nahi",
  nhi: "nahi",
  nahin: "nahi",
  bhaii: "bhai",
  plzz: "please",
  pls: "please",
  kyaaa: "kya",
  kyu: "kyun",
  rha: "raha",
  rhi: "rahi",
  paani: "pani",
  baarish: "barish"
};

export function cleanText(text: string): string {
  if (!text) return "";

  // Strip URLs
  let cleaned = text.replace(/https?:\/\/\S+|www\.\S+/g, "");

  // Normalize repeated characters (3+ -> 2)
  cleaned = cleaned.replace(/(.)\1{2,}/g, "$1$1");

  // Apply Hinglish normalization table
  const words = cleaned.split(/\s+/);
  const normalized = words.map(w => {
    const key = w.toLowerCase().replace(/[^\w]/g, "");
    return HINGLISH_MAP[key] || w;
  });

  return normalized.join(" ").trim();
}
