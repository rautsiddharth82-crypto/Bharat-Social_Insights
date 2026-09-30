import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Share2,
  Clock,
  ArrowRight,
  Sparkles,
  UserCheck,
  Zap,
  Layers,
  Activity,
  Compass,
  Network,
  Bot,
  MapPin,
  Gauge,
  GitBranch,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Users,
  Inbox,
} from 'lucide-react';
import {
  CascadeResponse,
  GraphNodeLive,
  Language,
  Mode,
  NavigateFn,
  NetworkGraphResponse,
  Platform,
  ProvenanceResponse,
} from '../types';
import { fetchCascade, fetchFeedFacets, fetchNetworkGraph, fetchProvenance } from '../services/api';
import { useApi } from '../services/useApi';
import { PlatformBadge } from './PlatformBadge';
import { LiveBadge } from './LiveBadge';

interface NetworkAnalysisViewProps {
  language: Language;
  mode: Mode;
  /** Topic pushed from the feed / provenance page — deep link into one narrative. */
  initialTopic?: string;
  onNavigatePage?: NavigateFn;
}

type Category = 'origin' | 'amplifier' | 'influencer' | 'community';

interface PlacedNode extends GraphNodeLive {
  category: Category;
  degree: number;
  x: number;
  y: number;
  r: number;
}

const CANVAS_W = 860;
const CANVAS_H = 470;
const CATEGORY_ORDER: Category[] = ['origin', 'amplifier', 'influencer', 'community'];

const emptyGraph: NetworkGraphResponse = { nodes: [], edges: [], source: 'offline' };
const emptyCascade: CascadeResponse = { topic: '', cascade: [], source: 'offline' };
const emptyProvenance: ProvenanceResponse = { topic: null, platform_arrival: [], source: 'offline' };

const CATEGORY_STYLE: Record<Category, { fill: string; stroke: string; text: string; badge: string; en: string; hi: string }> = {
  origin: {
    fill: '#f43f5e', stroke: '#e11d48', text: '#fda4af',
    badge: 'bg-rose-100 text-rose-800 border border-rose-200',
    en: 'Patient Zero', hi: 'स्रोत्र (Origin)',
  },
  amplifier: {
    fill: '#f97316', stroke: '#ea580c', text: '#fed7aa',
    badge: 'bg-orange-100 text-orange-800 border border-orange-200',
    en: 'Amplifier', hi: 'प्रसारक (Amplifier)',
  },
  influencer: {
    fill: '#3b82f6', stroke: '#2563eb', text: '#bfdbfe',
    badge: 'bg-blue-100 text-blue-800 border border-blue-200',
    en: 'Key Influencer', hi: 'इन्फ्लुएंसर (Influencer)',
  },
  community: {
    fill: '#10b981', stroke: '#059669', text: '#a7f3d0',
    badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    en: 'Community Node', hi: 'सामुदायिक मंच (Community)',
  },
};

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(Math.round(n));
}

function shortTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function lagLabel(seconds: number | null | undefined, hi: boolean): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return '—';
  const s = Math.abs(Math.round(seconds));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
}

const EDGE_TYPE_LABEL: Record<string, string> = {
  SAME_TOPIC: 'shared narrative',
  SAME_REGION: 'same geography',
  FORWARDED: 'forwarded',
  REPLIED_TO: 'reply chain',
  QUOTES: 'quote',
  MENTIONS: 'mention',
};

