import { Collector } from "./base.js";
import { Post } from "@bsi/types";
import { config } from "../config.js";
import { statusTracker } from "./statusTracker.js";
import { google } from "googleapis";
import { analyzeSentimentKeywords } from "../preprocessing/keywordSentiment.js";

export class YouTubeCollector implements Collector {
  platformName = "youtube";
  private dailyQuotaUsed = 0;
  private maxDailyQuota = 10000;
  private readonly SEARCH_QUERIES = [
    "India news today",
    "Mumbai rains flooding",
    "Delhi air pollution AQI",
    "India semiconductor manufacturing",
    "Digital India UPI payments",
    "Indian defence news",
    "India technology startup",
  ];

  isConfigured(): boolean {
    return Boolean(config.connectors.youtubeApiKey);
  }

  async fetch(): Promise<Post[]> {
    if (!this.isConfigured()) {
      await statusTracker.updateStatus("youtube", false, "Standby (no credentials)", true);
      return this.getFallbackSeed();
    }

    if (this.dailyQuotaUsed >= this.maxDailyQuota) {
      await statusTracker.updateStatus("youtube", true, "Quota Exceeded (Backed Off)", false);
      return this.getFallbackSeed();
    }

    try {
      const youtube = google.youtube({ version: "v3", auth: config.connectors.youtubeApiKey });
      const allPosts: Post[] = [];

      for (const query of this.SEARCH_QUERIES) {
        if (this.dailyQuotaUsed >= this.maxDailyQuota) break;

        try {
          // Search for recent videos
          const searchRes = await youtube.search.list({
            part: ["snippet"],
            q: query,
            type: ["video"],
            order: "date",
            maxResults: 3,
            publishedAfter: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          });
          this.dailyQuotaUsed += 100; // search costs 100 units

          const videoIds = (searchRes.data.items || [])
            .map(item => item.id?.videoId)
            .filter(Boolean) as string[];

          for (const videoId of videoIds) {
            if (this.dailyQuotaUsed >= this.maxDailyQuota) break;

            try {
              const commentsRes = await youtube.commentThreads.list({
                part: ["snippet"],
                videoId,
                maxResults: 10,
                order: "relevance",
              });
              this.dailyQuotaUsed += 1; // commentThreads.list costs 1 unit

              const posts = (commentsRes.data.items || []).map(item => {
                const snip = item.snippet?.topLevelComment?.snippet;
                return this.createPost(item.id!, videoId, snip, query);
              });

              allPosts.push(...posts);
            } catch (err: any) {
              console.warn(`Failed to fetch comments for video ${videoId}: ${err?.message || err}`);
            }
          }
        } catch (err: any) {
          // Log only the message: the gaxios error object carries the full request
          // config, which includes the API key.
          console.warn(`Search failed for query "${query}": ${err?.message || err}`);
        }
      }

      if (allPosts.length === 0) {
        return this.getFallbackSeed();
      }

      await statusTracker.updateStatus("youtube", true, `Active (Quota: ${this.dailyQuotaUsed}/10000)`, false);
      return allPosts.slice(0, 100);
    } catch (err: any) {
      await statusTracker.updateStatus("youtube", true, "Error", false, err.message);
      return this.getFallbackSeed();
    }
  }

  private createPost(commentId: string, videoId: string, snip: any, query: string): Post {
    const text = snip?.textDisplay || "";
    const topic = this.inferTopic(query);
    const sentiment = analyzeSentimentKeywords(text);
    const profession = this.inferProfession(text);
    
    return {
      platform: "youtube",
      post_id: `yt_${commentId}`,
      author_id: snip?.authorDisplayName || "yt_user",
      text,
      timestamp: snip?.publishedAt || new Date().toISOString(),
      likes: snip?.likeCount || 0,
      shares: 0,
      comments_count: 0,
      language: this.detectLanguage(text),
      raw_bio: `YouTube: ${snip?.authorChannelUrl || "unknown"}`,
      forward_count: 1,
      is_suspected_bot: (snip?.likeCount || 0) === 0 && text.length < 30,
      region: this.inferRegion(text),
      profession,
      interests: this.extractInterests(text),
      sentiment: sentiment.sentiment,
      sentiment_score: sentiment.sentiment_score,
      emotions: sentiment.emotions,
      stance: sentiment.sentiment === "positive" ? "for" : sentiment.sentiment === "negative" ? "against" : "neutral",
      topic_id: topic.id,
      topic_name: topic.name,
      is_demo_sample: false,
    };
  }

