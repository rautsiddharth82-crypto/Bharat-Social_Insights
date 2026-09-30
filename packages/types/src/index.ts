import { z } from "zod";

export const PostSchema = z.object({
  platform: z.enum(["telegram", "youtube", "reddit", "facebook", "twitter"]),
  post_id: z.string(),
  author_id: z.string(),
  author_hashed: z.string().optional(),
  text: z.string(),
  timestamp: z.string(), // ISO8601 string in IST
  likes: z.number().default(0),
  shares: z.number().default(0),
  comments_count: z.number().default(0),
  language: z.string().default("en"),
  raw_bio: z.string().optional().default(""),
  forward_count: z.number().default(1),
  canonical_post_id: z.string().optional(),
  is_suspected_bot: z.boolean().default(false),
  coordination_cluster_id: z.string().nullable().optional(),
  region: z.string().default("Unknown"),
  profession: z.string().default("General"),
  interests: z.array(z.string()).default([]),
  sentiment: z.enum(["positive", "negative", "neutral"]).default("neutral"),
  sentiment_score: z.number().default(0.0),
  emotions: z.record(z.number()).default({}),
  stance: z.enum(["for", "against", "neutral"]).default("neutral"),
  topic_id: z.string().default("general"),
  topic_name: z.string().default("General Discussion"),
  is_demo_sample: z.boolean().default(false)
});

export type Post = z.infer<typeof PostSchema>;

export const TopicSchema = z.object({
  topic_id: z.string(),
  topic_name: z.string(),
  post_count: z.number(),
  velocity: z.number(),
  forecast_next_hour: z.number(),
  dominant_sentiment: z.enum(["positive", "negative", "neutral"]),
  badge: z.enum(["Low", "Rising", "High"])
});

export type Topic = z.infer<typeof TopicSchema>;

export const ConnectorStatusSchema = z.object({
  platform: z.string(),
  configured: z.boolean(),
  status: z.string(),
  last_fetch: z.string().nullable(),
  is_demo: z.boolean(),
  error_message: z.string().nullable().optional()
});

export type ConnectorStatus = z.infer<typeof ConnectorStatusSchema>;

export interface SentimentTimelinePoint {
  time: string;
  positive: number;
  negative: number;
  neutral: number;
  anxiety: number;
  anger: number;
}

export interface DemographicBucket {
  name: string;
  value: number;
  suppressed: boolean;
  note?: string;
}

export interface DemographicsSummary {
  k_threshold: number;
  region_distribution: DemographicBucket[];
  profession_distribution: DemographicBucket[];
  language_distribution: DemographicBucket[];
}

export interface NetworkNode {
  id: string;
  label: string;
  platform: string;
  pagerank: number;
  community: number;
  region: string;
  val: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
}

export interface ActionCard {
  id: string;
  title: string;
  type: string;
  description: string;
}

export interface RumorRisk {
  score: number;
  level: "Low" | "Medium" | "High";
  contributing_factors: string[];
  explanation: string;
  action_cards: ActionCard[];
}

export interface Alert {
  id: string;
  title: string;
  severity: "Low" | "Medium" | "High";
  platforms: string[];
  timestamp: string;
  description: string;
  action_cards: ActionCard[];
}
