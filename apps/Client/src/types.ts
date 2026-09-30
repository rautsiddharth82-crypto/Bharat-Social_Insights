export type Language = 'en' | 'hi';

export type Mode = 'normal' | 'lite';

// One page holds the captured signals, the connector status and the per-post
// origin trace, so the analyst never has to switch pages to follow a story.
export type FeedTab = 'feed' | 'sources';

// Pages the analyst can navigate to. Sentiment and demographics are deliberately
// absent: sentiment travels with every post (its badge, the filter, the detail
// modal) and demographics is a section of the Dashboard.
export type PageId =
  | 'dashboard'
  | 'trending'
  | 'network'
  | 'alerts'
  | 'rumor-radar'
  | 'live-feed'
  | 'settings';

export type Platform = 'telegram' | 'youtube' | 'reddit' | 'facebook' | 'instagram' | 'x' | 'twitter';

export type SentimentType = 'positive' | 'neutral' | 'negative' | 'mixed';

export type Velocity = 'High' | 'Medium' | 'Low';

export type RiskLevel = 'High' | 'Medium' | 'Low';

export interface TopicData {
  id: string;
  name: string;
  nameHi: string;
  posts: number;
  growth: string;
  growthValue: number;
  velocity: Velocity;
  dominantSentiment: SentimentType;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  dominantEmotion: string;
  platforms: Platform[];
  status: 'Rising' | 'Monitoring' | 'Stabilizing' | 'High Risk';
  riskLevel: RiskLevel;
  confidence: number;
  summaryEn: string;
  summaryHi: string;
  narrativeClaim: string;
  officialFactCheckUrl?: string;
}

export interface SentimentTimelinePoint {
  time: string;
  positive: number;
  neutral: number;
  negative: number;
  dominantEmotion: string;
}

export interface EmotionMetric {
  name: string;
  nameHi: string;
  percentage: number;
  color: string;
  multiplierText?: string;
  multiplierTextHi?: string;
}

export interface AlertItem {
  id: string;
  type: 'rumor_risk' | 'trend_growth' | 'sentiment_spike' | 'cross_platform';
  typeLabelEn: string;
  typeLabelHi: string;
  severity: 'high' | 'medium' | 'low';
  topic: string;
  topicHi: string;
  timeAgo: string;
  timeAgoHi: string;
  platforms: Platform[];
  reasonEn: string;
  reasonHi: string;
  reviewed: boolean;
  monitored: boolean;
}

export interface NetworkNode {
  id: string;
  label: string;
  category: 'origin' | 'amplifier' | 'influencer' | 'community';
  platform: Platform;
  reach: string;
  connections: number;
  x: number;
  y: number;
  size: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  type: 'replies' | 'forwards' | 'mentions' | 'comments' | 'references';
  weight: number;
}

export interface KeyInfluencer {
  id: string;
  name: string;
  category: string;
  connections: number;
  reach: string;
  influenceScore: number;
  engagement: string;
  platform: Platform;
}

export interface SpreadStep {
  time: string;
  platform: Platform;
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  activeNodeIds: string[];
  activeEdgeIndices: number[];
}

export interface SocialComment {
  id: string;
  platform: 'youtube' | 'reddit';
  author: string;
  channelOrSubreddit: string;
  text: string;
  textHi?: string;
  likes: number;
  sentiment: SentimentType;
  emotion: string;
  timestamp: string;
  topicId: string;
}

export interface TelegramLiveMessage {
  id: string;
  channel: string;
  subscribers: string;
  text: string;
  textHi?: string;
  forwards: number;
  views: string;
  time: string;
  sentiment: SentimentType;
  isAnomaly?: boolean;
}

export interface DemoXTweet {
  id: string;
  handle: string;
  authorName: string;
  avatarSeed: string;
  text: string;
  textHi?: string;
  retweets: number;
  likes: number;
  time: string;
  sentiment: SentimentType;
  verified: boolean;
  topicId: string;
}

export interface NewsOriginInfo {
  platform: Platform;
  time: string;
  sourceName: string;
  sourceNameHi: string;
  sourceType: string;
  sourceTypeHi: string;
  rawSpark: string;
  rawSparkHi: string;
  forensicFlag: string;
  forensicFlagHi: string;
}

