import { Collector } from "./base.js";
import { Post } from "@bsi/types";
import { config } from "../config.js";
import { statusTracker } from "./statusTracker.js";
import axios from "axios";
import { analyzeSentimentKeywords } from "../preprocessing/keywordSentiment.js";

export class TwitterCollector implements Collector {
  platformName = "twitter";

  private readonly SEARCH_QUERIES = [
    "Mumbai rains flooding",
    "Delhi AQI pollution",
    "India defence news",
    "India semiconductor fab",
    "Digital India UPI",
    "India education exam",
  ];

  isConfigured(): boolean {
    return Boolean(config.connectors.twitterBearerToken);
  }

  async fetch(): Promise<Post[]> {
    if (this.isConfigured()) {
      try {
        const url = "https://api.twitter.com/2/tweets/search/recent";
        const allPosts: Post[] = [];

        for (const query of this.SEARCH_QUERIES) {
          try {
            const res = await axios.get(url, {
              headers: { Authorization: `Bearer ${config.connectors.twitterBearerToken}` },
              params: {
                query: `${query} -is:retweet lang:en`,
                max_results: 10,
                "tweet.fields": "created_at,public_metrics,lang,source",
                expansions: "author_id",
                "user.fields": "name,username,description,verified"
              }
            });

            const tweets = res.data?.data || [];
            const users = res.data?.includes?.users || [];
            const userMap: Record<string, any> = {};
            for (const u of users) userMap[u.id] = u;

            for (const tw of tweets) {
              const user = userMap[tw.author_id] || {};
              const text = tw.text || "";
              const sentiment = analyzeSentimentKeywords(text);
              const topic = this.inferTopic(text + " " + query);
              const region = this.inferRegion(text);
              const metrics = tw.public_metrics || {};

              allPosts.push({
                platform: "twitter",
                post_id: `tw_${tw.id}`,
                author_id: user.username || `tw_usr_${tw.author_id}`,
                text,
                timestamp: tw.created_at || new Date().toISOString(),
                likes: metrics.like_count || 0,
                shares: metrics.retweet_count || 0,
                comments_count: metrics.reply_count || 0,
                language: tw.lang || this.detectLanguage(text),
                raw_bio: user.description || `Twitter: ${user.name || "User"}`,
                forward_count: metrics.retweet_count || 1,
                is_suspected_bot: this.isLikelyBot(user, text),
                region,
                profession: this.inferProfession(user.description || "", text),
                interests: this.extractInterests(text),
                sentiment: sentiment.sentiment,
                sentiment_score: sentiment.sentiment_score,
                emotions: sentiment.emotions,
                stance: sentiment.sentiment === "positive" ? "for" : sentiment.sentiment === "negative" ? "against" : "neutral",
                topic_id: topic.id,
                topic_name: topic.name,
                is_demo_sample: false
              });
            }
          } catch (qErr: any) {
            console.warn(`Twitter query "${query}" failed:`, qErr.message);
          }
        }

        if (allPosts.length > 0) {
          await statusTracker.updateStatus("twitter", true, `Active (X API v2) - ${allPosts.length} posts`, false);
          return allPosts.slice(0, 50);
        }

        await statusTracker.updateStatus("twitter", true, "Active (no new items)", true);
        return this.getFallbackSeed();
      } catch (err: any) {
        await statusTracker.updateStatus("twitter", true, "Error", false, err.message);
        return this.getFallbackSeed();
      }
    } else {
      await statusTracker.updateStatus("twitter", false, "Standby (no credentials)", true);
      return this.getFallbackSeed();
    }
  }

  private detectLanguage(text: string): string {
    const devanagari = /[\u0900-\u097F]/.test(text);
    const latin = /[a-zA-Z]/.test(text);
    if (devanagari && latin) return "hinglish";
    if (devanagari) return "hi";
    return "en";
  }

  private isLikelyBot(user: any, _text: string): boolean {
    const name: string = user.name || "";
    const desc: string = user.description || "";
    const uname: string = user.username || "";
    const botPatterns = /(bot|updates|news|alert|breaking|tracking|feed)/i;
    if (botPatterns.test(uname) || botPatterns.test(name) || (!desc && user.verified === false)) return true;
    return false;
  }

