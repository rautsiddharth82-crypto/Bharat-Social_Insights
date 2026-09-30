import { Collector } from "./base.js";
import { Post } from "@bsi/types";
import { config } from "../config.js";
import { statusTracker } from "./statusTracker.js";
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import { sleep } from "../utils/sleep.js";
import { analyzeSentimentKeywords } from "../preprocessing/keywordSentiment.js";

export class TelegramCollector implements Collector {
  platformName = "telegram";
  private client: TelegramClient | null = null;
  private readonly CHANNELS = [
    "channel_defence_india",
    "channel_mumbai_alert",
    "indianews",
    "defence_news",
    "mumbai_updates",
  ];
  private readonly MAX_MESSAGES_PER_CHANNEL = 50;

  isConfigured(): boolean {
    return Boolean(config.connectors.telegramApiId && config.connectors.telegramApiHash);
  }

  async fetch(): Promise<Post[]> {
    if (!this.isConfigured()) {
      await statusTracker.updateStatus("telegram", false, "Standby (no credentials)", true);
      return this.getFallbackSeed();
    }

    try {
      await this.initializeClient();
      await statusTracker.updateStatus("telegram", true, "Active (gramjs)", false);
      
      const allPosts: Post[] = [];
      
      for (const channelUsername of this.CHANNELS) {
        try {
          const posts = await this.fetchChannelMessages(channelUsername);
          allPosts.push(...posts);
          
          if (allPosts.length >= 100) break;
        } catch (err) {
          console.warn(`Failed to fetch from ${channelUsername}:`, err);
        }
      }

      if (allPosts.length === 0) {
        console.log("No live messages fetched, using fallback");
        return this.getFallbackSeed();
      }

      return allPosts.slice(0, 100);
    } catch (err: any) {
      console.error("Telegram collector error:", err);
      await statusTracker.updateStatus("telegram", true, "Error", false, err.message);
      return this.getFallbackSeed();
    }
  }

  private async initializeClient(): Promise<void> {
    if (this.client?.connected) return;

    const sessionString = process.env.TELEGRAM_SESSION_STRING || "";
    const session = new StringSession(sessionString);

    this.client = new TelegramClient(
      session,
      Number(config.connectors.telegramApiId),
      config.connectors.telegramApiHash,
      { connectionRetries: 3 }
    );

    await this.client.connect();

    if (!sessionString && this.client.session) {
      const newSessionString = this.client.session.save();
      console.log("NEW TELEGRAM SESSION STRING (save to TELEGRAM_SESSION_STRING env var):");
      console.log(newSessionString);
    }

    if (!this.client.connected) {
      throw new Error("Failed to connect to Telegram");
    }
  }