export interface CirculationStepInfo {
  step: number;
  platform: Platform;
  time: string;
  actionTitle: string;
  actionTitleHi: string;
  description: string;
  descriptionHi: string;
  reach: string;
}

export interface TopicForensicSpread {
  origin: NewsOriginInfo;
  circulation: CirculationStepInfo[];
}

export interface ActionCardItem {
  id: string;
  topicId?: string;
  title: string;
  titleHi: string;
  targetMedium: string;
  priority: 'Immediate (15m)' | 'High (1h)' | 'Standard';
  targetAudience: string;
  targetAudienceHi: string;
  draftContentEn: string;
  draftContentHi: string;
  channels: string[];
  expectedImpactEn: string;
  expectedImpactHi: string;
  platforms?: Platform[];
}

export interface ArchitectureLayer {
  number: number;
  name: string;
  nameHi: string;
  badge: string;
  summary: string;
  summaryHi: string;
  technologies: string[];
  keyComponents: {
    title: string;
    description: string;
    costProfile: string;
  }[];
  samplePayload?: string;
}

export interface AlgorithmExplainer {
  id: string;
  name: string;
  nameHi: string;
  simpleIdeaEn: string;
  simpleIdeaHi: string;
  formula: string;
  variables: { name: string; meaning: string }[];
  exampleCalculationEn: string;
  exampleCalculationHi: string;
}

// ────────────────────────────────────────────────────────────────────
// Live orchestrator response shapes. These mirror the actual JSON that
// apps/orchestrator returns, so every panel knows whether a number came from the
// database or from a stored fallback corpus.
// ────────────────────────────────────────────────────────────────────

export type DataSource = 'live' | 'fallback' | 'empty' | 'error' | 'offline';

// Sections rendered inside the Dashboard page — demographics and the audit trail
// are features of the overview, not pages of their own.
export type DashboardSectionId = 'demographics' | 'audit';

// Options a view can pass when jumping to another page, so one global search box
// or one clicked bar can deep-link into the live feed with filters pre-applied.
export interface NavigateOpts {
  q?: string;
  topic?: string;
  postKey?: string;
  region?: string;
  language?: string;
  platform?: string;
  sentiment?: string;
  bot?: 'true' | 'false';
  demo?: 'true' | 'false';
  // When navigating to 'dashboard', scroll to one of its embedded sections.
  section?: DashboardSectionId;
  // Which tab of the Live Data & Signals page to land on.
  tab?: FeedTab;
  // Open the origin-trace panel for this topic/post_key instead of a separate page.
  trace?: boolean;
}

export type NavigateFn = (page: PageId, opts?: NavigateOpts) => void;

export interface LivePost {
  post_key?: string;
  post_id: string;
  platform: string;
  author_hashed?: string;
  text: string;
  timestamp: string;
  likes: number | null;
  shares: number | null;
  comments_count: number | null;
  language: string | null;
  region: string | null;
  sentiment: SentimentType;
  sentiment_score: number;
  emotions: Record<string, number> | null;
  topic_id: string | null;
  topic_name: string | null;
  stance: string | null;
  is_suspected_bot: boolean | null;
  is_demo_sample: boolean | null;
  coordination_cluster_id?: string | null;
  forward_count: number | null;
  canonical_post_id?: string | null;
}

export interface LiveFeedResponse {
  posts: LivePost[];
  total: number;
  total_matching?: number;
  limit?: number;
  offset?: number;
  has_more?: boolean;
  filters_applied?: string[];
  source: DataSource;
}

