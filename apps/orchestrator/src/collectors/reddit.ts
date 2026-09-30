import { Collector } from "./base.js";
import { Post } from "@bsi/types";
import { config } from "../config.js";
import { statusTracker } from "./statusTracker.js";
import Snoowrap from "snoowrap";
import { analyzeSentimentKeywords } from "../preprocessing/keywordSentiment.js";

export class RedditCollector implements Collector {
  platformName = "reddit";

  private readonly SUBREDDITS = [
    "india",
    "IndianStudents",
    "JEENEETards",
    "mumbai",
    "delhi",
    "bangalore",
    "unitedstatesofindia",
    "IndianStreetBets"
  ];

  isConfigured(): boolean {
    return Boolean(config.connectors.redditClientId && config.connectors.redditClientSecret);
  }

  async fetch(): Promise<Post[]> {
    // When posts are streamed in by the Devvit Reddit app via the
    // /ingest/reddit webhook, skip polling entirely so we don't inject
    // demo samples into the live feed.
    if (config.connectors.redditDisablePolling) {
      await statusTracker.updateStatus("reddit", true, "Active (Devvit push stream)", false);
      return [];
    }

    if (this.isConfigured()) {
      try {
        const r = new Snoowrap({
          userAgent: "bharat_social_insights/1.0",
          clientId: config.connectors.redditClientId,
          clientSecret: config.connectors.redditClientSecret,
          username: "",
          password: "",
        });

        const allPosts: Post[] = [];

        for (const sub of this.SUBREDDITS) {
          try {
            const submissions = await r.getSubreddit(sub).getHot({ limit: 10 });
            for (const s of submissions) {
              const text = (s.title || "") + " " + (s.selftext || "");
              const sentiment = analyzeSentimentKeywords(text);
              const topic = this.inferTopic(text + " " + s);
              const region = this.inferRegion(text + " " + s);

              allPosts.push({
                platform: "reddit",
                post_id: `rd_${s.id}`,
                author_id: s.author?.name || "reddit_user",
                text,
                timestamp: s.created_utc ? new Date(s.created_utc * 1000).toISOString() : new Date().toISOString(),
                likes: s.score || 0,
                shares: 0,
                comments_count: s.num_comments || 0,
                language: this.detectLanguage(text),
                raw_bio: `Reddit: r/${s.subreddit?.display_name || sub}`,
                forward_count: 1,
                is_suspected_bot: (s.score || 0) <= 1 && (s.num_comments || 0) === 0,
                region,
                profession: this.inferProfession(text),
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
          } catch (subErr: any) {
            console.warn(`Reddit r/${sub} fetch failed:`, subErr.message);
          }
        }

        if (allPosts.length > 0) {
          await statusTracker.updateStatus("reddit", true, `Active (snoowrap) - ${allPosts.length} posts`, false);
          return allPosts.slice(0, 50);
        }

        await statusTracker.updateStatus("reddit", true, "Active (no new items)", true);
        return this.getFallbackSeed();
      } catch (err: any) {
        await statusTracker.updateStatus("reddit", true, "Error", false, err.message);
        return this.getFallbackSeed();
      }
    } else {
      // No credentials — try Reddit's public JSON listings first (free, no signup,
      // ~10 QPS rate limit which is fine for a 4-minute poll of 8 subreddits).
      // Only fall back to the labeled seed dataset if that also fails.
      try {
        const live = await this.fetchPublicJson();
        if (live.length > 0) {
          await statusTracker.updateStatus("reddit", true, `Active (public JSON) - ${live.length} posts`, false);
          return live.slice(0, 50);
        }
      } catch (err: any) {
        console.warn("Reddit public JSON fetch failed, falling back to seed:", err.message);
      }
      await statusTracker.updateStatus("reddit", false, "Standby (no credentials)", true);
      return this.getFallbackSeed();
    }
  }

  /**
   * Fetches current hot posts from all target subreddits via Reddit's public
   * `.json` endpoints. No OAuth, no API keys — just a descriptive User-Agent
   * (which is Reddit's documented requirement for unauthenticated access).
   */
  private async fetchPublicJson(): Promise<Post[]> {
    const out: Post[] = [];
    for (const sub of this.SUBREDDITS) {
      try {
        const url = `https://www.reddit.com/r/${sub}/hot.json?limit=15&raw_json=1`;
        const res = await fetch(url, {
          headers: { "User-Agent": "bharat_social_insights/1.0 (analytics demo; contact: hardik@example.com)" },
        });
        if (!res.ok) {
          console.warn(`Reddit r/${sub} -> HTTP ${res.status}`);
          continue;
        }
        const json = (await res.json()) as any;
        const children: any[] = json?.data?.children ?? [];
        for (const child of children) {
          const d = child?.data ?? {};
          const text = `${d.title ?? ""}\n${d.selftext ?? ""}`.trim();
          if (!text) continue;
          const sentiment = analyzeSentimentKeywords(text);
          const topic = this.inferTopic(text + " " + sub);
          const region = this.inferRegion(text + " " + sub);
          out.push({
            platform: "reddit",
            post_id: `rd_${d.id}`,
            author_id: d.author || "reddit_user",
            text,
            timestamp: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : new Date().toISOString(),
            likes: d.score ?? 0,
            shares: 0,
            comments_count: d.num_comments ?? 0,
            language: this.detectLanguage(text),
            raw_bio: `Reddit: r/${d.subreddit ?? sub}`,
            forward_count: 1,
            is_suspected_bot: (d.score ?? 0) <= 1 && (d.num_comments ?? 0) === 0,
            region,
            profession: this.inferProfession(text),
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
      } catch (e: any) {
        console.warn(`Reddit r/${sub} public JSON error:`, e.message);
      }
    }
    return out;
  }

  private detectLanguage(text: string): string {
    const devanagari = /[\u0900-\u097F]/.test(text);
    const latin = /[a-zA-Z]/.test(text);
    if (devanagari && latin) return "hinglish";
    if (devanagari) return "hi";
    return "en";
  }

  private inferRegion(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes("mumbai") || lower.includes("maharashtra") || lower.includes("r/mumbai")) return "Maharashtra";
    if (lower.includes("delhi") || lower.includes("ncr") || lower.includes("r/delhi") || lower.includes("noida") || lower.includes("gurgaon")) return "Delhi";
    if (lower.includes("bangalore") || lower.includes("bengaluru") || lower.includes("karnataka") || lower.includes("r/bangalore")) return "Karnataka";
    if (lower.includes("gujarat") || lower.includes("ahmedabad")) return "Gujarat";
    if (lower.includes("chennai") || lower.includes("tamil")) return "Tamil Nadu";
    if (lower.includes("rajasthan") || lower.includes("jaipur")) return "Rajasthan";
    if (lower.includes("uttar pradesh") || lower.includes("lucknow")) return "Uttar Pradesh";
    if (lower.includes("kerala") || lower.includes("kochi")) return "Kerala";
    return "Unknown";
  }

  private inferProfession(text: string): string {
    const lower = text.toLowerCase();
    if (/(journalist|reporter|media|news|press)/.test(lower)) return "Journalist / Media";
    if (/(teacher|professor|education|student|exam|neet|jee|coaching|r\/jeeneetards|r\/indianstudents)/.test(lower)) return "Education & Academia";
    if (/(doctor|health|medical|hospital|patient|covid)/.test(lower)) return "Healthcare";
    if (/(army|defence|navy|air force|security|police|border)/.test(lower)) return "Public Service & Defence";
    if (/(tech|software|ai|startup|engineer|developer|coding)/.test(lower)) return "Tech & Engineering";
    if (/(farmer|kisan|agriculture|crop|mandi)/.test(lower)) return "Agriculture & Rural";
    if (/(minister|govt|government|parliament|election|policy|bjp|congress)/.test(lower)) return "Politics & Policy";
    if (/(stock|market|invest|crypto|business|economy|gdp)/.test(lower)) return "Economy & Markets";
    return "General Public";
  }

  private inferTopic(text: string): { id: string; name: string } {
    const lower = text.toLowerCase();
    if (lower.includes("mumbai") || lower.includes("rain") || lower.includes("flood") || lower.includes("monsoon")) return { id: "topic_mumbai_rains", name: "Mumbai Rain Flooding & Transit" };
    if (lower.includes("delhi") || lower.includes("pollution") || lower.includes("aqi") || lower.includes("smog") || lower.includes("stubble")) return { id: "topic_delhi_aqi", name: "Delhi Air Quality & Stubble Burning" };
    if (lower.includes("semiconductor") || lower.includes("fab") || lower.includes("chip") || lower.includes("manufacturing")) return { id: "topic_semicon_gujarat", name: "Semiconductor Fab & Manufacturing" };
    if (lower.includes("digital") || lower.includes("upi") || lower.includes("payment") || lower.includes("fintech") || lower.includes("dbt")) return { id: "topic_digital_payments", name: "Digital India & Fintech" };
    if (lower.includes("defence") || lower.includes("army") || lower.includes("navy") || lower.includes("air force")) return { id: "topic_defence_news", name: "Defence & Security Updates" };
    if (lower.includes("neet") || lower.includes("exam") || lower.includes("jee") || lower.includes("education") || lower.includes("student") || lower.includes("result")) return { id: "topic_exam_news", name: "Education & Examination News" };
    if (lower.includes("crypto") || lower.includes("bitcoin") || lower.includes("stock") || lower.includes("invest") || lower.includes("stocks")) return { id: "topic_crypto_policy", name: "Markets & Crypto Regulation" };
    return { id: "topic_general", name: "General Discussion" };
  }

  private extractInterests(text: string): string[] {
    const interests: string[] = [];
    const lower = text.toLowerCase();
    const keywords: Record<string, string[]> = {
      "Environment & AQI": ["rain", "flood", "pollution", "aqi", "air quality", "climate", "weather", "monsoon"],
      "Infrastructure": ["metro", "railway", "road", "bridge", "construction", "highway", "transport"],
      "Defence & Security": ["defence", "army", "navy", "air force", "border", "security", "terror"],
      "Health": ["covid", "hospital", "vaccine", "health", "disease", "medical"],
      "Politics": ["election", "minister", "parliament", "policy", "government", "bill"],
      "Technology": ["tech", "ai", "digital", "startup", "innovation", "software", "semiconductor"],
      "Economy & Markets": ["economy", "market", "stock", "gdp", "trade", "export", "investment", "crypto"],
      "Education & Exams": ["neet", "jee", "exam", "education", "student", "teacher", "result"]
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
        platform: "reddit",
        post_id: "rd_seed_301",
        author_id: "u_delhi_resident",
        text: "Air Quality Index in NCR reaches severe category today. Urgent need for emergency stubble burning controls and traffic rationing. #AQI #Delhi",
        timestamp: now,
        likes: 890,
        shares: 45,
        comments_count: 320,
        language: "en",
        raw_bio: "Resident of New Delhi, environmental activist",
        forward_count: 1,
        is_suspected_bot: false,
        region: "Delhi",
        profession: "Student / Academic",
        interests: ["Environment & AQI"],
        sentiment: "negative",
        sentiment_score: -0.7,
        emotions: { anxiety: 0.8, anger: 0.6 },
        stance: "against",
        topic_id: "topic_delhi_aqi",
        topic_name: "Delhi Air Quality & Stubble Burning",
        is_demo_sample: true
      }
    ];
  }
}
