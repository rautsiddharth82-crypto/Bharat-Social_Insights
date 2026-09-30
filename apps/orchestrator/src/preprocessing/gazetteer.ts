const INDIAN_GAZETTEER: Record<string, string[]> = {
  Maharashtra: ["mumbai", "pune", "nagpur", "nashik", "thane", "konkan", "maharashtra", "dadar", "kurla"],
  Delhi: ["delhi", "new delhi", "ncr", "noida", "gurugram", "gurgaon", "anand vihar"],
  Karnataka: ["bengaluru", "bangalore", "mysuru", "karnataka"],
  TamilNadu: ["chennai", "coimbatore", "madurai", "tamil nadu"],
  Gujarat: ["ahmedabad", "surat", "vadodara", "gandhinagar", "gujarat"],
  UttarPradesh: ["lucknow", "kanpur", "varanasi", "uttar pradesh"],
  WestBengal: ["kolkata", "howrah", "west bengal"]
};

const PROFESSION_MAP: Record<string, string[]> = {
  "Journalist / Media": ["journalist", "reporter", "media", "editor", "news"],
  "Tech & Engineering": ["developer", "engineer", "software", "tech", "coder"],
  "Student / Academic": ["student", "scholar", "university", "college"],
  "Public Service & Defence": ["government", "ias", "ips", "defence", "army", "police"]
};

const INTEREST_MAP: Record<string, string[]> = {
  "Environment & AQI": ["aqi", "pollution", "rain", "flood", "weather"],
  "Infrastructure": ["railways", "metro", "traffic", "road", "subway", "train"],
  "Economy & Markets": ["economy", "market", "finance", "stocks", "upi", "crypto"]
};

export function extractDemographics(rawBio: string, text: string) {
  const combined = `${rawBio || ""} ${text || ""}`.toLowerCase();

  let region = "Unknown";
  for (const [r, kws] of Object.entries(INDIAN_GAZETTEER)) {
    if (kws.some(kw => combined.includes(kw))) {
      region = r;
      break;
    }
  }

  let profession = "General Citizen";
  for (const [p, kws] of Object.entries(PROFESSION_MAP)) {
    if (kws.some(kw => combined.includes(kw))) {
      profession = p;
      break;
    }
  }

  const interests: string[] = [];
  for (const [cat, kws] of Object.entries(INTEREST_MAP)) {
    if (kws.some(kw => combined.includes(kw))) {
      interests.push(cat);
    }
  }

  return { region, profession, interests: interests.length > 0 ? interests : ["General"] };
}
