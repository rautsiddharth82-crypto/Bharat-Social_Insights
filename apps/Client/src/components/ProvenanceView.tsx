import React, { useCallback, useMemo, useState } from 'react';
import {
  Route, Radio, Clock, Zap, Database, Share2, Bot, GitBranch,
  ArrowRight, Layers, Cpu, Network, ShieldCheck, Timer, Search, RefreshCw, AlertTriangle,
  Languages, Globe,
} from 'lucide-react';
import { Language as AppLanguage, CascadeResponse, LivePost, NavigateFn, PipelineStage, Platform, ProvenanceArrivalStep } from '../types';
import { fetchCascade, fetchFeedFacets, fetchLivePosts, fetchPipelineTelemetry, fetchProvenance } from '../services/api';
import { useApi } from '../services/useApi';
import { PlatformBadge } from './PlatformBadge';
import { SentimentBadge } from './SentimentBadge';
import { LiveBadge } from './LiveBadge';

interface ProvenanceViewProps {
  language: AppLanguage;
  initialTopic?: string;
  initialPostKey?: string;
  onNavigatePage?: NavigateFn;
  /**
   * Rendered inside the Live Data & Signals page as a per-post feature panel:
   * no page title, no standalone padding.
   */
  embedded?: boolean;
}

function formatLag(seconds: number | null | undefined, hi: boolean): string {
  if (seconds === null || seconds === undefined) return '—';
  const abs = Math.abs(seconds);
  if (abs < 60) return `${abs}s`;
  if (abs < 3600) return `${Math.round(abs / 60)}m ${abs % 60}s`;
  if (abs < 86400) return `${Math.floor(abs / 3600)}h ${Math.round((abs % 3600) / 60)}m`;
  return `${Math.floor(abs / 86400)}d ${Math.round((abs % 86400) / 3600)}h`;
}