  private inferProfession(text: string): string {
    const lower = text.toLowerCase();
    if (/(teacher|sir|faculty|coaching|student|exam|neet|jee|preparation|study|revision)/.test(lower)) return "Education & Academia";
    if (/(doctor|health|medical|medicine|patient|hospital)/.test(lower)) return "Healthcare";
    if (/(farmer|kisan|crop|agriculture|pump|tubewell|bijli|electricity)/.test(lower)) return "Agriculture & Rural";
    if (/(tech|ai|software|startup|code|developer|laptop|phone)/.test(lower)) return "Tech & Engineering";
    if (/(govt|government|ministry|minister|politics|election)/.test(lower)) return "Politics & Policy";
    if (/(army|defence|navy|airforce|security|police)/.test(lower)) return "Public Service & Defence";
    return "General Public";
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
    if (lower.includes("mumbai") || lower.includes("maharashtra")) return "Maharashtra";
    if (lower.includes("delhi") || lower.includes("ncr")) return "Delhi";
    if (lower.includes("bangalore") || lower.includes("bengaluru") || lower.includes("karnataka")) return "Karnataka";
    if (lower.includes("gujarat") || lower.includes("ahmedabad")) return "Gujarat";
    if (lower.includes("chennai") || lower.includes("tamil")) return "Tamil Nadu";
    return "Unknown";
  }

  private inferTopic(query: string): { id: string; name: string } {
    const lower = query.toLowerCase();
    if (lower.includes("mumbai") || lower.includes("rain")) return { id: "topic_mumbai_rains", name: "Mumbai Rain Flooding & Transit" };
    if (lower.includes("delhi") || lower.includes("pollution") || lower.includes("aqi")) return { id: "topic_delhi_aqi", name: "Delhi Air Quality & Pollution" };
    if (lower.includes("semiconductor") || lower.includes("manufacturing")) return { id: "topic_semicon_gujarat", name: "Semiconductor Fab & Manufacturing" };
    if (lower.includes("digital") || lower.includes("upi") || lower.includes("payment")) return { id: "topic_digital_payments", name: "Digital India & Fintech" };
    if (lower.includes("defence") || lower.includes("army") || lower.includes("security")) return { id: "topic_defence", name: "Defence & Security" };
    if (lower.includes("tech") || lower.includes("startup") || lower.includes("ai")) return { id: "topic_tech", name: "Technology & Startups" };
    return { id: "general", name: "General Discussion" };
  }

  private extractInterests(text: string): string[] {
    const interests: string[] = [];
    const lower = text.toLowerCase();
    const keywords = {
      "Environment & AQI": ["rain", "flood", "pollution", "aqi", "air quality", "climate", "weather", "monsoon"],
      "Infrastructure": ["metro", "railway", "road", "bridge", "construction", "highway", "transport"],
      "Defence & Security": ["defence", "army", "navy", "air force", "border", "security", "terror"],
      "Health": ["covid", "hospital", "vaccine", "health", "disease", "medical"],
      "Politics": ["election", "minister", "parliament", "policy", "government", "bill"],
      "Technology": ["tech", "ai", "digital", "startup", "innovation", "software", "semiconductor"],
      "Economy & Markets": ["economy", "market", "stock", "gdp", "trade", "export", "investment"],
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
        platform: "youtube",
        post_id: "yt_seed_201",
        author_id: "tech_reviewer_in",
        text: "The new semiconductor fab in Gujarat is a game changer for Indian electronics manufacturing sector! Great initiative.",
        timestamp: now,
        likes: 3400,
        shares: 0,
        comments_count: 210,
        language: "en",
        raw_bio: "Tech enthusiast & reviewer from Bengaluru",
        forward_count: 1,
        is_suspected_bot: false,
        region: "Karnataka",
        profession: "Tech & Engineering",
        interests: ["Economy & Markets"],
        sentiment: "positive",
        sentiment_score: 0.85,
        emotions: { excitement: 0.9, support: 0.85 },
        stance: "for",
        topic_id: "topic_semicon_gujarat",
        topic_name: "Semiconductor Fab & Tech Manufacturing",
        is_demo_sample: true
      }
    ];
  }
}