export interface FeedFilters {
  q?: string;
  platform?: string;
  sentiment?: string;
  topic?: string;
  region?: string;
  language?: string;
  bot?: 'true' | 'false' | '';
  demo?: 'true' | 'false' | '';
  minScore?: string;
  maxScore?: string;
  since?: string;
  until?: string;
  sort?: 'timestamp' | 'engagement' | 'sentiment' | 'forwards';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface FacetBucket {
  topic_id?: string;
  topic_name?: string;
  region?: string;
  language?: string;
  count: number;
}

export interface FacetsResponse {
  platforms: string[];
  sentiments: string[];
  topics: FacetBucket[];
  regions: FacetBucket[];
  languages: FacetBucket[];
  total_topics?: number;
  source: DataSource;
}

export interface ProvenanceArrivalStep {
  step: number;
  platform: string;
  post_key: string;
  text: string;
  author_hashed: string | null;
  region: string | null;
  language: string | null;
  sentiment: SentimentType;
  sentiment_score: number;
  is_suspected_bot: boolean;
  is_demo_sample: boolean;
  forward_count: number | null;
  engagement: number | null;
  observed_at: string;
  captured_at: string | null;
  detection_lag_seconds: number | null;
  lag_from_origin_seconds: number;
  is_origin_platform: boolean;
}

export interface ForwardingChain {
  canonical_post_id: string;
  hop_count: number;
  platform_count: number;
  first_seen: string;
  last_seen: string;
  platforms: string[];
}

export interface ProvenanceResponse {
  topic: string | null;
  topic_name?: string | null;
  window_hours?: number;
  origin?: (LivePost & { created_at?: string; engagement_placeholder?: number }) | null;
  platform_arrival: ProvenanceArrivalStep[];
  timeline?: { time: string; platform: string; post_key: string; label: string; lag_from_origin_seconds: number }[];
  statistics?: {
    total_posts: number;
    platforms_touched: number;
    distinct_authors: number;
    bot_flagged_posts: number;
    demo_sample_posts: number;
    near_duplicate_posts: number;
    coordination_clusters: number;
    avg_detection_lag_seconds: number | null;
    first_seen: string | null;
    last_seen: string | null;
    spread_window_seconds: number;
  };
  forwarding_chains?: ForwardingChain[];
  largest_chain?: ForwardingChain | null;
  source: DataSource;
}

export interface PipelineStage {
  order: number;
  key: string;
  name: string;
  description: string;
  produces: string[];
  field: string;
}

export interface ConnectorStatus {
  platform: string;
  configured: boolean;
  status: string;
  last_fetch: string | null;
  is_demo: boolean;
  error_message: string | null;
  message?: string;
  items_collected?: number;
  rate_limit_remaining?: number | null;
  rate_limit_total?: number | null;
}

export interface PipelineResponse {
  overall: 'healthy' | 'degraded' | 'critical' | string;
  component_health: Record<string, { state: string; detail: string }>;
  pipeline_stages: PipelineStage[];
  database: Record<string, any>;
  graph: { nodes: number; relationships: number; users: number; posts: number };
  queue: Record<string, any>;
  ml: Record<string, any>;
  redis: { used_memory_human: string | null; status: string };
  connectors: ConnectorStatus[];
  generated_at: string;
  source: DataSource;
}

export interface GraphNodeLive {
  id: string;
  label: string;
  platform: string;
  topic_id?: string;
  topic_name?: string;
  pagerank: number;
  pagerank_source?: string;
  community: number;
  region: string;
  post_count?: number;
  engagement?: number;
  avg_sentiment?: number;
  is_suspected_bot?: boolean;
  is_demo_sample?: boolean;
  last_active?: string;
  val: number;
}

export interface GraphEdgeLive {
  source: string;
  target: string;
  type: string;
  weight: number;
  topic_id?: string | null;
  region?: string | null;
}

export interface NetworkGraphResponse {
  nodes: GraphNodeLive[];
  edges: GraphEdgeLive[];
  statistics?: {
    node_count: number;
    edge_count: number;
    communities: number;
    bot_flagged_nodes: number;
    demo_sample_nodes: number;
    ranking_source: string;
  };
  source: DataSource;
}

export interface CascadeStepLive {
  step: number;
  post_id?: string;
  platform: string;
  timestamp?: string;
  sentiment?: string;
  author_hashed?: string;
  event?: string;
  edge_type?: string;
  root_id?: string;
}

export interface CascadeResponse {
  topic: string;
  cascade: CascadeStepLive[];
  empty?: boolean;
  message?: string;
  source?: DataSource;
}

export interface AuditLogEntry {
  id?: number | string;
  user_id: string;
  endpoint: string;
  query_params?: Record<string, any> | string | null;
  accessed_at?: string;
  timestamp?: string;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  source?: DataSource;
}

export interface DemographicsLiveResponse {
  k_threshold: number;
  region_distribution: { name: string; value: number; suppressed: boolean; note?: string; share_pct?: number }[];
  profession_distribution: { name: string; value: number; suppressed: boolean; note?: string; share_pct?: number }[];
  language_distribution: { name: string; value: number; suppressed: boolean; note?: string; share_pct?: number }[];
  source?: DataSource;
}

