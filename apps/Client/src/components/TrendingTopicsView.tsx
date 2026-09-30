import React, { useState, useMemo, useCallback } from 'react';
import { TopicData, Language, Mode, Platform } from '../types';
import { translations } from '../translations';
import { mockTopics } from '../data/mockData';
import { PlatformBadge } from './PlatformBadge';
import { SentimentBadge, VelocityBadge, RiskBadge } from './SentimentBadge';
import {
  TrendingUp,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ShieldAlert,
  Flame,
  Clock,
  Layers,
  Zap,
} from 'lucide-react';
import {
  InstagramIcon,
  FacebookIcon,
  TwitterIcon,
  TelegramIcon,
  YouTubeIcon,
  RedditIcon,
} from './SocialBrandIcons';
import { LiveBadge } from './LiveBadge';
import { useApi } from '../services/useApi';
import { fetchTrends } from '../services/api';

interface TrendingTopicsViewProps {
  language: Language;
  mode: Mode;
  onSelectTopic: (topic: TopicData) => void;
  onOpenRumorRadar: (topic: TopicData) => void;
}

export const TrendingTopicsView: React.FC<TrendingTopicsViewProps> = ({
  language,
  mode,
  onSelectTopic,
  onOpenRumorRadar,
}) => {
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'posts' | 'growth' | 'velocity'>('posts');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ── Real API data ──────────────────────────────────────────────
  const trendsFetcher = useCallback(() => fetchTrends(), []);
  const { data: trendsApiData, isLive: trendsLive, loading: trendsLoading, lastUpdated: trendsUpdated, refresh: refreshTrends } =
    useApi(trendsFetcher, { refreshInterval: 60000 });

  // Merge real trends with mockTopics shape
  const apiTopics: TopicData[] = (trendsApiData?.trends || []).map((tr: any): TopicData => ({
    id: tr.topic_id,
    name: tr.topic_name,
    nameHi: tr.topic_name,
    summaryEn: tr.topic_name,
    summaryHi: tr.topic_name,
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
    narrativeClaim: `Claims circulating around ${tr.topic_name}`,
  }));

  const sourceTopics = apiTopics.length > 0 ? apiTopics : mockTopics;

  // Filter & sort logic
  const filteredTopics = useMemo(() => {
    let list = [...sourceTopics];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (tp) =>
          tp.name.toLowerCase().includes(q) ||
          tp.nameHi.toLowerCase().includes(q) ||
          tp.summaryEn.toLowerCase().includes(q)
      );
    }

    if (selectedPlatform !== 'all') {
      list = list.filter((tp) => tp.platforms.includes(selectedPlatform as Platform));
    }

    if (selectedStatus !== 'all') {
      list = list.filter((tp) => tp.status === selectedStatus);
    }

    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === 'posts') {
        valA = a.posts;
        valB = b.posts;
      } else if (sortBy === 'growth') {
        valA = a.growthValue;
        valB = b.growthValue;
      } else if (sortBy === 'velocity') {
        const velMap = { High: 3, Medium: 2, Low: 1 };
        valA = velMap[a.velocity];
        valB = velMap[b.velocity];
      }
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return list;
  }, [searchQuery, selectedPlatform, selectedStatus, sortBy, sortOrder]);

  const toggleSort = (field: 'posts' | 'growth' | 'velocity') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-700 font-mono">
              Narrative Velocity Table
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-serif">
            {t.trendingPage.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            {t.trendingPage.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold font-mono">
            {filteredTopics.length} Active Records
          </span>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t.trendingPage.searchTopic}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Platform filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">{t.trendingPage.filterAll}</option>
            <option value="telegram">Telegram</option>
            <option value="youtube">YouTube</option>
            <option value="reddit">Reddit</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="x">X</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">{t.trendingPage.statusAll}</option>
            <option value="Rising">Rising</option>
            <option value="Monitoring">Monitoring</option>
            <option value="Stabilizing">Stabilizing</option>
          </select>
        </div>
      </div>

      {/* SOCIAL MEDIA QUICK PLATFORM STICKER PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
          Filter Platform:
        </span>

        <button
          onClick={() => setSelectedPlatform('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedPlatform === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>All Platforms</span>
        </button>

        <button
          onClick={() => setSelectedPlatform('telegram')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedPlatform === 'telegram'
              ? 'bg-[#229ED9] text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-300'
              : 'bg-white border border-sky-200 text-sky-800 hover:bg-sky-50'
          }`}
        >
          <TelegramIcon className="w-3.5 h-3.5" />
          <span>Telegram</span>
        </button>

        <button
          onClick={() => setSelectedPlatform('instagram')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedPlatform === 'instagram'
              ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white shadow-md shadow-pink-500/25 ring-2 ring-pink-300'
              : 'bg-white border border-pink-200 text-pink-800 hover:bg-pink-50'
          }`}
        >
          <InstagramIcon className="w-3.5 h-3.5" />
          <span>Instagram</span>
        </button>

        <button
          onClick={() => setSelectedPlatform('x')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedPlatform === 'x'
              ? 'bg-slate-950 text-white shadow-md shadow-slate-900/25 ring-2 ring-slate-400'
              : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100'
          }`}
        >
          <TwitterIcon className="w-3.5 h-3.5" />
          <span>Twitter / X</span>
        </button>

        <button
          onClick={() => setSelectedPlatform('youtube')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedPlatform === 'youtube'
              ? 'bg-[#FF0000] text-white shadow-md shadow-red-500/25 ring-2 ring-red-300'
              : 'bg-white border border-red-200 text-red-800 hover:bg-red-50'
          }`}
        >
          <YouTubeIcon className="w-3.5 h-3.5" />
          <span>YouTube</span>
        </button>

        <button
          onClick={() => setSelectedPlatform('facebook')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedPlatform === 'facebook'
              ? 'bg-[#1877F2] text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-300'
              : 'bg-white border border-blue-200 text-blue-800 hover:bg-blue-50'
          }`}
        >
          <FacebookIcon className="w-3.5 h-3.5" />
          <span>Facebook</span>
        </button>

        <button
          onClick={() => setSelectedPlatform('reddit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            selectedPlatform === 'reddit'
              ? 'bg-[#FF4500] text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-300'
              : 'bg-white border border-orange-200 text-orange-800 hover:bg-orange-50'
          }`}
        >
          <RedditIcon className="w-3.5 h-3.5" />
          <span>Reddit</span>
        </button>
      </div>

      {/* DETAILED TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4">{t.trendingPage.colTopic}</th>
                <th
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => toggleSort('posts')}
                >
                  <div className="flex items-center gap-1">
                    <span>{t.trendingPage.colPosts}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => toggleSort('growth')}
                >
                  <div className="flex items-center gap-1">
                    <span>{t.trendingPage.colGrowth}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => toggleSort('velocity')}
                >
                  <div className="flex items-center gap-1">
                    <span>{t.trendingPage.colVelocity}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">{t.trendingPage.colSentiment}</th>
                <th className="py-3.5 px-4">{t.trendingPage.colPlatforms}</th>
                <th className="py-3.5 px-4">{t.trendingPage.colStatus}</th>
                <th className="py-3.5 px-4 text-right">{t.trendingPage.actions}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredTopics.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No matching topics found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredTopics.map((topic) => (
                  <tr
                    key={topic.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => onSelectTopic(topic)}
                  >
                    {/* Topic Name & summary snippet */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-start gap-2">
                        {topic.riskLevel === 'High' && (
                          <span className="w-2 h-2 rounded-full bg-rose-600 mt-1.5 shrink-0 animate-ping" />
                        )}
                        <div>
                          <p className="group-hover:text-orange-600 transition-colors font-semibold">
                            {language === 'hi' ? topic.nameHi : topic.name}
                          </p>
                          <p className="text-[11px] font-normal text-slate-500 line-clamp-1 mt-0.5">
                            {language === 'hi' ? topic.summaryHi : topic.summaryEn}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Posts Volume */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {topic.posts.toLocaleString()}
                    </td>

                    {/* Growth */}
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 whitespace-nowrap">
                      {topic.growth}
                    </td>

                    {/* Velocity */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <VelocityBadge velocity={topic.velocity} lang={language} />
                    </td>

                    {/* Sentiment */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SentimentBadge sentiment={topic.dominantSentiment} lang={language} />
                    </td>

                    {/* Platforms */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {topic.platforms.map((p) => (
                          <PlatformBadge key={p} platform={p} size="sm" showName={false} />
                        ))}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          topic.status === 'Rising'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : topic.status === 'Monitoring'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {topic.status}
                      </span>
                    </td>

                    {/* Actions button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectTopic(topic)}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                          title={language === 'hi' ? 'एक्शन कार्ड खोलें' : 'Open Action Card'}
                        >
                          <Zap className="w-3 h-3 text-amber-300" />
                          <span>{language === 'hi' ? 'एक्शन कार्ड' : 'Action Card'}</span>
                        </button>
                        <button
                          onClick={() => onOpenRumorRadar(topic)}
                          className="p-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                          title="Run Rumor Radar"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