export const NetworkAnalysisView: React.FC<NetworkAnalysisViewProps> = ({
  language,
  initialTopic,
  onNavigatePage,
}) => {
  const hi = language === 'hi';

  const [topic, setTopic] = useState<string>(initialTopic || '');
  const [platform, setPlatform] = useState<string>('');
  const [nodeLimit, setNodeLimit] = useState<number>(40);
  const [viewLayout, setViewLayout] = useState<'stage' | 'cluster'>('stage');
  const [filterCategory, setFilterCategory] = useState<'all' | Category>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  // A deep link from the feed or provenance page always wins over stale local state.
  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
      setStepIndex(0);
    }
  }, [initialTopic]);

  const facetsState = useApi(() => fetchFeedFacets(), { refreshInterval: 120000, keepPrevious: true });
  const facets = facetsState.data;

  const graphFetcher = useCallback(
    () =>
      fetchNetworkGraph({
        topic: topic || undefined,
        platform: platform || undefined,
        limit: nodeLimit,
      }),
    [topic, platform, nodeLimit]
  );
  const graphState = useApi<NetworkGraphResponse>(graphFetcher, {
    deps: [topic, platform, nodeLimit],
    keepPrevious: true,
    refreshInterval: 60000,
  });

  const provenanceFetcher = useCallback(
    () => fetchProvenance({ topic: topic || undefined, window_hours: 168 }),
    [topic]
  );
  const provState = useApi<ProvenanceResponse>(provenanceFetcher, { deps: [topic], keepPrevious: true });

  const cascadeFetcher = useCallback(
    () => (topic ? fetchCascade(topic) : Promise.resolve({ data: emptyCascade, isLive: false })),
    [topic]
  );
  const cascadeState = useApi<CascadeResponse>(cascadeFetcher, { deps: [topic], keepPrevious: true });

  const graph = graphState.data ?? emptyGraph;
  const stats = graph.statistics;
  const provenance = provState.data ?? emptyProvenance;
  const arrival = provenance.platform_arrival ?? [];
  const cascade = cascadeState.data?.cascade ?? [];

  useEffect(() => {
    if (arrival.length === 0) return;
    if (stepIndex >= arrival.length) setStepIndex(0);
  }, [arrival.length, stepIndex]);

  // ── Categories are derived from real columns, never hard-coded ────────────
  // origin   → the author behind the earliest captured instance of this narrative
  // amplifier→ bot-flagged / coordinated accounts
  // influencer→ top influence score (Neo4j GDS when the graph is reachable)
  // community→ everyone else
  const originAuthors = useMemo(() => {
    const set = new Set<string>();
    if (provenance.origin?.author_hashed) set.add(provenance.origin.author_hashed);
    arrival.slice(0, 1).forEach((a) => {
      if (a.is_origin_platform && a.author_hashed) set.add(a.author_hashed);
    });
    return set;
  }, [provenance, arrival]);

  const nodes: PlacedNode[] = useMemo(() => {
    // /network/graph groups by (author, platform, topic), so one author can arrive as
    // several rows. A graph needs exactly one node per author — merge them here,
    // otherwise duplicate ids break the key map and the layout.
    const merged: Record<string, GraphNodeLive> = {};
    (graph.nodes ?? []).forEach((n) => {
      const cur = merged[n.id];
      if (!cur) {
        merged[n.id] = { ...n };
        return;
      }
      cur.post_count = (cur.post_count || 0) + (n.post_count || 0);
      cur.engagement = (cur.engagement || 0) + (n.engagement || 0);
      cur.pagerank = Math.max(cur.pagerank || 0, n.pagerank || 0);
      cur.is_suspected_bot = !!(cur.is_suspected_bot || n.is_suspected_bot);
      cur.is_demo_sample = !!(cur.is_demo_sample || n.is_demo_sample);
      if ((cur.last_active || '') < (n.last_active || '')) cur.last_active = n.last_active;
      if (!cur.region || cur.region === 'Unknown') cur.region = n.region;
      if (!cur.topic_name && n.topic_name) {
        cur.topic_id = n.topic_id;
        cur.topic_name = n.topic_name;
      }
    });

    const raw = Object.values(merged);
    if (!raw.length) return [];

    // Re-scale bubble size against the merged engagement.
    const maxEngagement = Math.max(1, ...raw.map((n) => n.engagement || 0));
    raw.forEach((n) => {
      n.val = Math.max(4, Math.min(20, ((n.engagement || 0) / maxEngagement) * 20));
    });

    const degree: Record<string, number> = {};
    (graph.edges ?? []).forEach((e) => {
      degree[e.source] = (degree[e.source] || 0) + 1;
      degree[e.target] = (degree[e.target] || 0) + 1;
    });

    const maxRank = Math.max(...raw.map((n) => n.pagerank || 0), 0.0001);
    const ranked = [...raw].sort((a, b) => (b.pagerank || 0) - (a.pagerank || 0));
    const influencerCut = new Set(ranked.slice(0, Math.max(1, Math.round(raw.length * 0.2))).map((n) => n.id));

    const classified = raw.map((n) => ({
      ...n,
      x: 0,
      y: 0,
      r: 0,
      degree: degree[n.id] || 0,
      category: (originAuthors.has(n.id)
        ? 'origin'
        : n.is_suspected_bot
        ? 'amplifier'
        : (n.pagerank || 0) >= maxRank * 0.45 || influencerCut.has(n.id)
        ? 'influencer'
        : 'community') as Category,
    }));

    // Deterministic layout — same data always renders the same picture.
    if (viewLayout === 'stage') {
      const columns: Record<Category, typeof classified> = { origin: [], amplifier: [], influencer: [], community: [] };
      classified.forEach((n) => columns[n.category].push(n));
      (Object.keys(columns) as Category[]).forEach((cat) => columns[cat].sort((a, b) => b.pagerank - a.pagerank));

      const placed: PlacedNode[] = [];
      CATEGORY_ORDER.forEach((cat, colIdx) => {
        const members = columns[cat];
        // Even vertical spacing that never leaves the canvas.
        const gap = members.length > 1 ? Math.min(120, (CANVAS_H - 90) / (members.length - 1)) : 0;
        const x = 110 + (colIdx * (CANVAS_W - 220)) / 3;
        members.forEach((n, i) => {
          placed.push({
            ...n,
            x,
            y: members.length === 1 ? CANVAS_H / 2 : CANVAS_H / 2 + (i - (members.length - 1) / 2) * gap,
            r: Math.max(15, Math.min(30, 15 + (n.val || 6))),
          });
        });
      });
      return placed;
    }

    // Web cluster: one rosette per detected community.
    const communities = Array.from(new Set(classified.map((n) => n.community ?? 0))).sort((a, b) => a - b);
    const placed: PlacedNode[] = [];
    communities.forEach((cid, idx) => {
      const members = classified.filter((n) => n.community === cid).sort((a, b) => b.pagerank - a.pagerank);
      const angle = (idx / Math.max(communities.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const cx = CANVAS_W / 2 + Math.cos(angle) * (communities.length === 1 ? 0 : 250);
      const cy = CANVAS_H / 2 + Math.sin(angle) * (communities.length === 1 ? 0 : 140);
      const ringR = Math.min(110, 26 + members.length * 9);
      members.forEach((n, i) => {
        const a2 = (i / Math.max(members.length, 1)) * Math.PI * 2;
        placed.push({
          ...n,
          x: cx + (members.length === 1 ? 0 : Math.cos(a2) * ringR),
          y: cy + (members.length === 1 ? 0 : Math.sin(a2) * ringR),
          r: Math.max(14, Math.min(28, 14 + (n.val || 6))),
        });
      });
    });
    return placed;
  }, [graph, originAuthors, viewLayout]);

  const nodeById = useMemo(() => {
    const map: Record<string, PlacedNode> = {};
    nodes.forEach((n) => (map[n.id] = n));
    return map;
  }, [nodes]);

  useEffect(() => {
    if (!nodes.length) return;
    if (!selectedId || !nodeById[selectedId]) setSelectedId(nodes[0].id);
  }, [nodes, nodeById, selectedId]);

  const edges = useMemo(
    () => (graph.edges ?? []).filter((e) => nodeById[e.source] && nodeById[e.target]),
    [graph, nodeById]
  );

  const visibleNodes = useMemo(
    () => nodes.filter((n) => filterCategory === 'all' || n.category === filterCategory),
    [nodes, filterCategory]
  );
  const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const focusId = hoveredId || selectedId;
  const connectedIds = useMemo(() => {
    if (!focusId) return new Set<string>();
    const ids = new Set<string>([focusId]);
    edges.forEach((e) => {
      if (e.source === focusId) ids.add(e.target);
      if (e.target === focusId) ids.add(e.source);
    });
    return ids;
  }, [focusId, edges]);

  const selected = selectedId ? nodeById[selectedId] : null;

  const categoryCounts = useMemo(() => {
    const acc: Record<Category, number> = { origin: 0, amplifier: 0, influencer: 0, community: 0 };
    nodes.forEach((n) => (acc[n.category] += 1));
    return acc;
  }, [nodes]);

  const rankingMeta = (() => {
    const src = stats?.ranking_source;
    if (src === 'neo4j-gds') {
      return { label: hi ? 'नीओ4जेज GDS इन्फ्लुएंस' : 'Neo4j GDS influence', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (src === 'static-sample') {
      return { label: hi ? 'बेसलाइन ग्राफ़' : 'Baseline graph', cls: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    return {
      label: hi ? 'Postgres सहभागिता रैंकिंग' : 'Postgres engagement ranking',
      cls: 'bg-sky-50 text-sky-800 border-sky-200',
    };
  })();

  const isSampleGraph = stats?.ranking_source === 'static-sample' || graph.source === 'fallback';

  return (
    <div className="space-y-5">
      {/* ── Header + live controls ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
                <Network className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-700 font-mono">
                {hi ? 'लाइव प्रभाव नेटवर्क' : 'Live Influence Network'}
              </span>
              <LiveBadge isLive={graphState.isLive} loading={graphState.loading} lastUpdated={graphState.lastUpdated} onRefresh={graphState.refresh} />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-serif">
              {hi ? 'सूचना प्रसार एवं नेटवर्क प्रवाह' : 'Propagation Network & Authority Flow'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              {hi
                ? 'TimescaleDB और Neo4j से सीधे बनाया गया — हर नोड वास्तविक लेखाकार्यों से, कोई नक़ली आँकड़े नहीं।'
                : 'Built directly from the author rows in TimescaleDB and the influence scores written back to Neo4j — every node is a real captured account.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setViewLayout('stage')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewLayout === 'stage' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5" />
                {hi ? 'चरणबद्ध प्रवाह' : 'Stage Flow'}
              </button>
              <button
                onClick={() => setViewLayout('cluster')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewLayout === 'cluster' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                {hi ? 'नेटवर्क क्लस्टर' : 'Web Cluster'}
              </button>
            </div>
          </div>
        </div>

        {/* Filter row wired to /network/graph query params */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-3 border-t border-slate-100">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{hi ? 'विषय' : 'Topic'}</span>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full mt-1 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              <option value="">{hi ? 'सभी विषय (शीर्ष प्रभाव)' : 'All topics — top influence'}</option>
              {(facets?.topics || []).map((t) => (
                <option key={t.topic_id} value={t.topic_id}>
                  {(t.topic_name || t.topic_id) + ` — ${t.count} posts`}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{hi ? 'प्लेटफ़ॉर्म' : 'Platform'}</span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full mt-1 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              <option value="">{hi ? 'सभी प्लेटफ़ॉर्म' : 'All platforms'}</option>
              {(facets?.platforms || []).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{hi ? 'नोड सीमा' : 'Nodes rendered'}</span>
            <select
              value={nodeLimit}
              onChange={(e) => setNodeLimit(Number(e.target.value))}
              className="w-full mt-1 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              {[20, 40, 60, 80, 120].map((n) => (
                <option key={n} value={n}>
                  top {n} {hi ? 'लेखाकार्य' : 'accounts'}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col justify-end gap-1.5">
            <button
              onClick={() => {
                graphState.refresh();
                provState.refresh();
                cascadeState.refresh();
              }}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${graphState.loading ? 'animate-spin' : ''}`} />
              {hi ? 'पुनः गणना' : 'Recompute graph'}
            </button>
            {topic && (
              <button
                onClick={() => onNavigatePage?.('live-feed', { topic, trace: true })}
                className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-orange-700 border border-orange-200 bg-orange-50 rounded-lg px-3 py-1.5 hover:bg-orange-100"
              >
                <GitBranch className="w-3.5 h-3.5" />
                {hi ? 'प्रसार का इतिहास देखें' : 'Trace how this arrived'}
              </button>
            )}
          </div>
        </div>

        {/* Statistics strip — all real numbers from the endpoint */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-mono text-slate-600">
            <Users className="w-3.5 h-3.5" /> {stats?.node_count ?? nodes.length} {hi ? 'नोड' : 'nodes'}
          </span>
          <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-mono text-slate-600">
            <Share2 className="w-3.5 h-3.5" /> {stats?.edge_count ?? edges.length} {hi ? 'संबंध' : 'links'}
          </span>
          <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-mono text-slate-600">
            <Layers className="w-3.5 h-3.5" /> {stats?.communities ?? 0} {hi ? 'समुदाय' : 'communities'}
          </span>
          <span className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1 font-mono text-rose-700">
            <Bot className="w-3.5 h-3.5" /> {stats?.bot_flagged_nodes ?? 0} bot
          </span>
          <span className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1 font-mono ${rankingMeta.cls}`}>
            <Gauge className="w-3.5 h-3.5" /> {rankingMeta.label}
          </span>
          {isSampleGraph && (
            <span className="flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-lg px-2.5 py-1 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              {hi ? 'ग्राफ़ खाली — डेटाबेस में अभी लेखक पंक्तियाँ नहीं' : 'Graph not populated yet — no author rows in the store'}
            </span>
          )}
        </div>
      </div>

      {/* ── Arrival timeline built from /posts/provenance ──────────────────── */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h2 className="text-base font-extrabold text-white font-serif">
                {hi ? 'प्लेटफ़ॉर्म पर arrival क्रम' : 'Cross-platform arrival order'}
              </h2>
            </div>
            <p className="text-xs text-amber-300/80">
              {hi
                ? 'मूल पोस्ट से कितनी देर बाद हर प्लेटफ़ॉर्म पर यह संकेत दिखा — डेटाबेस की समयरेखा से मापा गया'
                : 'How long each platform took to show this narrative, measured from the origin post timestamp in the database'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LiveBadge isLive={provState.isLive} loading={provState.loading} />
            <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700/80">
              {hi ? `चरण ${Math.min(stepIndex + 1, arrival.length || 0)} / ${arrival.length}` : `Step ${Math.min(stepIndex + 1, arrival.length || 0)} of ${arrival.length}`}
            </span>
          </div>
        </div>

        {provState.loading && arrival.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">{hi ? 'समयरेखा बन रही है…' : 'Rebuilding the arrival timeline from TimescaleDB…'}</p>
        ) : arrival.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            {hi
              ? 'इस विषय के लिए पर्याप्त पार-प्लेटफ़ॉर्म पंक्तियाँ अभी कैप्चर नहीं हुईं।'
              : 'No cross-platform rows recorded for this narrative yet — select a topic with more captured posts, or let the connectors run.'}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
              {arrival.map((step, idx) => {
                const isSelected = stepIndex === idx;
                return (
                  <React.Fragment key={`${step.post_key}-${idx}`}>
                    <button
                      type="button"
                      onClick={() => setStepIndex(idx)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-slate-800 border-amber-400 text-white shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/60'
                          : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                      title={`${shortTime(step.observed_at)} • ${step.platform}`}
                    >
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800/90 text-amber-300/90 border border-slate-700/60'
                        }`}
                      >
                        {idx === 0 ? 'ORIGIN' : `+${lagLabel(step.lag_from_origin_seconds, hi)}`}
                      </span>
                      <PlatformBadge platform={step.platform as Platform} size="sm" showName />
                      {step.is_suspected_bot && <Bot className="w-3.5 h-3.5 text-rose-400" />}
                    </button>
                    {idx < arrival.length - 1 && <span className="text-slate-600 text-xs font-bold shrink-0">→</span>}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="bg-slate-950/90 border border-amber-400/40 rounded-xl p-4 relative overflow-hidden shadow-inner">
              {(() => {
                const step = arrival[Math.min(stepIndex, arrival.length - 1)];
                if (!step) return null;
                return (
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono font-black text-xs">
                          {shortTime(step.observed_at)}
                        </span>
                        <PlatformBadge platform={step.platform as Platform} size="sm" />
                        <span className="text-[11px] font-mono text-slate-400">
                          {step.author_hashed || 'usr_anon'}
                          {step.region ? ` · ${step.region}` : ''}
                          {step.language ? ` · ${step.language}` : ''}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed line-clamp-3">{step.text}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {hi ? 'पकड़ने में देरी' : 'detection lag'}: {lagLabel(step.detection_lag_seconds, hi)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {hi ? 'सहभागिता' : 'engagement'}: {fmt(step.engagement)}
                        </span>
                        <span className={`${step.sentiment === 'negative' ? 'text-rose-400' : step.sentiment === 'positive' ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {step.sentiment} {step.sentiment_score !== null ? `(${Number(step.sentiment_score).toFixed(2)})` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5 self-end">
                      <button
                        onClick={() => onNavigatePage?.('live-feed', { topic: topic || undefined, platform: step.platform })}
                        className="flex items-center gap-1 text-[11px] font-bold text-slate-300 border border-slate-700 rounded-lg px-2.5 py-1.5 hover:bg-slate-800"
                      >
                        <ExternalLink className="w-3 h-3" /> {hi ? 'फ़ीड में खोलें' : 'Open in feed'}
                      </button>
                      <button
                        onClick={() => {
                          const match = nodes.find((n) => n.id === step.author_hashed);
                          if (match) setSelectedId(match.id);
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-amber-300 border border-amber-500/40 bg-amber-500/10 rounded-lg px-2.5 py-1.5 hover:bg-amber-500/20"
                      >
                        <UserCheck className="w-3 h-3" /> {hi ? 'ग्राफ़ में देखें' : 'Locate on graph'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>

      {/* ── Graph + inspector ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-serif">
                  {hi ? 'सूचना प्रवाह रेखाचित्र' : 'Visual propagation network'}
                </h3>
                <span className="text-xs text-slate-500">
                  {hi
                    ? 'किसी भी नोड पर क्लिक करके जुड़े खाते देखें — आकार = सहभागिता, रंग = भूमिका'
                    : 'Click or hover a node to isolate its links — size = engagement, colour = derived role'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    filterCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({nodes.length})
                </button>
                {CATEGORY_ORDER.map((cat) => {
                  const active = filterCategory === cat;
                  const tint =
                    cat === 'origin' ? 'bg-rose-500' : cat === 'amplifier' ? 'bg-orange-500' : cat === 'influencer' ? 'bg-blue-600' : 'bg-emerald-600';
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-2 py-0.5 rounded-md transition-colors ${
                        active ? `${tint} text-white` : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {hi ? CATEGORY_STYLE[cat].hi : CATEGORY_STYLE[cat].en} ({categoryCounts[cat]})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-900 select-none">
              {nodes.length === 0 ? (
                <div className="h-80 sm:h-96 flex flex-col items-center justify-center gap-2 text-slate-400">
                  {graphState.loading ? (
                    <>
                      <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
                      <span className="text-xs">{hi ? 'नेटवर्क बन रहा है…' : 'Querying authors and building edges…'}</span>
                    </>
                  ) : (
                    <>
                      <Inbox className="w-6 h-6" />
                      <span className="text-xs max-w-sm text-center">
                        {hi
                          ? 'चुने दायरे में कोई लेखाकार्य नहीं मिला। विषय बदलें या सीमा बढ़ाएँ।'
                          : 'No author rows in this scope. Widen the node limit, clear the platform filter, or pick another topic.'}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} className="w-full h-80 sm:h-96">
                  <defs>
                    <pattern id="net-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                      <circle cx="12" cy="12" r="0.75" fill="#334155" opacity="0.6" />
                    </pattern>
                    <marker id="arrow-default" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
                    </marker>
                    <marker id="arrow-active" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
                    </marker>
                    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  <rect width="100%" height="100%" fill="#090d16" />
                  <rect width="100%" height="100%" fill="url(#net-grid)" />

                  {viewLayout === 'stage' && (
                    <g className="pointer-events-none opacity-50">
                      {CATEGORY_ORDER.map((cat, idx) => (
                        <React.Fragment key={cat}>
                          <line x1={110 + (idx * (CANVAS_W - 220)) / 3} y1={26} x2={110 + (idx * (CANVAS_W - 220)) / 3} y2={CANVAS_H - 12} stroke="#334155" strokeDasharray="3 3" />
                          <text
                            x={110 + (idx * (CANVAS_W - 220)) / 3}
                            y={18}
                            fill={CATEGORY_STYLE[cat].text}
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            STAGE {idx + 1}: {(hi ? CATEGORY_STYLE[cat].hi : CATEGORY_STYLE[cat].en).toUpperCase()}
                          </text>
                        </React.Fragment>
                      ))}
                    </g>
                  )}

                  {edges.map((edge, idx) => {
                    const s = nodeById[edge.source];
                    const t = nodeById[edge.target];
                    if (!s || !t) return null;
                    const isActiveFocus = !!focusId && (edge.source === focusId || edge.target === focusId);
                    const hidden = !visibleIds.has(edge.source) || !visibleIds.has(edge.target);
                    const stroke = isActiveFocus ? '#f59e0b' : edge.type === 'SAME_TOPIC' ? '#475569' : '#334155';
                    return (
                      <g key={`${edge.source}-${edge.target}-${idx}`} opacity={hidden ? 0.06 : focusId && !isActiveFocus ? 0.18 : 0.9}>
                        <line
                          x1={s.x}
                          y1={s.y}
                          x2={t.x}
                          y2={t.y}
                          stroke={stroke}
                          strokeWidth={Math.max(1, Math.min(3.5, (edge.weight || 1) / 3)) + (isActiveFocus ? 1 : 0)}
                          markerEnd={isActiveFocus ? 'url(#arrow-active)' : 'url(#arrow-default)'}
                          strokeDasharray={edge.type === 'SAME_REGION' ? '4 4' : undefined}
                        />
                        {isActiveFocus && (
                          <text x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 - 6} fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="middle" className="font-mono">
                            {EDGE_TYPE_LABEL[edge.type] || edge.type}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {nodes.map((node) => {
                    const isSelected = selectedId === node.id;
                    const isHovered = hoveredId === node.id;
                    const dimmed = !visibleIds.has(node.id) || (focusId ? !connectedIds.has(node.id) : false);
                    const style = CATEGORY_STYLE[node.category];
                    return (
                      <g
                        key={node.id}
                        onClick={() => setSelectedId(node.id)}
                        onMouseEnter={() => setHoveredId(node.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        opacity={dimmed ? 0.18 : 1}
                        className="cursor-pointer transition-all duration-200"
                      >
                        {(isSelected || isHovered) && (
                          <circle cx={node.x} cy={node.y} r={node.r + 8} fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" />
                        )}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={node.r}
                          fill={style.fill}
                          stroke={isSelected ? '#ffffff' : style.stroke}
                          strokeWidth={isSelected ? 3 : 2}
                          filter={isSelected || isHovered ? 'url(#glow)' : undefined}
                        />
                        {node.is_suspected_bot && (
                          <circle cx={node.x + node.r * 0.75} cy={node.y - node.r * 0.75} r={5} fill="#0f172a" stroke="#f43f5e" strokeWidth="1.5" />
                        )}
                        <text x={node.x} y={node.y + 4} textAnchor="middle" fill="#ffffff" fontSize={node.r >= 20 ? '11' : '9'} fontWeight="bold" className="pointer-events-none select-none font-mono">
                          {(node.platform || '?').charAt(0).toUpperCase()}
                        </text>
                        <g className="pointer-events-none select-none">
                          <rect
                            x={node.x - 58}
                            y={node.y + node.r + 4}
                            width="116"
                            height="18"
                            rx="4"
                            fill="#0f172a"
                            stroke={isSelected ? '#38bdf8' : '#334155'}
                            strokeWidth={isSelected ? 1.5 : 0.8}
                            opacity="0.92"
                          />
                          <text x={node.x} y={node.y + node.r + 16} textAnchor="middle" fill={isSelected ? '#38bdf8' : '#e2e8f0'} fontSize="8.5" fontWeight={isSelected ? 'bold' : '600'}>
                            {node.label.length > 20 ? `${node.label.slice(0, 19)}…` : node.label}
                          </text>
                        </g>
                        <text x={node.x} y={node.y - node.r - 5} textAnchor="middle" fill={style.text} fontSize="8" fontWeight="bold" className="pointer-events-none select-none font-mono">
                          {fmt(node.engagement)} · {(node.pagerank || 0).toFixed(3)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

          {selected && (
            <div className="pt-3 mt-3 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 bg-slate-50 p-3.5 rounded-xl">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${CATEGORY_STYLE[selected.category].badge}`}>
                      {hi ? CATEGORY_STYLE[selected.category].hi : CATEGORY_STYLE[selected.category].en}
                    </span>
                    <PlatformBadge platform={selected.platform as Platform} size="sm" />
                    {selected.is_suspected_bot && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <Bot className="w-3 h-3" /> {hi ? 'बॉट संकेत' : 'Bot-flagged'}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 truncate">{selected.label}</h4>
                  <p className="text-[10px] font-mono text-slate-500 truncate">
                    {selected.id} · {selected.topic_name || selected.topic_id || 'no topic modelled'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs shrink-0">
                  <div>
                    <span className="text-[10px] text-slate-500 block">{hi ? 'प्रभाव स्कोर' : 'Influence'}</span>
                    <span className="font-mono font-bold text-slate-900">{(selected.pagerank || 0).toFixed(4)}</span>
                    <span className="text-[9px] text-slate-400 ml-1 font-mono">{selected.pagerank_source === 'neo4j-gds' ? 'GDS' : 'eng.'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">{hi ? 'पोस्ट' : 'Posts'}</span>
                    <span className="font-mono font-bold text-slate-900">{fmt(selected.post_count)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">{hi ? 'सहभागिता' : 'Engagement'}</span>
                    <span className="font-mono font-bold text-emerald-700">{fmt(selected.engagement)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">{hi ? 'औसत भावना' : 'Avg sentiment'}</span>
                    <span className={`font-mono font-bold ${(selected.avg_sentiment ?? 0) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {selected.avg_sentiment !== undefined ? selected.avg_sentiment.toFixed(2) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">{hi ? 'संबंध' : 'Links'}</span>
                    <span className="font-mono font-bold text-slate-900">{selected.degree}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2.5">
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <MapPin className="w-3 h-3" /> {selected.region || 'region unknown'}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock className="w-3 h-3" /> {shortTime(selected.last_active)}
                </span>
                <button
                  onClick={() => onNavigatePage?.('live-feed', { topic: selected.topic_id, region: selected.region !== 'Unknown' ? selected.region : undefined })}
                  className="ml-auto flex items-center gap-1 text-[11px] font-bold text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1 hover:bg-slate-50"
                >
                  <ExternalLink className="w-3 h-3" /> {hi ? 'इनकी पोस्ट खोलें' : 'Open their posts in feed'}
                </button>
                <button
                  onClick={() => selected.topic_id && onNavigatePage?.('live-feed', { topic: selected.topic_id, trace: true })}
                  className="flex items-center gap-1 text-[11px] font-bold text-orange-700 border border-orange-200 bg-orange-50 rounded-lg px-2.5 py-1 hover:bg-orange-100"
                >
                  <GitBranch className="w-3 h-3" /> {hi ? 'इस विषय का प्रसार' : 'Provenance of this topic'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right column: ranked accounts + cascade ─────────────────────── */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-serif flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-orange-600" />
                {hi ? 'शीर्ष प्रभावशाली खाते' : 'Top authority accounts'}
              </h3>
              <p className="text-xs text-slate-500">
                {hi
                  ? `${rankingMeta.label} से रैंक किए गए वास्तविक लेखा पंक्तियाँ`
                  : `Ranked by ${rankingMeta.label.toLowerCase()} — derived from live author rows`}
              </p>
            </div>

            {!nodes.length ? (
              <p className="text-xs text-slate-400 py-4 text-center">{hi ? 'कोई खाता नहीं मिला।' : 'No accounts in this scope.'}</p>
            ) : (
              <div className="space-y-2.5">
                {[...nodes]
                  .sort((a, b) => b.pagerank - a.pagerank)
                  .slice(0, 8)
                  .map((inf, idx) => (
                    <div
                      key={inf.id}
                      onClick={() => setSelectedId(inf.id)}
                      className={`p-3 rounded-xl border transition-all bg-slate-50/50 cursor-pointer ${
                        selectedId === inf.id ? 'border-orange-300 ring-2 ring-orange-500/20' : 'border-slate-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{inf.label}</h4>
                            <span className="text-[10px] text-slate-500 font-medium">{hi ? CATEGORY_STYLE[inf.category].hi : CATEGORY_STYLE[inf.category].en}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {inf.is_suspected_bot && <Bot className="w-3.5 h-3.5 text-rose-500" />}
                          <PlatformBadge platform={inf.platform as Platform} size="sm" showName={false} />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-1 pt-2 mt-1 border-t border-slate-200/80 text-[10px] text-center">
                        <div>
                          <span className="text-slate-400 block">{hi ? 'स्कोर' : 'Score'}</span>
                          <span className="font-mono font-bold text-orange-600">{(inf.pagerank || 0).toFixed(3)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Posts</span>
                          <span className="font-mono font-bold text-slate-800">{fmt(inf.post_count)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{hi ? 'सहभागिता' : 'Engage'}</span>
                          <span className="font-mono font-bold text-emerald-600">{fmt(inf.engagement)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Links</span>
                          <span className="font-mono font-bold text-slate-800">{inf.degree}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {hi ? 'नोड चुनने के लिए किसी खाते पर क्लिक करें' : 'Click an account to focus its node on the graph'}
            </div>
          </div>

          {/* Neo4j cascade — honest about missing edges */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-base font-extrabold text-slate-900 font-serif flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                {hi ? 'फ़ॉरवर्डिंग कैस्केड' : 'Forwarding cascade (Neo4j)'}
              </h3>
              <p className="text-xs text-slate-500">
                {topic
                  ? hi ? 'Graph में कैप्चर वास्तविक किनारों से' : 'Real edges walked in the graph for this topic'
                  : hi ? 'कैस्केड देखने के लिए विषय चुनें' : 'Select a topic to walk its cascade'}
              </p>
            </div>

            {!topic ? (
              <p className="text-[11px] text-slate-400 py-3">{hi ? 'विषय चुनें →' : 'Pick a topic above →'}</p>
            ) : cascadeState.loading && cascade.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-3 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {hi ? 'ग्राफ़ चल रहा है…' : 'Walking the graph…'}
              </p>
            ) : cascade.length === 0 ? (
              <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
                {cascadeState.data?.message ||
                  (hi
                    ? 'इस विषय में कोई फ़ॉरवर्डिंग किनारा कैप्चर नहीं हुआ — Telegram API लॉगिन के बिना forwarding graph खाली रहेगा।'
                    : 'No forwarding edges captured for this narrative. Until the Telegram session is authorised, the graph has quotes/replies only — nothing is invented here.')}
              </div>
            ) : (
              <ol className="space-y-2">
                {cascade.slice(0, 10).map((c, idx) => (
                  <li key={`${c.step}-${idx}`} className="flex items-start gap-2 text-[11px]">
                    <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {c.step ?? idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <PlatformBadge platform={(c.platform || 'twitter') as Platform} size="sm" showName={false} />
                        <span className="font-mono text-slate-400">{shortTime(c.timestamp)}</span>
                        {c.edge_type && <span className="text-slate-500">· {EDGE_TYPE_LABEL[c.edge_type] || c.edge_type}</span>}
                      </div>
                      <p className="text-slate-600 truncate">{c.event || c.post_id || c.author_hashed || 'captured post'}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
