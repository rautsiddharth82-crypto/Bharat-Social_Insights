// Local dev goes through the Vite proxy (/api → http://localhost:8000). When the
// app is deployed (Vercel) there is no proxy, so VITE_API_BASE_URL points straight
// at the deployed orchestrator (Render). No trailing slash.
const BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  (import.meta.env.PROD ? 'https://bsi-orchestrator.onrender.com' : '/api');

import type {
  AuditLogResponse,
  CascadeResponse,
  DemographicsLiveResponse,
  FeedFilters,
  FacetsResponse,
  LiveFeedResponse,
  NetworkGraphResponse,
  PipelineResponse,
  ProvenanceResponse,
} from '../types';

// Every analyst request carries an identity header so /admin/audit-log can show a
// real access trail instead of an empty table. Read lazily so changing the operator
// in the Navbar takes effect on the next request without a page reload.
export function getAnalystId(): string {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('bsi_analyst_id');
    if (stored) return stored;
  }
  return 'analyst_guest';
}

export function setAnalystId(id: string) {
  if (typeof localStorage !== 'undefined') localStorage.setItem('bsi_analyst_id', id);
}

async function get<T>(path: string, fallback: T): Promise<{ data: T; isLive: boolean }> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'x-analyst-id': getAnalystId() }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { data, isLive: data?.source !== 'fallback' && data?.source !== 'error' && data?.source !== 'empty' };
  } catch (err) {
    console.warn(`API offline [${path}]:`, err);
    return { data: fallback, isLive: false };
  }
}

// Serialises the filter object into a query string, skipping empty values so the
// backend never sees `region=` and treats it as an active filter.
function toQuery(params: Record<string, any>): string {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    qs.set(k, String(v));
  });
  return qs.toString();
}

// ─── Endpoint functions ────────────────────────────────────────────
export async function fetchOverviewStats() {
  return get('/stats/overview', {
    total_posts: 0, active_topics: 5, active_platforms: 2,
    top_platform: 'youtube', top_platform_share: 42,
    negative_ratio: 35, bot_accounts: 0,
    posts_last_hour: 0, posts_last_24h: 0, source: 'offline'
  });
}

export async function fetchLivePosts(params: FeedFilters = {}) {
  const q = toQuery({
    q: params.q,
    platform: params.platform,
    sentiment: params.sentiment,
    topic: params.topic,
    region: params.region,
    language: params.language,
    bot: params.bot,
    demo: params.demo,
    minScore: params.minScore,
    maxScore: params.maxScore,
    since: params.since,
    until: params.until,
    sort: params.sort,
    order: params.order,
    limit: params.limit,
    offset: params.offset,
  });
  return get<LiveFeedResponse>(`/posts/live${q ? '?' + q : ''}`, {
    posts: [], total: 0, total_matching: 0, has_more: false, source: 'offline'
  });
}

export async function fetchFeedFacets() {
  return get<FacetsResponse>('/posts/facets', {
    platforms: [], sentiments: [], topics: [], regions: [], languages: [], source: 'offline'
  });
}

export async function fetchProvenance(params: { topic?: string; post_key?: string; window_hours?: number } = {}) {
  const q = toQuery(params);
  return get<ProvenanceResponse>(`/posts/provenance${q ? '?' + q : ''}`, {
    topic: params.topic || null, platform_arrival: [], timeline: [], source: 'offline'
  });
}

export async function fetchPipelineTelemetry() {
  return get<PipelineResponse>('/system/pipeline', {
    overall: 'unknown',
    component_health: {},
    pipeline_stages: [],
    database: {},
    graph: { nodes: 0, relationships: 0, users: 0, posts: 0 },
    queue: {},
    ml: { status: 'unreachable' },
    redis: { used_memory_human: null, status: 'unknown' },
    connectors: [],
    generated_at: new Date().toISOString(),
    source: 'offline'
  });
}

export async function fetchAuditLog(params: { limit?: number; user?: string } = {}) {
  const q = toQuery(params);
  return get<AuditLogResponse>(`/admin/audit-log${q ? '?' + q : ''}`, { logs: [], source: 'offline' });
}

export async function fetchCascade(topic: string) {
  return get<CascadeResponse>(`/network/cascade?topic=${encodeURIComponent(topic)}`, {
    topic, cascade: [], source: 'offline'
  });
}

export async function fetchConnectors() {
  return get<{ connectors: any[]; source?: string }>('/system/connectors', { connectors: [], source: 'offline' });
}

export async function fetchRumorRisk() {
  return get('/rumor-risk', {
    score: 78.5, level: 'High',
    contributing_factors: ['Elevated anxiety index', 'Cross-platform propagation', 'Coordinated bot cluster'],
    explanation: 'HIGH RUMOR RISK DETECTED based on recent post analysis.',
    action_cards: [
      { id: 'ac_1', title: 'Issue Fact-Check Bulletin', type: 'Communication', description: 'Deploy verified updates.' }
    ]
  });
}

export async function fetchTrends() {
  return get('/trends', {
    trends: [
      { topic_id: 'topic_mumbai_rains', topic_name: 'Mumbai Rain Flooding & Transit', post_count: 4820, velocity: 0.85, forecast_next_hour: 5900, dominant_sentiment: 'negative', badge: 'High' },
      { topic_id: 'topic_delhi_aqi', topic_name: 'Delhi Air Quality & Stubble Burning', post_count: 2150, velocity: 0.32, forecast_next_hour: 2400, dominant_sentiment: 'negative', badge: 'Rising' },
    ]
  });
}

