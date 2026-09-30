import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, SlidersHorizontal, X, RefreshCw, ShieldAlert, Bot,
  MapPin, Languages, Heart, MessageCircle, Share2, ArrowUpCircle, Clock,
  ChevronDown, ChevronUp, Filter, RotateCcw, Inbox, Activity, Radio, Route,
} from 'lucide-react';
import {
  ConnectorStatus, FeedFilters, FeedTab, Language as AppLanguage, LivePost, Mode,
  NavigateFn, NavigateOpts, Platform,
} from '../types';
import { fetchConnectors, fetchFeedFacets, fetchLivePosts } from '../services/api';
import { useApi } from '../services/useApi';
import { PlatformBadge } from './PlatformBadge';
import { SentimentBadge } from './SentimentBadge';
import { LiveBadge } from './LiveBadge';
import ProvenanceView from './ProvenanceView';
import { DataConnectorsView } from './DataConnectorsView';

interface LiveSignalFeedProps {
  language: AppLanguage;
  /** Passed down to the embedded sources & connectors view. */
  mode?: Mode;
  /**
   * Filters pushed in from elsewhere in the app — the Navbar global search, a
   * clicked demographic bar, or a provenance jump. Applied on top of local state.
   */
  initialFilters?: NavigateOpts;
  onNavigatePage?: NavigateFn;
}

const TIME_PRESETS = [
  { key: 'all', labelEn: 'All time', labelHi: 'सभी समय', hours: 0 },
  { key: '1h', labelEn: 'Last hour', labelHi: 'पिछला 1 घंटा', hours: 1 },
  { key: '6h', labelEn: 'Last 6 hours', labelHi: 'पिछले 6 घंटे', hours: 6 },
  { key: '24h', labelEn: 'Last 24 hours', labelHi: 'पिछले 24 घंटे', hours: 24 },
  { key: '7d', labelEn: 'Last 7 days', labelHi: 'पिछले 7 दिन', hours: 168 },
  { key: '30d', labelEn: 'Last 30 days', labelHi: 'पिछले 30 दिन', hours: 720 },
] as const;

const SORT_OPTIONS = [
  { key: 'timestamp', labelEn: 'Newest first', labelHi: 'नवीनतम पहले' },
  { key: 'engagement', labelEn: 'Highest engagement', labelHi: 'सर्वाधिक सहभागिता' },
  { key: 'sentiment', labelEn: 'Sentiment score', labelHi: 'भावना स्कोर' },
  { key: 'forwards', labelEn: 'Most forwarded', labelHi: 'सर्वाधिक फ़ॉरवर्ड' },
] as const;

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

function sinceForPreset(hours: number): string | undefined {
  if (!hours) return undefined;
  return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}

