import { Collector } from "./base.js";
import { Post } from "@bsi/types";
import { config } from "../config.js";
import { statusTracker } from "./statusTracker.js";
import axios from "axios";
import { analyzeSentimentKeywords } from "../preprocessing/keywordSentiment.js";

export class FacebookCollector implements Collector {
  platformName = "facebook";

  isConfigured(): boolean {
    return Boolean(config.connectors.metaAccessToken && config.connectors.metaPageId);
  }

  async fetch(): Promise<Post[]> {
    if (this.isConfigured()) {
      try {
        const allPosts: Post[] = [];
        const url = `https://graph.facebook.com/v19.0/${config.connectors.metaPageId}/posts`;
        const res = await axios.get(url, {
          params: {
            access_token: config.connectors.metaAccessToken,
            fields: "id,message,created_time,full_picture,permalink_url,likes.summary(true),comments.summary(true),shares",
            limit: 20
          }
        });

        const posts = res.data?.data || [];
        for (const p of posts) {
          const text = p.message || "";
          if (!text.trim()) continue;
          const sentiment = analyzeSentimentKeywords(text);
          const topic = this.inferTopic(text);
          const region = this.inferRegion(text);

          allPosts.push({
            platform: "facebook",
            post_id: `fb_${p.id}`,
            author_id: `page_${config.connectors.metaPageId}`,
            text,
            timestamp: p.created_time || new Date().toISOString(),
            likes: p.likes?.summary?.total_count || 0,
            shares: p.shares?.count || 0,
            comments_count: p.comments?.summary?.total_count || 0,
            language: this.detectLanguage(text),
            raw_bio: `Facebook page post (Graph API)`,
            forward_count: p.shares?.count || 1,
            is_suspected_bot: false,
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

        if (allPosts.length > 0) {
          await statusTracker.updateStatus("facebook", true, `Active (Meta Graph API) - ${allPosts.length} posts`, false);
          return allPosts.slice(0, 50);
        }

        await statusTracker.updateStatus("facebook", true, "Active (no new items)", true);
        return this.getFallbackSeed();
      } catch (err: any) {
        await statusTracker.updateStatus("facebook", true, "Error", false, err.message);
        return this.getFallbackSeed();
      }
    } else {
      await statusTracker.updateStatus("facebook", false, "Standby (no credentials)", true);
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

  private inferRegion(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes("mumbai") || lower.includes("maharashtra")) return "Maharashtra";
    if (lower.includes("delhi") || lower.includes("ncr")) return "Delhi";
    if (lower.includes("bangalore") || lower.includes("bengaluru") || lower.includes("karnataka")) return "Karnataka";
    if (lower.includes("gujarat") || lower.includes("ahmedabad")) return "Gujarat";
    if (lower.includes("chennai") || lower.includes("tamil")) return "Tamil Nadu";
    if (lower.includes("rajasthan") || lower.includes("jaipur")) return "Rajasthan";
    return "Unknown";
  }

  private inferProfession(text: string): string {
    const lower = text.toLowerCase();
    if (/(ndrf|disaster|emergency|helpline|police|govt|government|pib|ministry)/.test(lower)) return "Public Service & Defence";
    if (/(journalist|reporter|media|news|press)/.test(lower)) return "Journalist / Media";
    if (/(farmer|kisan|agriculture|crop|mandi)/.test(lower)) return "Agriculture & Rural";
    if (/(teacher|education|student|exam|school)/.test(lower)) return "Education & Academia";
    return "General Public";
  }

  private inferTopic(text: string): { id: string; name: string } {
    const lower = text.toLowerCase();
    if (lower.includes("mumbai") || lower.includes("rain") || lower.includes("flood") || lower.includes("monsoon") || lower.includes("evacuation") || lower.includes("ndrf")) return { id: "topic_mumbai_rains", name: "Mumbai Rain Flooding & Transit" };
    if (lower.includes("delhi") || lower.includes("pollution") || lower.includes("aqi") || lower.includes("smog")) return { id: "topic_delhi_aqi", name: "Delhi Air Quality & Stubble Burning" };
    if (lower.includes("semiconductor") || lower.includes("fab") || lower.includes("chip") || lower.includes("manufacturing")) return { id: "topic_semicon_gujarat", name: "Semiconductor Fab & Manufacturing" };
    if (lower.includes("digital") || lower.includes("upi") || lower.includes("payment") || lower.includes("dbt")) return { id: "topic_digital_payments", name: "Digital India & Fintech" };
    if (lower.includes("defence") || lower.includes("army") || lower.includes("navy") || lower.includes("security")) return { id: "topic_defence_news", name: "Defence & Security Updates" };
    if (lower.includes("neet") || lower.includes("exam") || lower.includes("jee") || lower.includes("education")) return { id: "topic_exam_news", name: "Education & Examination News" };
    return { id: "topic_general", name: "General Discussion" };
  }

  private extractInterests(text: string): string[] {
    const interests: string[] = [];
    const lower = text.toLowerCase();
    const keywords: Record<string, string[]> = {
      "Environment & AQI": ["rain", "flood", "pollution", "aqi", "air quality", "climate", "weather", "monsoon"],
      "Infrastructure": ["metro", "railway", "road", "bridge", "construction", "highway", "transport"],
      "Defence & Security": ["defence", "army", "navy", "air force", "border", "security", "terror", "ndrf"],
      "Health": ["covid", "hospital", "vaccine", "health", "disease", "medical"],
      "Politics": ["election", "minister", "parliament", "policy", "government", "bill"],
      "Technology": ["tech", "ai", "digital", "startup", "innovation", "software", "semiconductor"],
      "Economy & Markets": ["economy", "market", "stock", "gdp", "trade", "export", "investment", "upi", "payment"],
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
        platform: "facebook",
        post_id: "fb_seed_401",
        author_id: "page_disaster_alert_in",
        text: "NDRF teams deployed across coastal Konkan and Mumbai region due to continuous torrential downpour. Toll-free emergency helpline active: 1070.",
        timestamp: now,
        likes: 2100,
        shares: 680,
        comments_count: 140,
        language: "en",
        raw_bio: "Disaster Management Response Page",
        forward_count: 1,
        is_suspected_bot: false,
        region: "Maharashtra",
        profession: "Public Service & Defence",
        interests: ["Environment & AQI", "Infrastructure"],
        sentiment: "negative",
        sentiment_score: -0.5,
        emotions: { anxiety: 0.7, support: 0.6 },
        stance: "neutral",
        topic_id: "topic_mumbai_rains",
        topic_name: "Mumbai Rain Flooding & Transit",
        is_demo_sample: true
      }
    ];
  }
}