export async function fetchDemographics() {
  return get<DemographicsLiveResponse>('/demographics/summary', {
    k_threshold: 5,
    region_distribution: [{ name: 'Maharashtra', value: 4850, suppressed: false }],
    profession_distribution: [{ name: 'Tech & Engineering', value: 2890, suppressed: false }],
    language_distribution: [{ name: 'English', value: 5200, suppressed: false }],
    source: 'offline'
  });
}

export async function fetchNetworkGraph(params: { topic?: string; platform?: string; limit?: number } = {}) {
  const q = toQuery(params);
  return get<NetworkGraphResponse>(`/network/graph${q ? '?' + q : ''}`, { nodes: [], edges: [], source: 'offline' });
}

export async function fetchAlerts() {
  return get('/alerts', {
    alerts: [
      {
        id: 'alert_offline',
        title: 'Orchestrator Offline',
        severity: 'Medium',
        platforms: [],
        timestamp: new Date().toISOString(),
        description: 'Could not connect to the orchestrator service.',
        action_cards: []
      }
    ]
  });
}

export async function fetchSentimentTimeline(window = '24h') {
  return get(`/sentiment/timeline?window=${window}`, { timeline: [], window });
}

export async function fetchEmotionMetrics() {
  return get('/summary/emotion-metrics', {
    metrics: [
      { name: 'Anxiety', nameHi: 'चिंता (Anxiety)', percentage: 38, color: '#ef4444' },
      { name: 'Anger', nameHi: 'क्रोध (Anger)', percentage: 27, color: '#f97316' },
      { name: 'Sarcasm', nameHi: 'व्यंग्य (Sarcasm)', percentage: 18, color: '#eab308' },
      { name: 'Support', nameHi: 'समर्थन (Support)', percentage: 12, color: '#22c55e' },
      { name: 'Excitement', nameHi: 'उत्साह (Excitement)', percentage: 5, color: '#0ea5e9' },
      { name: 'Fear', nameHi: 'भय (Fear)', percentage: 8, color: '#a855f7' },
    ],
    total: 0,
    source: 'offline'
  });
}

export async function fetchPlatformComparison() {
  return get('/summary/platform-comparison', {
    comparison: [
      { platform: 'telegram', neg: 54, neu: 28, pos: 18, vol: '12.4k' },
      { platform: 'youtube', neg: 48, neu: 32, pos: 20, vol: '9.8k' },
      { platform: 'reddit', neg: 51, neu: 34, pos: 15, vol: '4.2k' },
      { platform: 'facebook', neg: 38, neu: 36, pos: 26, vol: '5.1k' },
      { platform: 'instagram', neg: 41, neu: 37, pos: 22, vol: '6.5k' },
      { platform: 'twitter', neg: 49, neu: 27, pos: 24, vol: '8.3k' },
    ],
    source: 'offline'
  });
}

export async function fetchLanguageBreakdown() {
  return get('/summary/language-breakdown', {
    breakdown: [
      { name: 'Hindi', nameHi: 'हिन्दी', share: '45%', neg: 52, neu: 29, pos: 19, color: '#f97316', percentage: 45 },
      { name: 'English', nameHi: 'अंग्रेज़ी', share: '35%', neg: 42, neu: 34, pos: 24, color: '#3b82f6', percentage: 35 },
      { name: 'Hinglish', nameHi: 'हिंग्लिश', share: '20%', neg: 49, neu: 31, pos: 20, color: '#10b981', percentage: 20 },
    ],
    source: 'offline'
  });
}

export async function fetchDemographicsSummary() {
  return get<DemographicsLiveResponse>('/summary/demographics-summary', {
    k_threshold: 100,
    region_distribution: [
      { name: 'Delhi / NCR', value: 3110, share_pct: 25, suppressed: false },
      { name: 'Uttar Pradesh', value: 2490, share_pct: 20, suppressed: false },
      { name: 'Rajasthan', value: 1860, share_pct: 15, suppressed: false },
      { name: 'Maharashtra', value: 1490, share_pct: 12, suppressed: false },
      { name: 'Karnataka', value: 1120, share_pct: 9, suppressed: false },
      { name: 'Others', value: 2280, share_pct: 19, suppressed: false },
    ],
    profession_distribution: [
      { name: 'Student / Academic', value: 6400, share_pct: 52, suppressed: false },
      { name: 'Young Professional', value: 2980, share_pct: 24, suppressed: false },
      { name: 'Education & Faculty', value: 1480, share_pct: 12, suppressed: false },
      { name: 'Agriculture & Rural', value: 880, share_pct: 7, suppressed: false },
      { name: 'General Public', value: 620, share_pct: 5, suppressed: false },
    ],
    language_distribution: [
      { name: 'Hindi', value: 5500, share_pct: 45, suppressed: false },
      { name: 'English', value: 4280, share_pct: 35, suppressed: false },
      { name: 'Hinglish', value: 2440, share_pct: 20, suppressed: false },
    ],
    source: 'offline'
  });
}
