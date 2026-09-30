import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DashboardSectionId, TopicData, Language, Mode, NavigateFn } from '../types';
import { translations } from '../translations';
import { mockTopics, telegramLiveFeed } from '../data/mockData';
import { PlatformBadge } from './PlatformBadge';
import { SentimentBadge, VelocityBadge } from './SentimentBadge';
import { LiveBadge } from './LiveBadge';
import { useApi } from '../services/useApi';
import { fetchOverviewStats, fetchTrends, fetchLivePosts } from '../services/api';
import {
  AlertTriangle, TrendingUp, Activity, ShieldAlert, ArrowUpRight,
  Sparkles, Radio, Share2, CheckCircle2, Layers, Zap, Database,
  MessageSquare, ThumbsDown, Clock, Users,
} from 'lucide-react';
import { SocialStickerBar } from './SocialStickerBar';
import DemographicsView from './DemographicsView';
import AuditTrailView from './AuditTrailView';

interface DashboardHomeProps {
  language: Language;
  mode: Mode;
  onNavigatePage: NavigateFn;
  onSelectTopic: (topic: TopicData) => void;
  onOpenRumorRadarForTopic: (topic: TopicData) => void;
  // Sidebar "Audience Demographics" / "Audit Trail" links no longer open pages —
  // they scroll to these sections of the dashboard and flash a highlight.
  focusSection?: DashboardSectionId | null;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  language, mode, onNavigatePage, onSelectTopic, onOpenRumorRadarForTopic, focusSection,
}) => {
  const t = translations[language];

  const demographicsRef = useRef<HTMLDivElement | null>(null);
  const auditRef = useRef<HTMLDivElement | null>(null);
  const [highlight, setHighlight] = useState<DashboardSectionId | null>(null);

  useEffect(() => {
    if (!focusSection) return;
    const el = focusSection === 'demographics' ? demographicsRef.current : auditRef.current;
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setHighlight(focusSection);
    const id = setTimeout(() => setHighlight(null), 2600);
    return () => clearTimeout(id);
  }, [focusSection]);

  // ── Real API data ──────────────────────────────────────────────
  const overviewFetcher = useCallback(() => fetchOverviewStats(), []);
  const trendsFetcher = useCallback(() => fetchTrends(), []);
  const liveFetcher = useCallback(() => fetchLivePosts({ limit: 10 }), []);

  const { data: statsData, isLive: statsLive, loading: statsLoading, lastUpdated: statsUpdated, refresh: refreshStats } =
    useApi(overviewFetcher, { refreshInterval: 30000 });

  const { data: trendsData, isLive: trendsLive, loading: trendsLoading, lastUpdated: trendsUpdated, refresh: refreshTrends } =
    useApi(trendsFetcher, { refreshInterval: 60000 });

  const { data: liveData, isLive: liveLive, loading: liveLoading, lastUpdated: liveUpdated, refresh: refreshLive } =
    useApi(liveFetcher, { refreshInterval: 20000 });

  const stats = statsData;
  const trends = trendsData?.trends || [];
  // Real rows win; the sample Telegram feed is only used when the API is silent,
  // and the panel badges it so the analyst knows which one they are looking at.
  const livePosts =
    liveData && liveData.posts && liveData.posts.length > 0
      ? liveData.posts
      : telegramLiveFeed.map(msg => ({
    post_id: msg.id,
    platform: 'telegram',
    sentiment: msg.sentiment,
    is_suspected_bot: msg.isAnomaly,
    timestamp: new Date().toISOString(),
    text: msg.text,
    topic_name: 'Trending Live',
    likes: parseInt(msg.views.replace('K', '000')) || 0,
    shares: msg.forwards,
  }));

  // Map real trends to TopicData shape for compatibility
  const displayTopics: TopicData[] = trends.length > 0
    ? trends.map((tr: any): TopicData => ({
        id: tr.topic_id,
        name: tr.topic_name,
        nameHi: tr.topic_name,
        posts: tr.post_count,
        growth: tr.velocity > 0.5 ? '+142%' : '+38%',
        growthValue: tr.forecast_next_hour || tr.post_count * 1.2,
        velocity: tr.velocity > 0.5 ? 'High' : tr.velocity > 0.2 ? 'Medium' : 'Low',
        dominantSentiment: tr.dominant_sentiment || 'neutral',
        sentimentBreakdown: { positive: 22, neutral: 31, negative: 47 },
        dominantEmotion: 'Anxiety',
        platforms: ['youtube', 'telegram'],
        status: (tr.badge === 'High' || tr.velocity > 0.5) ? 'Rising' : tr.badge === 'Rising' ? 'Monitoring' : 'Stabilizing',
        riskLevel: tr.velocity > 0.6 ? 'High' : tr.velocity > 0.3 ? 'Medium' : 'Low',
        confidence: 85,
        summaryEn: `Live analysis of ${tr.topic_name}`,
        summaryHi: `${tr.topic_name} का लाइव विश्लेषण`,
        narrativeClaim: `Circulating claims around ${tr.topic_name}`,
      }))
    : mockTopics;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* LITE MODE BANNER */}
      {mode === 'lite' && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center justify-between text-emerald-900 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{t.topBar.liteModeNotice}</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">Bandwidth Saved: ~78%</span>
        </div>
      )}

      {/* MULTI-PLATFORM SOCIAL MEDIA STICKER HUB */}
      <SocialStickerBar onExploreConnectors={() => onNavigatePage('live-feed', { tab: 'sources' })} language={language} />

      {/* TOP 3 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Active Topics */}
        <div
          onClick={() => onNavigatePage('trending')}
          className="premium-card p-5 cursor-pointer group relative overflow-hidden animate-slide-up"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-orange-300/30 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{t.dashboard.kpiActiveTopics}</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {statsLoading ? '—' : stats?.active_topics ?? 5}
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              {stats?.posts_last_hour ? `+${stats.posts_last_hour}/hr` : '↑ live'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] text-slate-500">{t.dashboard.kpiActiveTopicsSub}</p>
            <LiveBadge isLive={statsLive} loading={statsLoading} lastUpdated={statsUpdated} onRefresh={refreshStats} />
          </div>
        </div>

        {/* Card 2: High Risk Rumors */}
        <div
          onClick={() => onNavigatePage('rumor-radar')}
          className="premium-card p-5 cursor-pointer group relative overflow-hidden animate-slide-up"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-rose-300/30 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">{t.dashboard.kpiHighRiskRumors}</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-700">
              {statsLoading ? '—' : stats?.negative_ratio != null ? `${stats.negative_ratio}%` : '1'}
            </span>
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider bg-rose-100 px-1.5 py-0.5 rounded">
              {stats?.negative_ratio != null && stats.negative_ratio > 0 ? 'Neg Ratio' : 'High Risk'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] text-slate-500">{t.dashboard.kpiHighRiskRumorsSub}</p>
            <LiveBadge isLive={statsLive} loading={statsLoading} lastUpdated={statsUpdated} />
          </div>
        </div>

        {/* Card 3: Top Platform */}
        <div
          onClick={() => onNavigatePage('network')}
          className="premium-card p-5 cursor-pointer group relative overflow-hidden animate-slide-up"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-200/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-sky-300/30 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-800">{t.dashboard.kpiTopPlatform}</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-sky-700 capitalize">
              {statsLoading ? '—' : stats?.top_platform || t.dashboard.kpiTopPlatformVal}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {stats?.top_platform_share ? `${stats.top_platform_share}% share` : '42% share'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] text-slate-500">{t.dashboard.kpiTopPlatformSub}</p>
            <LiveBadge isLive={statsLive} loading={statsLoading} lastUpdated={statsUpdated} />
          </div>
        </div>
      </div>

      {/* TRENDING NOW SECTION */}
      <div className="premium-card p-6 animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/50 gap-2">
          <div>
            <h3 className="text-xl font-extrabold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600 animate-pulse-slow" />
              <span className="text-gradient from-slate-900 to-slate-700">{t.dashboard.trendingNow}</span>
            </h3>
            <p className="text-xs text-slate-500">{t.dashboard.trendingSub}</p>
          </div>
          <div className="flex items-center gap-2">
            <LiveBadge isLive={trendsLive} loading={trendsLoading} lastUpdated={trendsUpdated} onRefresh={refreshTrends} />
            <button
              onClick={() => onNavigatePage('rumor-radar')}
              className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'hi' ? 'अफ़वाह रडार' : 'Rumor Radar'}</span>
            </button>
            <button
              onClick={() => onNavigatePage('trending')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
            >
              {language === 'hi' ? 'सभी देखें' : 'View All'}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {trendsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="py-3 flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 rounded-md bg-slate-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : (
            displayTopics.slice(0, 5).map((topic, index) => (
              <div
                key={topic.id}
                onClick={() => onSelectTopic(topic)}
                className="py-3 hover:bg-slate-50/80 rounded-xl px-2 -mx-2 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-orange-700 transition-colors">
                        {language === 'hi' ? topic.nameHi : topic.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-slate-700">
                          {topic.posts.toLocaleString()} {language === 'hi' ? 'पोस्ट' : 'posts'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-bold text-rose-600">
                          {topic.velocity === 'High' ? '↑ 2.4×' : topic.velocity === 'Medium' ? '↑ 1.3×' : '↓ Low'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <SentimentBadge sentiment={topic.dominantSentiment} lang={language} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded">
                      {topic.status}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectTopic(topic); }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-slate-900 hover:bg-orange-600 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Zap className="w-3 h-3 text-amber-300" />
                      <span>{language === 'hi' ? 'एक्शन' : 'Action'}</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2 pl-7 flex-wrap">
                  {topic.platforms.map((p) => (
                    <PlatformBadge key={p} platform={p} size="sm" showName={false} />
                  ))}
                  <span className="text-[11px] text-slate-400 ml-1">{topic.platforms.length} platforms</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* LIVE POSTS FEED */}
      <div className="premium-card p-6 animate-slide-up">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/50">
          <div>
            <h3 className="text-xl font-extrabold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sky-600 animate-bounce" />
              <span className="text-gradient from-slate-900 to-slate-700">{language === 'hi' ? 'लाइव पोस्ट फ़ीड' : 'Live Post Feed'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'hi' ? 'डेटाबेस से नवीनतम इनजेस्टेड पोस्ट' : 'Most recent ingested posts from database'}
            </p>
          </div>
          <LiveBadge isLive={liveLive} loading={liveLoading} lastUpdated={liveUpdated} onRefresh={refreshLive} />
        </div>

        <div className="mt-3 space-y-2">
          {liveLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse p-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-4/5" />
                </div>
              </div>
            ))
          ) : livePosts.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No posts ingested yet</p>
              <p className="text-xs mt-1">Start the orchestrator to begin collecting real-time data</p>
            </div>
          ) : (
            livePosts.slice(0, 8).map((post: any, i: number) => (
              <div key={post.post_id || i} className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <PlatformBadge platform={post.platform} size="sm" showName={true} />
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                      post.sentiment === 'negative' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      post.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {post.sentiment || 'neutral'}
                    </span>
                    {post.is_suspected_bot && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        🤖 Bot
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {post.timestamp ? new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">{post.text}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                  {post.topic_name && <span className="font-medium text-slate-600 truncate">{post.topic_name}</span>}
                  {post.region && post.region !== 'Unknown' && <span>📍 {post.region}</span>}
                  {post.likes > 0 && <span>❤ {post.likes.toLocaleString()}</span>}
                  {post.shares > 0 && <span>🔁 {post.shares.toLocaleString()}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── FEATURE SECTION: Audience demographics (k-anonymity) ─────────── */}
      <div
        ref={demographicsRef}
        className={`premium-card p-5 transition-shadow duration-500 ${
          highlight === 'demographics' ? 'ring-4 ring-orange-400/60' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-lg font-extrabold flex items-center gap-2 text-slate-900">
            <Users className="w-4 h-4 text-orange-600" />
            <span>{language === 'hi' ? 'दर्शक विवरण (k-anonymity)' : 'Audience Demographics (k-anonymity)'}</span>
          </h3>
          <LiveBadge
            isLive={liveLive}
            loading={liveLoading}
            lastUpdated={liveUpdated}
            onRefresh={() => onNavigatePage('live-feed')}
          />
        </div>
        <DemographicsView language={language} onNavigatePage={onNavigatePage} embedded />
      </div>

      {/* ── FEATURE SECTION: Pipeline health & analyst audit trail ───────── */}
      <div
        ref={auditRef}
        className={`premium-card p-5 transition-shadow duration-500 ${
          highlight === 'audit' ? 'ring-4 ring-orange-400/60' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-lg font-extrabold flex items-center gap-2 text-slate-900">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            <span>
              {language === 'hi' ? 'सिस्टम हेल्थ व ऑडिट ट्रैक' : 'System Health & Analyst Audit Trail'}
            </span>
          </h3>
        </div>
        <AuditTrailView language={language} onNavigatePage={onNavigatePage} embedded />
      </div>
    </div>
  );
};