function absoluteTime(iso: string | null | undefined, hi: boolean): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(hi ? 'hi-IN' : 'en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

const STAGE_ICONS: Record<string, React.ReactNode> = {
  collect: <Radio className="w-4 h-4" />,
  queue: <Layers className="w-4 h-4" />,
  clean: <Zap className="w-4 h-4" />,
  lang: <Languages className="w-4 h-4" />,
  gazetteer: <Globe className="w-4 h-4" />,
  bot: <Bot className="w-4 h-4" />,
  'ml-sentiment': <Cpu className="w-4 h-4" />,
  'ml-topics': <Cpu className="w-4 h-4" />,
  'ml-stance': <Cpu className="w-4 h-4" />,
  store: <Database className="w-4 h-4" />,
  privacy: <ShieldCheck className="w-4 h-4" />,
};

const ProvenanceView: React.FC<ProvenanceViewProps> = ({
  language,
  initialTopic,
  initialPostKey,
  onNavigatePage,
  embedded = false,
}) => {
  const hi = language === 'hi';
  const [topic, setTopic] = useState<string>(initialTopic || '');
  const [postKey, setPostKey] = useState<string>(initialPostKey || '');
  const [windowHours, setWindowHours] = useState<number>(72);

  const facetsState = useApi(() => fetchFeedFacets(), { refreshInterval: 120000 });
  const facets = facetsState.data;

  const provFetcher = useCallback(
    () => fetchProvenance({ topic: topic || undefined, post_key: postKey || undefined, window_hours: windowHours }),
    [topic, postKey, windowHours]
  );
  const prov = useApi(provFetcher, { deps: [topic, postKey, windowHours], keepPrevious: true });
  const data = prov.data;

  const pipelineFetcher = useCallback(() => fetchPipelineTelemetry(), []);
  const pipeline = useApi(pipelineFetcher, { refreshInterval: 20000, keepPrevious: true });
  const tele = pipeline.data;

  const resolvedTopic = topic || data?.topic || '';
  const emptyCascade: CascadeResponse = { topic: '', cascade: [], source: 'empty', message: 'Select a narrative to trace its graph cascade.' };
  const cascadeFetcher = useCallback(
    () => (resolvedTopic ? fetchCascade(resolvedTopic) : Promise.resolve({ data: emptyCascade, isLive: false as const })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolvedTopic]
  );
  const cascade = useApi<CascadeResponse>(cascadeFetcher, { deps: [resolvedTopic], keepPrevious: true });

  // If the analyst searched for a free-text term instead of picking a topic, resolve
  // the strongest matching signal so provenance always has something real to show.
  const [searchTerm, setSearchTerm] = useState('');
  const searchResolve = useApi(
    () =>
      searchTerm.trim()
        ? fetchLivePosts({ q: searchTerm.trim(), limit: 1, sort: 'engagement' })
        : Promise.resolve({
            data: { posts: [] as LivePost[], total: 0, total_matching: 0, source: 'empty' as const },
            isLive: false,
          }),
    { immediate: false, deps: [searchTerm] }
  );

  const arrival = data?.platform_arrival ?? [];
  const stats = data?.statistics;
  const stages: PipelineStage[] = tele?.pipeline_stages ?? [];

  const stageRuntime = useMemo(() => {
    // Map live telemetry onto each stage so the diagram shows real counters.
    const q = tele?.queue || {};
    const db = tele?.database || {};
    const mlStatus = (tele?.ml as any)?.status;
    return {
      collect: `${tele?.connectors?.filter((c) => c.configured).length ?? 0} credentialed / ${tele?.connectors?.length ?? 0} connectors`,
      queue: `${q.waiting ?? 0} waiting · ${q.active ?? 0} active · ${q.completed ?? 0} done`,
      clean: `${db.total_posts ?? 0} normalised`,
      lang: `${db.total_posts ?? 0} classified`,
      gazetteer: `${db.total_posts ?? 0} geo-tagged`,
      bot: `${db.total_posts ?? 0} screened`,
      'ml-sentiment': mlStatus === 'unreachable' ? (hi ? 'नेटिव लैक्सिकॉन स्कोरिंग' : 'native lexicon scoring') : mlStatus || '—',
      'ml-topics': `${db.topics ?? 0} topics`,
      'ml-stance': `${db.total_posts ?? 0} scored`,
      store: `${db.total_posts ?? 0} rows · ${tele?.graph?.nodes ?? 0} nodes`,
      privacy: `${db.total_posts ?? 0} hashed`,
    } as Record<string, string>;
  }, [tele, hi]);

  const totalNodes = arrival.reduce((acc, a) => acc + (Number(a.engagement) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header — the page owns this when standalone, the host card owns it when embedded */}
      {!embedded && (
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-orange-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {hi ? 'समाचार कैसे पहुँचा — उत्पत्ति विश्लेषण' : 'How the News Arrived — Origin & Spread Forensics'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            {hi
              ? 'हरेक कैप्चर की गई पोस्ट दो समय रखती है: पोस्ट का अपना समय, और हमारे पाइपलाइन द्वारा उसे पकड़े जाने का समय। यही अंतर पहचान की विलंबता है।'
              : 'Every captured post carries two timestamps: when the content existed in the wild, and when our connectors + queue + ML pipeline actually stored it. The gap between them is real detection latency — this page reconstructs the arrival order from those rows.'}
          </p>
        </div>
        <LiveBadge isLive={prov.isLive} loading={prov.loading} lastUpdated={prov.lastUpdated} onRefresh={prov.refresh} />
      </div>
      )}

      {embedded && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500 max-w-3xl">
            {hi
              ? 'पोस्ट का अपना समय और पाइपलाइन द्वारा पकड़े जाने का समय — यही असली पहचान विलंबता है।'
              : 'Stored rows only: the gap between the post timestamp and our capture timestamp is the real detection latency.'}
          </p>
          <LiveBadge isLive={prov.isLive} loading={prov.loading} lastUpdated={prov.lastUpdated} onRefresh={prov.refresh} />
        </div>
      )}

      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{hi ? 'विषय चुनें' : 'Narrative / topic'}</label>
            <select
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setPostKey(''); }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              <option value="">{hi ? 'स्वतः (सर्वाधिक सक्रिय)' : 'Auto (busiest narrative)'}</option>
              {(facets?.topics || []).map((t) => (
                <option key={t.topic_id} value={t.topic_id}>
                  {(t.topic_name || t.topic_id || '').slice(0, 32)} · {t.count} posts
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{hi ? 'समय विंडो' : 'Look-back window'}</label>
            <select
              value={windowHours}
              onChange={(e) => setWindowHours(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              {[6, 24, 72, 168, 720].map((h) => (
                <option key={h} value={h}>
                  {h < 24 ? `${h}h` : h === 24 ? '1 day' : `${h / 24} days`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{hi ? 'पोस्ट आईडी' : 'Specific post_key'}</label>
            <input
              value={postKey}
              onChange={(e) => { setPostKey(e.target.value); if (e.target.value) setTopic(''); }}
              placeholder="telegram_123456"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{hi ? 'कीवर्ड से खोजें' : 'Or resolve by keyword'}</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') searchResolve.refresh();
                }}
                placeholder="flood, aqi, neet…"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
              <button
                onClick={() => searchResolve.refresh()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600"
                title={hi ? 'खोजें' : 'Resolve'}
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {searchResolve.data?.posts?.[0] && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
            <span className="font-bold text-orange-800">{hi ? 'शीर्ष मिलान:' : 'Top match:'}</span>
            <PlatformBadge platform={(searchResolve.data.posts[0].platform as Platform) || 'twitter'} size="sm" showName={false} />
            <span className="text-slate-700 line-clamp-1 flex-1 min-w-[120px]">{searchResolve.data.posts[0].text}</span>
            <button
              onClick={() => {
                setTopic(searchResolve.data!.posts[0].topic_id || '');
                setPostKey(searchResolve.data!.posts[0].post_key || '');
                setSearchTerm('');
              }}
              className="font-bold text-orange-800 underline"
            >
              {hi ? 'इसका उत्पत्ति विश्लेषण करें' : 'Trace this one'}
            </button>
          </div>
        )}
      </div>

      {/* ── Pipeline: through which the data actually flowed ── */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            {hi ? 'पाइपलाइन — डेटा किस चरण से गुज़रा' : 'Ingestion Pipeline — every stage this data passed through'}
          </h2>
          {tele && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                tele.overall === 'healthy'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : tele.overall === 'critical'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {tele.overall.toUpperCase()}
            </span>
          )}
        </div>

        {stages.length === 0 ? (
          <p className="text-xs text-slate-400">{hi ? 'पाइपलाइन टेलीमेट्री लोड हो रही है…' : 'Loading pipeline telemetry…'}</p>
        ) : (
          <ol className="space-y-2">
            {stages.map((stage) => {
              const runtime = stageRuntime[stage.key] || '';
              const degraded =
                stage.key === 'ml-sentiment' && (tele?.ml as any)?.status === 'unreachable';
              return (
                <li
                  key={stage.key}
                  className={`flex items-start gap-3 p-2.5 rounded-lg border ${
                    degraded ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50/70 border-slate-100'
                  }`}
                >
                  <span
                    className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                      degraded ? 'bg-amber-100 text-amber-700' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {STAGE_ICONS[stage.key] || <Zap className="w-4 h-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">#{stage.order}</span>
                      <span className="text-xs font-bold text-slate-800">{stage.name}</span>
                      {degraded && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                          {hi ? 'क्षीण' : 'DEGRADED'}
                        </span>
                      )}
                      {runtime && (
                        <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                          {runtime}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{stage.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {stage.produces.map((p) => (
                        <span key={p} className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* ── Origin card ── */}
      {data?.origin ? (
        <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-extrabold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              {hi ? 'उत्पत्ति — पहला कैप्चर' : 'Patient Zero — first captured instance'}
            </h2>
            <span className="text-[10px] font-mono text-slate-300">
              {data.topic_name || data.topic} · {data.window_hours}h window
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <PlatformBadge platform={(data.origin.platform as Platform) || 'twitter'} size="md" variant="solid" />
            <SentimentBadge sentiment={data.origin.sentiment} lang={language} />
            {data.origin.is_suspected_bot && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-400/30">
                <Bot className="w-3 h-3" /> {hi ? 'संकल्पित बॉट' : 'bot-suspected'}
              </span>
            )}
            <span className="text-[11px] text-slate-300 ml-auto font-mono">
              {absoluteTime((data.origin as any).timestamp, hi)}
            </span>
          </div>

          <p className="text-sm text-slate-100 leading-relaxed line-clamp-4">
            {(data.origin as LivePost).text}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-[11px]">
            <div>
              <div className="text-slate-400">{hi ? 'क्षेत्र' : 'Region'}</div>
              <div className="font-bold">{(data.origin as LivePost).region || '—'}</div>
            </div>
            <div>
              <div className="text-slate-400">{hi ? 'भाषा' : 'Language'}</div>
              <div className="font-bold">{(data.origin as LivePost).language || '—'}</div>
            </div>
            <div>
              <div className="text-slate-400">{hi ? 'लेखक (hash)' : 'Author (hashed)'}</div>
              <div className="font-bold font-mono truncate">{(data.origin as LivePost).author_hashed || '—'}</div>
            </div>
            <div>
              <div className="text-slate-400">{hi ? 'स्कोर' : 'Score'}</div>
              <div className="font-bold">{Number((data.origin as LivePost).sentiment_score ?? 0).toFixed(2)}</div>
            </div>
          </div>
        </section>
      ) : (
        !prov.loading && (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
            <AlertTriangle className="w-7 h-7 text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">
              {hi ? 'इस विषय के लिए कोई कैप्चर रिकॉर्ड नहीं मिला' : 'No captured records for this narrative yet'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
              {hi
                ? 'समय विंडो बढ़ाएँ, या सिग्नल पेज के "स्रोत व कनेक्टर्स" टैब में देखें — कनेक्टर दर-सीमित या असंरचित हो सकता है।'
                : 'Widen the look-back window, or check the Sources & connectors tab — a connector may be rate-limited or unconfigured.'}
            </p>
          </div>
        )
      )}

      {/* ── Statistics ── */}
      {stats && (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: hi ? 'कुल पोस्ट' : 'Total posts', value: stats.total_posts, icon: <Database className="w-4 h-4" /> },
            { label: hi ? 'प्लेटफ़ॉर्म' : 'Platforms touched', value: stats.platforms_touched, icon: <Network className="w-4 h-4" /> },
            { label: hi ? 'विशिष्ट लेखक' : 'Distinct authors', value: stats.distinct_authors, icon: <Bot className="w-4 h-4" /> },
            { label: hi ? 'निकट-डुप्लिकेट' : 'Near-duplicates', value: stats.near_duplicate_posts, icon: <GitBranch className="w-4 h-4" /> },
            { label: hi ? 'बॉट फ़्लैग' : 'Bot-flagged', value: stats.bot_flagged_posts, icon: <Bot className="w-4 h-4" />, warn: true },
          ].map((kpi, i) => (
            <div key={i} className={`rounded-xl border p-3 ${kpi.warn && Number(kpi.value) > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">{kpi.icon}<span className="text-[10px] font-bold uppercase tracking-wider">{kpi.label}</span></div>
              <div className="text-xl font-extrabold text-slate-900">{kpi.value}</div>
            </div>
          ))}
          <div className="rounded-xl border bg-white border-slate-200 p-3 col-span-2 sm:col-span-3 lg:col-span-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Timer className="w-3.5 h-3.5" />
                {hi ? 'औसत पहचान विलंबता' : 'Avg detection lag'}:{' '}
                <strong className="text-slate-900 font-mono">{formatLag(stats.avg_detection_lag_seconds, hi)}</strong>
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <Share2 className="w-3.5 h-3.5" />
                {hi ? 'फैलाव खिड़की' : 'Spread window'}:{' '}
                <strong className="text-slate-900 font-mono">{formatLag(stats.spread_window_seconds, hi)}</strong>
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                {hi ? 'पहला देखा' : 'first seen'}: <strong className="text-slate-900">{absoluteTime(stats.first_seen, hi)}</strong>
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                {hi ? 'अंतिम देखा' : 'last seen'}: <strong className="text-slate-900">{absoluteTime(stats.last_seen, hi)}</strong>
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── Arrival timeline ── */}
      {arrival.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-1">
            <GitBranch className="w-4 h-4 text-slate-500" />
            {hi ? 'प्लेटफ़ॉर्म पर आगमन का क्रम' : 'Cross-platform arrival order'}
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            {hi
              ? 'यह क्रम डेटाबेस की पंक्तियों से सीधे बना है — प्रत्येक पंक्ति असली कैप्चर है।'
              : 'Ordered directly from stored rows: each step is the earliest captured instance of this narrative on that platform.'}
          </p>

          <div className="relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-200" />
            <ol className="space-y-4">
              {arrival.map((step: ProvenanceArrivalStep) => (
                <li key={`${step.platform}-${step.post_key}`} className="relative pl-10">
                  <span
                    className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold border-2 ${
                      step.is_origin_platform
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    {step.step}
                  </span>

                  <div className={`rounded-lg border p-3 ${step.is_origin_platform ? 'border-orange-200 bg-orange-50/50' : 'border-slate-200 bg-slate-50/60'}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <PlatformBadge platform={(step.platform as Platform) || 'twitter'} size="sm" />
                      <SentimentBadge sentiment={step.sentiment} lang={language} />
                      {step.is_suspected_bot && <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5">bot</span>}
                      <span className="text-[10px] text-slate-400 font-mono ml-auto">{absoluteTime(step.observed_at, hi)}</span>
                    </div>

                    <p className="text-xs text-slate-700 mt-2 line-clamp-2">{step.text}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] text-slate-500">
                      {!step.is_origin_platform && (
                        <span className="flex items-center gap-1 font-semibold text-orange-700">
                          <ArrowRight className="w-3 h-3" />
                          {hi ? 'उत्पत्ति से + ' : '+ from origin: '}
                          {formatLag(step.lag_from_origin_seconds, hi)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {hi ? 'पकड़े जाने में' : 'captured in'} {formatLag(step.detection_lag_seconds, hi)}
                      </span>
                      {step.region && <span>📍 {step.region}</span>}
                      {step.language && <span>🗣 {step.language}</span>}
                      <span>❤ {Number(step.engagement) || 0}</span>
                      <span className="font-mono">{step.post_key}</span>
                      {!embedded && (
                      <button
                        onClick={() => onNavigatePage?.('live-feed', { topic: data?.topic || undefined })}
                        className="ml-auto underline text-slate-600 hover:text-slate-900 font-semibold"
                      >
                        {hi ? 'फ़ीड में खोलें' : 'open in feed'}
                      </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {totalNodes > 0 && (
            <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
              {hi
                ? `इन ${arrival.length} प्लेटफ़ॉर्मों पर कुल ${totalNodes} सहभागिता इकाइयाँ दर्ज हुईं।`
                : `${totalNodes} cumulative engagement units recorded across these ${arrival.length} platform entry points.`}
            </p>
          )}
        </section>
      )}

      {/* ── Forwarding chains ── */}
      {(data?.forwarding_chains?.length ?? 0) > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-3">
            <GitBranch className="w-4 h-4 text-slate-500" />
            {hi ? 'एक-जैसी सामग्री की श्रृंखला (near-duplicate chains)' : 'Near-duplicate forwarding chains'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="py-2 pr-3">{hi ? 'कैनोनिकल' : 'Canonical id'}</th>
                  <th className="py-2 pr-3">{hi ? 'हॉप' : 'Hops'}</th>
                  <th className="py-2 pr-3">{hi ? 'प्लेटफ़ॉर्म' : 'Platforms'}</th>
                  <th className="py-2 pr-3">{hi ? 'अंतराल' : 'Span'}</th>
                </tr>
              </thead>
              <tbody>
                {data!.forwarding_chains!.map((chain) => (
                  <tr key={chain.canonical_post_id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-mono text-slate-600 truncate max-w-[180px]">{chain.canonical_post_id}</td>
                    <td className="py-2 pr-3 font-bold text-slate-900">{chain.hop_count}</td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-1">
                        {(chain.platforms || []).map((p) => (
                          <PlatformBadge key={p} platform={(p as Platform) || 'twitter'} size="sm" showName={false} />
                        ))}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-slate-500">
                      {formatLag(
                        Math.round((new Date(chain.last_seen).getTime() - new Date(chain.first_seen).getTime()) / 1000),
                        hi
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Graph cascade ── */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Network className="w-4 h-4 text-slate-500" />
            {hi ? 'नियो4ज प्रसार अनुरोध (Neo4j cascade)' : 'Neo4j graph cascade trace'}
          </h2>
          <div className="flex items-center gap-2">
            <LiveBadge isLive={cascade.isLive} loading={cascade.loading} lastUpdated={cascade.lastUpdated} onRefresh={cascade.refresh} />
            <button
              onClick={() => onNavigatePage?.('network', { topic: data?.topic || undefined })}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-700"
            >
              {hi ? 'पूरा नेटवर्क' : 'Open full graph'}
            </button>
          </div>
        </div>

        {(cascade.data?.cascade?.length ?? 0) > 0 ? (
          <ol className="space-y-1.5">
            {cascade.data!.cascade.slice(0, 12).map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                <PlatformBadge platform={(c.platform as Platform) || 'twitter'} size="sm" showName={false} />
                <span className="font-mono text-slate-600 truncate max-w-[160px]">{c.post_id || '—'}</span>
                <span className="text-slate-400">{c.edge_type || c.event || ''}</span>
                <span className="ml-auto text-slate-400 font-mono">{absoluteTime(c.timestamp, hi)}</span>
                {c.author_hashed && <span className="text-[10px] font-mono text-slate-400">{String(c.author_hashed).slice(0, 10)}</span>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
            {cascade.data?.message ||
              (hi
                ? 'ग्राफ़ में इस विषय के लिए अभी कोई edge नहीं है — ingestion worker चलने पर बनते हैं।'
                : 'No graph edges captured for this topic yet. Edges accumulate as the ingestion worker writes (:User)-[:POSTED]->(:Post) and FORWARDED_FROM links.')}
          </p>
        )}
      </section>

      <div className="flex items-center gap-2 text-[10px] text-slate-400">
        <RefreshCw className="w-3 h-3" />
        {hi
          ? 'यह पैनल चार अलग endpoints से असली डेटा खींचता है: /posts/provenance, /system/pipeline, /network/cascade, /posts/facets।'
          : 'This panel pulls from four live endpoints: /posts/provenance, /system/pipeline, /network/cascade and /posts/facets.'}
      </div>
    </div>
  );
};

export default ProvenanceView;