  private inferRegion(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes("mumbai") || lower.includes("maharashtra") || lower.includes("bmc")) return "Maharashtra";
    if (lower.includes("delhi") || lower.includes("ncr") || lower.includes("gurgaon") || lower.includes("noida")) return "Delhi";
    if (lower.includes("bangalore") || lower.includes("bengaluru") || lower.includes("karnataka")) return "Karnataka";
    if (lower.includes("gujarat") || lower.includes("ahmedabad") || lower.includes("surat")) return "Gujarat";
    if (lower.includes("chennai") || lower.includes("tamil")) return "Tamil Nadu";
    if (lower.includes("rajasthan") || lower.includes("jaipur")) return "Rajasthan";
    if (lower.includes("uttar pradesh") || lower.includes("up ") || lower.includes("lucknow")) return "Uttar Pradesh";
    return "Unknown";
  }

  private inferProfession(bio: string, text: string): string {
    const combined = (bio + " " + text).toLowerCase();
    if (/(journalist|reporter|media|news|press|pib)/.test(combined)) return "Journalist / Media";
    if (/(teacher|professor|education|student|exam|neet|jee|coaching)/.test(combined)) return "Education & Academia";
    if (/(doctor|health|medical|hospital|patient|covid|vaccine)/.test(combined)) return "Healthcare";
    if (/(army|defence|navy|air force|security|police|border)/.test(combined)) return "Public Service & Defence";
    if (/(tech|software|ai|startup|engineer|developer|coding)/.test(combined)) return "Tech & Engineering";
    if (/(farmer|kisan|agriculture|crop|mandi|pump|tubewell)/.test(combined)) return "Agriculture & Rural";
    if (/(minister|govt|government|bjp|congress|parliament|election|policy)/.test(combined)) return "Politics & Policy";
    return "General Public";
  }

  private inferTopic(text: string): { id: string; name: string } {
    const lower = text.toLowerCase();
    if (lower.includes("mumbai") || lower.includes("rain") || lower.includes("flood") || lower.includes("monsoon") || lower.includes("bmc")) return { id: "topic_mumbai_rains", name: "Mumbai Rain Flooding & Transit" };
    if (lower.includes("delhi") || lower.includes("pollution") || lower.includes("aqi") || lower.includes("smog") || lower.includes("stubble")) return { id: "topic_delhi_aqi", name: "Delhi Air Quality & Stubble Burning" };
    if (lower.includes("semiconductor") || lower.includes("fab") || lower.includes("chip") || lower.includes("manufacturing") || lower.includes("gujarat")) return { id: "topic_semicon_gujarat", name: "Semiconductor Fab & Manufacturing" };
    if (lower.includes("digital") || lower.includes("upi") || lower.includes("payment") || lower.includes("fintech") || lower.includes("dbt")) return { id: "topic_digital_payments", name: "Digital India & Fintech" };
    if (lower.includes("defence") || lower.includes("army") || lower.includes("navy") || lower.includes("air force") || lower.includes("security")) return { id: "topic_defence_news", name: "Defence & Security Updates" };
    if (lower.includes("neet") || lower.includes("exam") || lower.includes("jee") || lower.includes("education") || lower.includes("admit") || lower.includes("result")) return { id: "topic_exam_news", name: "Education & Examination News" };
    if (lower.includes("crypto") || lower.includes("bitcoin") || lower.includes("regulation")) return { id: "topic_crypto_policy", name: "Crypto Regulation Policy" };
    return { id: "topic_general", name: "General Discussion" };
  }

  private extractInterests(text: string): string[] {
    const interests: string[] = [];
    const lower = text.toLowerCase();
    const keywords: Record<string, string[]> = {
      "Environment & AQI": ["rain", "flood", "pollution", "aqi", "air quality", "climate", "weather", "monsoon", "smog"],
      "Infrastructure": ["metro", "railway", "train", "road", "bridge", "construction", "highway", "transport", "evacuation"],
      "Defence & Security": ["defence", "army", "navy", "air force", "border", "security", "terror", "army"],
      "Health": ["covid", "hospital", "vaccine", "health", "disease", "medical", "patient", "medicine"],
      "Politics": ["election", "minister", "parliament", "policy", "government", "bill", "bjp", "congress"],
      "Technology": ["tech", "ai", "digital", "startup", "innovation", "software", "semiconductor", "chip"],
      "Economy & Markets": ["economy", "market", "stock", "gdp", "trade", "export", "investment", "upi", "payment"],
      "Education & Exams": ["neet", "jee", "exam", "education", "student", "teacher", "result", "admit"]
    };
    for (const [interest, words] of Object.entries(keywords)) {
      if (words.some(w => lower.includes(w))) interests.push(interest);
    }
    return interests.length ? interests : ["General"];
  }

  private getFallbackSeed(): Post[] {
    const now = new Date().toISOString();
    return [
      {
        platform: "twitter",
        post_id: "tw_seed_501",
        author_id: "citizen_journo_in",
        text: "Red alert issued in Mumbai suburban areas! Water levels reaching dangerous levels in Mithi river. #MumbaiRains #Alert #BMC",
        timestamp: now,
        likes: 3200,
        shares: 1100,
        comments_count: 290,
        language: "en",
        raw_bio: "Independent Journalist based in Mumbai",
        forward_count: 1,
        is_suspected_bot: false,
        region: "Maharashtra",
        profession: "Journalist / Media",
        interests: ["Environment & AQI", "Infrastructure"],
        sentiment: "negative",
        sentiment_score: -0.8,
        emotions: { anxiety: 0.9, anger: 0.4, fear: 0.6 },
        stance: "against",
        topic_id: "topic_mumbai_rains",
        topic_name: "Mumbai Rain Flooding & Transit",
        is_demo_sample: true
      },
      {
        platform: "twitter",
        post_id: "tw_seed_502",
        author_id: "mumbai_news_handle",
        text: "Mithi river overflow warning! Mumbai train lines suspended. Evacuation started in low lying areas! #MumbaiRains",
        timestamp: now,
        likes: 2900,
        shares: 950,
        comments_count: 210,
        language: "en",
        raw_bio: "Breaking news tracker Mumbai",
        forward_count: 1,
        is_suspected_bot: true,
        coordination_cluster_id: "coord_cluster_mithi_alert",
        region: "Maharashtra",
        profession: "Journalist / Media",
        interests: ["Infrastructure"],
        sentiment: "negative",
        sentiment_score: -0.85,
        emotions: { anxiety: 0.95, fear: 0.7 },
        stance: "against",
        topic_id: "topic_mumbai_rains",
        topic_name: "Mumbai Rain Flooding & Transit",
        is_demo_sample: true
      }
    ];
  }
}