  private async fetchChannelMessages(channelUsername: string): Promise<Post[]> {
    if (!this.client) throw new Error("Client not initialized");

    const posts: Post[] = [];
    const entity = await this.client.getEntity(channelUsername);

    const messages = await this.client.getMessages(entity, {
      limit: this.MAX_MESSAGES_PER_CHANNEL,
    });

    for (const msg of messages) {
      if (!msg.message || !msg.id) continue;

      const text = msg.message;
      const sentiment = analyzeSentimentKeywords(text);
      const topic = this.inferTopic(text);
      const profession = this.inferProfession(text);

      const post: Post = {
        platform: "telegram",
        post_id: `tg_${channelUsername}_${msg.id}`,
        author_id: channelUsername,
        text,
        timestamp: new Date(msg.date * 1000).toISOString(),
        likes: msg.views || 0,
        shares: msg.forwards || 0,
        comments_count: msg.replies?.replies || 0,
        language: this.detectLanguage(text),
        raw_bio: `Telegram channel: ${channelUsername}`,
        forward_count: msg.forwards || 1,
        is_suspected_bot: (msg.forwards || 0) > 500 && /(breaking|alert|warning|notice|leaked)/i.test(text.slice(0, 50)),
        region: this.inferRegion(channelUsername, text),
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

      posts.push(post);
    }

    return posts;
  }

  private detectLanguage(text: string): string {
    const devanagari = /[\u0900-\u097F]/.test(text);
    const latin = /[a-zA-Z]/.test(text);
    
    if (devanagari && latin) return "hinglish";
    if (devanagari) return "hi";
    return "en";
  }

  private inferRegion(channel: string, text: string): string {
    const lower = (channel + " " + text).toLowerCase();
    
    if (lower.includes("mumbai") || lower.includes("maharashtra")) return "Maharashtra";
    if (lower.includes("delhi") || lower.includes("ncr")) return "Delhi";
    if (lower.includes("bangalore") || lower.includes("bengaluru") || lower.includes("karnataka")) return "Karnataka";
    if (lower.includes("gujarat") || lower.includes("ahmedabad") || lower.includes("surat")) return "Gujarat";
    if (lower.includes("chennai") || lower.includes("tamil")) return "Tamil Nadu";
    if (lower.includes("kerala") || lower.includes("kochi")) return "Kerala";
    if (lower.includes("punjab") || lower.includes("chandigarh")) return "Punjab";
    if (lower.includes("bengal") || lower.includes("kolkata")) return "West Bengal";
    
    return "Unknown";
  }

  private extractInterests(text: string): string[] {
    const interests: string[] = [];
    const lower = text.toLowerCase();
    
    const keywords: Record<string, string[]> = {
      "Environment & AQI": ["rain", "flood", "pollution", "aqi", "air quality", "climate", "weather", "monsoon", "बारिश", "बाढ़"],
      "Infrastructure": ["metro", "railway", "road", "bridge", "construction", "highway", "transport", "ट्रेन", "बिजली"],
      "Defence & Security": ["defence", "army", "navy", "air force", "border", "security", "terror", "सुरक्षा", "सेना"],
      "Health": ["covid", "hospital", "vaccine", "health", "disease", "medical", "अस्पताल", "दवा"],
      "Politics": ["election", "minister", "parliament", "policy", "government", "bill", "सरकार", "मंत्री"],
      "Technology": ["tech", "ai", "digital", "startup", "innovation", "software", "upi", "payment"],
      "Education & Exams": ["neet", "jee", "exam", "education", "student", "teacher", "result", "परीक्षा", "नीट"],
    };

    for (const [interest, words] of Object.entries(keywords)) {
      if (words.some(w => lower.includes(w))) {
        interests.push(interest);
      }
    }

    return interests.length ? interests : ["General"];
  }

  private inferTopic(text: string): { id: string; name: string } {
    const lower = text.toLowerCase();
    if (/(मुंबई|mumbai|maharashtra|बाढ़|flood|rain|monsoon|barish|बारिश)/.test(lower)) return { id: "topic_mumbai_rains", name: "Mumbai Rain Flooding & Transit" };
    if (/(दिल्ली|delhi|ncr|aqi|pollution|smog|प्रदूषण|stubble)/.test(lower)) return { id: "topic_delhi_aqi", name: "Delhi Air Quality & Stubble Burning" };
    if (/(semiconductor|fab|chip|manufacturing|gujarat|सेमी)/.test(lower)) return { id: "topic_semicon_gujarat", name: "Semiconductor Fab & Manufacturing" };
    if (/(digital|upi|payment|dbt|sabzi|subsidy|सरकारी|सब्सिडी)/.test(lower)) return { id: "topic_digital_payments", name: "Digital India & Fintech" };
    if (/(defence|army|navy|air force|सेना|suraksha|सुरक्षा)/.test(lower)) return { id: "topic_defence_news", name: "Defence & Security Updates" };
    if (/(neet|jee|exam|परीक्षा|result|admit|coaching|नीट|छात्र)/.test(lower)) return { id: "topic_exam_news", name: "Education & Examination News" };
    if (/(power|bijli|बिजली|outage|cut|load shedding|rajasthan|कुटौटी)/.test(lower)) return { id: "topic_rajasthan_power", name: "Rajasthan Power Outage Crisis" };
    return { id: "topic_general", name: "General Discussion" };
  }

  private inferProfession(text: string): string {
    const lower = text.toLowerCase();
    if (/(neet|jee|exam|student|study|coaching|छात्र|परीक्षा)/.test(lower)) return "Education & Academia";
    if (/(teacher|faculty|sir|professor|शिक्षक)/.test(lower)) return "Education & Academia";
    if (/(farmer|kisan|किसान|agriculture|crop|पंप|tubewell|pump)/.test(lower)) return "Agriculture & Rural";
    if (/(bijli|power|बिजली|electricity|discom)/.test(lower)) return "Agriculture & Rural";
    if (/(doctor|health|medical|hospital|डॉक्टर|अस्पताल)/.test(lower)) return "Healthcare";
    if (/(army|defence|navy|sena|सेना|police|पुलिस)/.test(lower)) return "Public Service & Defence";
    if (/(journalist|media|news|press|samachar|समाचार)/.test(lower)) return "Journalist / Media";
    if (/(tech|ai|startup|software|upi|digital)/.test(lower)) return "Tech & Engineering";
    if (/(minister|govt|government|sarkar|सरकार|minister|मंत्री)/.test(lower)) return "Politics & Policy";
    return "General Public";
  }

  private getFallbackSeed(): Post[] {
    const now = new Date().toISOString();
    return [
      {
        platform: "telegram",
        post_id: "tg_seed_101",
        author_id: "channel_defence_india",
        text: "BREAKING: Heavy rainfall causes severe flooding alert in Mumbai suburban train lines. Central line delayed. stay safe! #MumbaiRains #Alert",
        timestamp: now,
        likes: 1450,
        shares: 320,
        comments_count: 85,
        language: "en",
        raw_bio: "Defence & Emergency updates India channel",
        forward_count: 1,
        is_suspected_bot: false,
        region: "Maharashtra",
        profession: "Public Service & Defence",
        interests: ["Environment & AQI", "Infrastructure"],
        sentiment: "negative",
        sentiment_score: -0.75,
        emotions: { anxiety: 0.85, anger: 0.2, fear: 0.4 },
        stance: "against",
        topic_id: "topic_mumbai_rains",
        topic_name: "Mumbai Rain Flooding & Transit",
        is_demo_sample: true
      },
      {
        platform: "telegram",
        post_id: "tg_seed_102",
        author_id: "channel_mumbai_alert",
        text: "मुंबई में भारी बारिश की चेतावनी! दादर और कुर्ला में जलभराव की स्थिति बनी हुई है। प्रशासन मुस्तैद। #MumbaiRains",
        timestamp: now,
        likes: 980,
        shares: 210,
        comments_count: 42,
        language: "hi",
        raw_bio: "Local Mumbai Emergency Broadcast",
        forward_count: 1,
        is_suspected_bot: false,
        region: "Maharashtra",
        profession: "Public Service & Defence",
        interests: ["Environment & AQI"],
        sentiment: "negative",
        sentiment_score: -0.6,
        emotions: { anxiety: 0.75, anger: 0.1 },
        stance: "neutral",
        topic_id: "topic_mumbai_rains",
        topic_name: "Mumbai Rain Flooding & Transit",
        is_demo_sample: true
      }
    ];
  }
}