/** Dominant emotion from the ML emotion head, e.g. {anxiety: 0.6, anger: 0.2}. */
function topEmotion(emotions: Record<string, number> | null): { name: string; value: number } | null {
  if (!emotions || typeof emotions !== 'object') return null;
  const entries = Object.entries(emotions)
    .map(([name, value]) => ({ name, value: Number(value) || 0 }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value);
  return entries[0] || null;
}

/**
 * Connector status strings come straight from the tracker table (`OK`, `ERROR`,
 * `Rate limited: 429`, `Standby (no credentials)`, …) so colour them by meaning
 * instead of assuming a fixed enum.
 */
function connectorTone(status: string, configured: boolean, isDemo: boolean) {
  const s = String(status || '').toUpperCase();
  if (/ERROR|FAIL|UNAUTH|REGISTERED|401|403/.test(s)) return { chip: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' };
  if (/RATE|LIMIT|429|THROTTLE|QUOTA/.test(s)) return { chip: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' };
  if (/STANDBY|UNCONFIG|INACTIVE|IDLE|NO CREDENTIAL|DEMO|SAMPLE/.test(s) || !configured) return { chip: 'bg-slate-100 text-slate-600 border-slate-200', dot: isDemo ? 'bg-amber-400' : 'bg-slate-400' };
  return { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500 animate-pulse' };
}

const LiveSignalFeed: React.FC<LiveSignalFeedProps> = ({
  language,
  mode = 'normal',
  initialFilters,
  onNavigatePage,
}) => {
  const hi = language === 'hi';

  // Single page, two views: the captured signals themselves, and where they come
  // from (connectors + ingestion architecture). Origin tracing is a per-post panel.
  const [tab, setTab] = useState<FeedTab>(initialFilters?.tab || 'feed');
  const [trace, setTrace] = useState<{ topic?: string; postKey?: string } | null>(
    initialFilters?.trace
      ? { topic: initialFilters.topic, postKey: initialFilters.postKey }
      : null
  );
  const traceRef = useRef<HTMLDivElement | null>(null);

  const [keyword, setKeyword] = useState(initialFilters?.q || '');
  const [debouncedKeyword, setDebouncedKeyword] = useState(initialFilters?.q || '');
  const [platform, setPlatform] = useState<string>(initialFilters?.platform || '');
  const [sentiment, setSentiment] = useState<string>(initialFilters?.sentiment || '');
  const [topic, setTopic] = useState<string>(initialFilters?.topic || '');
  const [region, setRegion] = useState<string>(initialFilters?.region || '');
  const [languageCode, setLanguageCode] = useState<string>(initialFilters?.language || '');
  const [bot, setBot] = useState<'' | 'true' | 'false'>(initialFilters?.bot || '');
  const [minScore, setMinScore] = useState<string>('');
  const [maxScore, setMaxScore] = useState<string>('');
  const [timePreset, setTimePreset] = useState<string>('all');
  const [sort, setSort] = useState<NonNullable<FeedFilters['sort']>>('timestamp');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState<number>(25);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Accumulated posts across "load more" pages, plus a banner for signals that
  // appeared while the analyst was already reading the feed.
  const [accumulated, setAccumulated] = useState<LivePost[]>([]);
  const [newSignalCount, setNewSignalCount] = useState<number>(0);
  const baselineCountRef = useRef<number | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedKeyword(keyword), 350);
    return () => clearTimeout(id);
  }, [keyword]);

  // Incoming navigation filters override local state whenever they change, so a
  // second global search from the Navbar always lands on a fresh result set.
  const incomingSignature = JSON.stringify(initialFilters ?? {});
  useEffect(() => {
    if (!initialFilters) return;
    if (initialFilters.tab) setTab(initialFilters.tab);
    setKeyword(initialFilters.q || '');
    setDebouncedKeyword(initialFilters.q || '');
    if (initialFilters.platform !== undefined) setPlatform(initialFilters.platform || '');
    if (initialFilters.sentiment !== undefined) setSentiment(initialFilters.sentiment || '');
    if (initialFilters.topic !== undefined) setTopic(initialFilters.topic || '');
    if (initialFilters.region !== undefined) setRegion(initialFilters.region || '');
    if (initialFilters.language !== undefined) setLanguageCode(initialFilters.language || '');
    if (initialFilters.bot !== undefined) setBot(initialFilters.bot || '');
    if (initialFilters.trace) {
      setTab('feed');
      setTrace({ topic: initialFilters.topic, postKey: initialFilters.postKey });
    } else {
      setTrace(null);
    }
    setNewSignalCount(0);
    baselineCountRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingSignature]);

  const filters = useMemo<FeedFilters>(
    () => ({
      q: debouncedKeyword.trim() || undefined,
      platform: platform || undefined,
      sentiment: sentiment || undefined,
      topic: topic || undefined,
      region: region || undefined,
      language: languageCode || undefined,
      bot,
      minScore: minScore || undefined,
      maxScore: maxScore || undefined,
      since: sinceForPreset(TIME_PRESETS.find((p) => p.key === timePreset)?.hours ?? 0),
      sort,
      order,
      limit: pageSize,
      offset: 0,
    }),
    [debouncedKeyword, platform, sentiment, topic, region, languageCode, bot, minScore, maxScore, timePreset, sort, order, pageSize]
  );

  const fetcher = useCallback(() => fetchLivePosts(filters), [filters]);
  const { data, isLive, loading, error, lastUpdated, refresh } = useApi(fetcher, {
    refreshInterval: autoRefresh ? 12000 : 0,
    deps: [filters],
    keepPrevious: true,
  });

  // Facets come from DISTINCT values in the database, so no dropdown ever offers a
  // filter that returns zero rows.
  const facetsState = useApi(() => fetchFeedFacets(), { refreshInterval: 120000 });
  const facets = facetsState.data;

  // Real connector health — same rows the ingestion workers write after each run.
  const connectorsState = useApi(() => fetchConnectors(), { refreshInterval: 30000, keepPrevious: true });
  const connectors = (connectorsState.data?.connectors ?? []) as ConnectorStatus[];

  const posts = data?.posts ?? [];
  const totalMatching = data?.total_matching ?? posts.length;

  // Reset the accumulator whenever the active result set changes.
  const filterSignature = JSON.stringify(filters);
  useEffect(() => {
    setAccumulated(posts);
    if (baselineCountRef.current === null) baselineCountRef.current = totalMatching;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSignature, lastUpdated?.getTime()]);

  // Detect genuinely new signals: total grew while the analyst stayed on the page.
  useEffect(() => {
    if (baselineCountRef.current === null) {
      baselineCountRef.current = totalMatching;
      return;
    }
    const baseline = baselineCountRef.current;
    if (totalMatching > baseline) {
      setNewSignalCount((c) => c + (totalMatching - baseline));
    }
    if (totalMatching < baseline) {
      setNewSignalCount(0);
    }
    baselineCountRef.current = totalMatching;
  }, [totalMatching]);

  const displayed = useMemo(() => {
    // Guard against duplicate keys when "load more" overlaps a live refresh.
    const seen = new Set<string>();
    return accumulated.filter((p) => {
      const key = `${p.post_key || p.post_id}-${p.timestamp}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [accumulated]);

  const loadMore = async () => {
    const nextOffset = displayed.length;
    const res = await fetchLivePosts({ ...filters, offset: nextOffset });
    setAccumulated((prev) => [...prev, ...(res.data.posts || [])]);
  };

  const resetFilters = () => {
    setKeyword('');
    setDebouncedKeyword('');
    setPlatform('');
    setSentiment('');
    setTopic('');
    setRegion('');
    setLanguageCode('');
    setBot('');
    setMinScore('');
    setMaxScore('');
    setTimePreset('all');
    setSort('timestamp');
    setOrder('desc');
  };

  const activeChips: { label: string; clear: () => void }[] = [];
  if (debouncedKeyword.trim()) activeChips.push({ label: `"${debouncedKeyword.trim()}"`, clear: () => setKeyword('') });
  if (platform) activeChips.push({ label: platform, clear: () => setPlatform('') });
  if (sentiment) activeChips.push({ label: sentiment, clear: () => setSentiment('') });
  if (topic) {
    const name = facets?.topics?.find((t) => t.topic_id === topic)?.topic_name || topic;
    activeChips.push({ label: name, clear: () => setTopic('') });
  }
  if (region) activeChips.push({ label: region, clear: () => setRegion('') });
  if (languageCode) activeChips.push({ label: languageCode, clear: () => setLanguageCode('') });
  if (bot) activeChips.push({ label: bot === 'true' ? (hi ? 'बॉट संकेत' : 'Bot-flagged') : hi ? 'गैर-बॉट' : 'Human', clear: () => setBot('') });
  if (minScore || maxScore) activeChips.push({ label: `score ${minScore || '-1'}…${maxScore || '1'}`, clear: () => { setMinScore(''); setMaxScore(''); } });
  if (timePreset !== 'all') {
    const p = TIME_PRESETS.find((x) => x.key === timePreset)!;
    activeChips.push({ label: hi ? p.labelHi : p.labelEn, clear: () => setTimePreset('all') });
  }

  const selectClass =
    'w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400';

  const emotionCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    displayed.forEach((p) => {
      const e = topEmotion(p.emotions);
      if (e) acc[e.name] = (acc[e.name] || 0) + 1;
    });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [displayed]);

  // Which card hosts the origin-trace panel: the exact post when a post_key came
  // in, otherwise the first card that belongs to the traced narrative.
  const traceTargetKey = useMemo(() => {
    if (!trace) return null;
    if (trace.postKey) return trace.postKey;
    const first = displayed.find((p) => !trace.topic || p.topic_id === trace.topic);
    return first ? first.post_key || first.post_id : null;
  }, [trace, displayed]);

  // Bring the opened panel into view — it can sit inside a card further down.
  useEffect(() => {
    if (!trace) return;
    const id = setTimeout(() => traceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    return () => clearTimeout(id);
  }, [trace, traceTargetKey]);

  const tracePanel = trace ? (
    <div ref={traceRef} className="mt-4 pt-4 border-t border-dashed border-slate-200 bg-slate-50/60 rounded-lg px-3 pb-3">
      <div className="flex items-center justify-between gap-2 py-2">
        <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
          <Route className="w-3.5 h-3.5 text-orange-600" />
          {hi ? 'यह समाचार कैसे पहुँचा — उत्पत्ति व प्रसार' : 'How this arrived — origin & spread'}
        </h3>
        <button
          onClick={() => setTrace(null)}
          className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-900"
        >
          <X className="w-3.5 h-3.5" /> {hi ? 'बंद करें' : 'Close trace'}
        </button>
      </div>
      <ProvenanceView
        key={`${trace.topic || ''}|${trace.postKey || ''}`}
        language={language}
        embedded
        initialTopic={trace.topic}
        initialPostKey={trace.postKey}
        onNavigatePage={onNavigatePage}
      />
    </div>
  ) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-orange-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {hi ? 'लाइव डेटा व सिग्नल' : 'Live Data & Signals'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {hi
              ? 'सभी प्लेटफ़ॉर्म से एकत्रित असली पोस्ट — पूर्ण खोज, छाँट, कनेक्टर स्थिति और हर पोस्ट का अपना उत्पत्ति-विश्लेषण।'
              : 'Every post the pipeline captured — keyword search, faceted filters, auto-refresh, live connector health, and an origin trace on each story. The connectors themselves are one tab away.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LiveBadge isLive={isLive} loading={loading} lastUpdated={lastUpdated} onRefresh={refresh} />
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
            title={hi ? 'स्वतः ताज़ा करें' : 'Toggle auto-refresh'}
          >
            <Activity className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? (hi ? '12s ताज़ा' : '12s') : hi ? 'रोका' : 'Paused'}
          </button>
        </div>
      </div>

      {/* ── Page tabs: the captured signals, and where they come from ── */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'feed' as FeedTab, label: hi ? 'लाइव सिग्नल' : 'Live signals', icon: <Inbox className="w-3.5 h-3.5" />, count: totalMatching },
          { key: 'sources' as FeedTab, label: hi ? 'स्रोत व कनेक्टर्स' : 'Sources & connectors', icon: <Radio className="w-3.5 h-3.5" />, count: connectors.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold border transition-all ${
              tab === t.key
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.icon}
            {t.label}
            <span className={`text-[10px] font-mono px-1.5 rounded ${tab === t.key ? 'bg-white/15' : 'bg-slate-100'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Real connector health: the rows the ingestion workers write ── */}
      {tab === 'feed' && (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3 h-3" /> {hi ? 'कनेक्टर स्थिति (असली)' : 'Connector health (from /system/connectors)'}
          </span>
          <button
            onClick={connectorsState.refresh}
            className="text-[10px] font-semibold text-slate-400 hover:text-orange-600 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${connectorsState.loading ? 'animate-spin' : ''}`} />
            {hi ? 'ताज़ा' : 'refresh'}
          </button>
        </div>

        {connectors.length === 0 ? (
          <p className="text-[11px] text-slate-400 py-2">
            {connectorsState.loading
              ? hi ? 'कनेक्टर स्थिति लोड हो रही है…' : 'Loading connector status…'
              : hi ? 'कोई कनेक्टर रिकॉर्ड नहीं — ingestion worker चालू करें।' : 'No connector rows reported yet — start the ingestion worker.'}
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {connectors.map((c) => {
              const tone = connectorTone(c.status, c.configured, c.is_demo);
              const active = platform === c.platform;
              return (
                <button
                  key={c.platform}
                  onClick={() => {
                    // Clicking a source is a filter, not a page change.
                    setPlatform(active ? '' : c.platform);
                    setTab('feed');
                  }}
                  title={c.error_message || c.message || undefined}
                  className={`shrink-0 text-left rounded-lg border px-2.5 py-2 min-w-[150px] transition-all ${
                    tone.chip
                  } ${active ? 'ring-2 ring-orange-500/40' : 'hover:shadow-xs'}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                    <PlatformBadge platform={(c.platform as Platform) || 'twitter'} size="sm" showName />
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[10px] font-mono">
                    <span className="font-bold uppercase tracking-wide">{c.status}</span>
                    <span className="opacity-70">{relativeTime(c.last_fetch)}</span>
                  </div>
                  {c.error_message && (
                    <span className="mt-1 block text-[9px] leading-snug opacity-80 line-clamp-2">{c.error_message}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* ── Sources tab: live connector status table + ingestion architecture ── */}
      {tab === 'sources' && <DataConnectorsView language={language} mode={mode} embedded />}

      {tab === 'feed' && (
        <>
      {/* New signals banner */}
      {newSignalCount > 0 && (
        <button
          onClick={() => {
            setNewSignalCount(0);
            baselineCountRef.current = null;
            refresh();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors shadow-sm"
        >
          <ArrowUpCircle className="w-4 h-4" />
          {hi
            ? `${newSignalCount} नए सिग्नल मिले — देखने के लिए क्लिक करें`
            : `${newSignalCount} new signal${newSignalCount > 1 ? 's' : ''} captured — click to load`}
        </button>
      )}

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={
              hi
                ? 'कीवर्ड, विषय, क्षेत्र या पोस्ट आईडी खोजें…'
                : 'Search keywords, topic names, regions, hashtags or a post id…'
            }
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:bg-white"
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{hi ? 'प्लेटफ़ॉर्म' : 'Platform'}</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={selectClass}>
              <option value="">{hi ? 'सभी' : 'All platforms'}</option>
              {(facets?.platforms?.length ? facets.platforms : ['telegram', 'youtube', 'reddit', 'facebook', 'twitter']).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{hi ? 'भावना' : 'Sentiment'}</label>
            <select value={sentiment} onChange={(e) => setSentiment(e.target.value)} className={selectClass}>
              <option value="">{hi ? 'सभी' : 'Any'}</option>
              {(facets?.sentiments?.length ? facets.sentiments : ['positive', 'neutral', 'negative']).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{hi ? 'विषय' : 'Topic'}</label>
            <select value={topic} onChange={(e) => setTopic(e.target.value)} className={selectClass}>
              <option value="">{hi ? 'सभी विषय' : 'All topics'}</option>
              {(facets?.topics || []).map((t) => (
                <option key={t.topic_id} value={t.topic_id}>
                  {(t.topic_name || t.topic_id || '').slice(0, 34)} ({t.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{hi ? 'क्षेत्र' : 'Region'}</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className={selectClass}>
              <option value="">{hi ? 'सभी राज्य' : 'All regions'}</option>
              {(facets?.regions || []).map((r) => (
                <option key={r.region} value={r.region || ''}>
                  {r.region} ({r.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{hi ? 'भाषा' : 'Language'}</label>
            <select value={languageCode} onChange={(e) => setLanguageCode(e.target.value)} className={selectClass}>
              <option value="">{hi ? 'सभी भाषाएँ' : 'All languages'}</option>
              {(facets?.languages || []).map((l) => (
                <option key={l.language} value={l.language || ''}>
                  {l.language} ({l.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{hi ? 'समय सीमा' : 'Time window'}</label>
            <select value={timePreset} onChange={(e) => setTimePreset(e.target.value)} className={selectClass}>
              {TIME_PRESETS.map((p) => (
                <option key={p.key} value={p.key}>{hi ? p.labelHi : p.labelEn}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3" /> {hi ? 'अतिरिक्त' : 'More'}
          </span>

          <button
            onClick={() => setBot((v) => (v === 'true' ? '' : v === 'false' ? 'true' : 'false'))}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border ${
              bot === 'true'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : bot === 'false'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
            title={hi ? 'बॉट छाँट' : 'Filter bot-flagged vs human'}
          >
            <Bot className="w-3.5 h-3.5" />
            {bot === 'true' ? (hi ? 'केवल बॉट' : 'Bot-flagged only') : bot === 'false' ? (hi ? 'केवल मानव' : 'Human only') : hi ? 'बॉट: कोई भी' : 'Bot: any'}
          </button>

          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span className="font-semibold">{hi ? 'स्कोर' : 'Score'}</span>
            <input
              type="number"
              step="0.1"
              min="-1"
              max="1"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              placeholder="-1"
              className="w-16 text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-1"
            />
            <span>→</span>
            <input
              type="number"
              step="0.1"
              min="-1"
              max="1"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              placeholder="1"
              className="w-16 text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-1"
            />
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="text-[11px] bg-white border border-slate-200 rounded-md px-2 py-1"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.key} value={s.key}>{hi ? s.labelHi : s.labelEn}</option>
              ))}
            </select>
            <button
              onClick={() => setOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
              className="text-[11px] px-2 py-1 border border-slate-200 rounded-md bg-white text-slate-600 hover:bg-slate-50"
              title={hi ? 'क्रम उलटें' : 'Toggle order'}
            >
              {order === 'desc' ? '↓' : '↑'}
            </button>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-[11px] px-2 py-1 border border-slate-200 rounded-md bg-white text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="w-3 h-3" /> {hi ? 'रीसेट' : 'Reset'}
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            {activeChips.map((chip, i) => (
              <button
                key={i}
                onClick={chip.clear}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-semibold hover:bg-slate-700"
              >
                {chip.label}
                <X className="w-2.5 h-2.5" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result meta */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">
            {loading && displayed.length === 0 ? '…' : displayed.length}
          </span>
          <span className="text-slate-500">
            {hi ? 'दिखाए गए' : 'shown'} · <strong className="text-slate-700">{totalMatching}</strong> {hi ? 'मेल खाते रिकॉर्ड' : 'matching records in database'}
          </span>
        </div>
        {emotionCounts.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase text-slate-400">{hi ? 'प्रबल भावनाएँ' : 'Dominant emotions'}:</span>
            {emotionCounts.map(([name, count]) => (
              <span key={name} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {name} <strong>{count}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2">
          {hi ? 'फ़ीड लोड करने में त्रुटि' : 'Failed to load feed'}: {error}
        </div>
      )}

      {/* Fallback host when the traced narrative has no card on screen yet */}
      {trace && !traceTargetKey && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">{tracePanel}</div>
      )}

      {/* Post list */}
      <div className="space-y-3">
        {loading && displayed.length === 0 &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse border border-slate-200" />
          ))}

        {!loading && displayed.length === 0 && (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
            <SlidersHorizontal className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">
              {hi ? 'इन फ़िल्टर से कोई पोस्ट नहीं मिला' : 'No captured signals match these filters'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {hi
                ? 'समय सीमा बढ़ाएँ या कुछ फ़िल्टर हटाएँ।'
                : 'Widen the time window or remove a filter — the query runs against the live TimescaleDB hypertable.'}
            </p>
            <button onClick={resetFilters} className="mt-4 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white">
              {hi ? 'फ़िल्टर रीसेट करें' : 'Reset filters'}
            </button>
          </div>
        )}

        {displayed.map((post) => {
          const emotion = topEmotion(post.emotions);
          // Freshness, not a label: anything inside the last hour came off the live
          // pipeline; older rows are the retained archive. No synthetic markers shown.
          const capturedAt = post.timestamp ? new Date(post.timestamp).getTime() : NaN;
          const isFresh = Number.isFinite(capturedAt) && Date.now() - capturedAt < 60 * 60 * 1000;
          const isBot = !!post.is_suspected_bot;
          return (
            <article
              key={`${post.post_key || post.post_id}-${post.timestamp}`}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <PlatformBadge platform={(post.platform as Platform) || 'twitter'} size="sm" showName />
                  <SentimentBadge sentiment={post.sentiment} lang={language} />
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {relativeTime(post.timestamp)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {isBot && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                      <Bot className="w-3 h-3" /> {hi ? 'संकल्पित बॉट' : 'Bot / coordinated'}
                    </span>
                  )}
                  {isFresh ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {hi ? 'लाइव कैप्चर' : 'LIVE CAPTURE'}
                    </span>
                  ) : (
                    <span
                      title={hi ? 'पाइपलाइन से इनजेस्टेड एवं इंडेक्स्ड' : 'Ingested and indexed from the pipeline'}
                      className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> {hi ? 'इनजेस्टेड' : 'INGESTED'}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-800 mt-3 leading-relaxed line-clamp-3">
                {post.text || (hi ? '(रिक्त टेक्स्ट)' : '(no text captured)')}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-slate-500">
                {post.topic_name && (
                  <button
                    onClick={() => setTopic(post.topic_id || '')}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 font-semibold hover:bg-orange-100"
                  >
                    # {post.topic_name}
                  </button>
                )}
                {post.region && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{post.region}</span>
                )}
                {post.language && (
                  <span className="flex items-center gap-1"><Languages className="w-3 h-3" />{post.language}</span>
                )}
                {post.stance && <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">{hi ? 'स्टैंस' : 'stance'}: {post.stance}</span>}
                {emotion && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                    {emotion.name} {Math.round(emotion.value * 100)}%
                  </span>
                )}
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes ?? 0}</span>
                <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{post.shares ?? 0}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.comments_count ?? 0}</span>
                {post.forward_count ? <span className="flex items-center gap-1">↪ {post.forward_count}×</span> : null}
                <span className="font-mono text-slate-400">score {Number(post.sentiment_score ?? 0).toFixed(2)}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    const key = post.post_key || post.post_id;
                    setTrace(traceTargetKey === key ? null : { topic: post.topic_id || undefined, postKey: post.post_key || undefined });
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-700"
                >
                  {traceTargetKey === (post.post_key || post.post_id) ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <Route className="w-3.5 h-3.5" />
                  )}
                  {hi ? 'आगमन ट्रैस करें' : 'Trace how this arrived'}
                </button>
                <button
                  onClick={() => onNavigatePage?.('network', { topic: post.topic_id || undefined })}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {hi ? 'नेटवर्क में देखें' : 'View in network'}
                </button>
                {post.author_hashed && (
                  <span className="text-[10px] font-mono text-slate-400 ml-auto">
                    {hi ? 'लेखक (hash)' : 'author (sha256)'}: {post.author_hashed.slice(0, 12)}
                  </span>
                )}
              </div>

              {traceTargetKey === (post.post_key || post.post_id) && tracePanel}
            </article>
          );
        })}
      </div>

      {/* Pagination */}
      {displayed.length > 0 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>{hi ? 'पृष्ठ आकार' : 'Page size'}</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-md px-2 py-1"
            >
              {[10, 25, 50, 100, 200].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {displayed.length < totalMatching ? (
              <button
                onClick={loadMore}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                {hi ? 'अधिक लोड करें' : `Load ${Math.min(pageSize, totalMatching - displayed.length)} more`}
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">{hi ? 'सभी रिकॉर्ड दिखे' : 'All matching records shown'}</span>
            )}
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {hi ? 'ताज़ा करें' : 'Refresh'}
            </button>
          </div>
        </div>
      )}

      {isLive && totalMatching > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
          <ShieldAlert className="w-3 h-3" />
          {hi
            ? 'प्रश्न सीधे TimescaleDB hypertable पर चला — कोई मॉक डेटा नहीं।'
            : 'Query executed directly against the TimescaleDB hypertable — filters, sort and offset are all server-side.'}
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default LiveSignalFeed;
