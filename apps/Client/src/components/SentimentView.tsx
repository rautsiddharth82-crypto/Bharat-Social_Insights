import React, { useState, useCallback } from 'react';
import { Language, Mode, Platform, TopicData } from '../types';
import { translations } from '../translations';
import { mockTopics, sentimentTimeline24h } from '../data/mockData';
import { SentimentLineChart } from './SentimentLineChart';
import { PlatformBadge } from './PlatformBadge';
import {
  Smile,
  Frown,
  Meh,
  Filter,
  Flame,
  Globe2,
  Share2,
  PieChart,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { LiveBadge } from './LiveBadge';
import { useApi } from '../services/useApi';
import {
  fetchSentimentTimeline,
  fetchEmotionMetrics,
  fetchPlatformComparison,
  fetchLanguageBreakdown,
} from '../services/api';

interface SentimentViewProps {
  language: Language;
  mode: Mode;
}

export const SentimentView: React.FC<SentimentViewProps> = ({ language, mode }) => {
  const t = translations[language];

  // Filters
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterLang, setFilterLang] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<string>('24h');

  // ── Real API data ──────────────────────────────────────────────
  const timelineFetcher = useCallback(() => fetchSentimentTimeline(filterTime), [filterTime]);
  const { data: timelineData, isLive: timelineLive, loading: timelineLoading, lastUpdated: timelineUpdated, refresh: refreshTimeline } =
    useApi(timelineFetcher, { refreshInterval: 60000 });
  const liveTimeline = timelineData?.timeline || [];

  const { data: emotionData, isLive: emotionLive, lastUpdated: emotionUpdated, refresh: refreshEmotion } =
    useApi(fetchEmotionMetrics, { refreshInterval: 90000 });
  const emotionMetrics = (emotionData?.metrics || []).map(m => ({
    ...m,
    multiplierText: (m as any).multiplierText,
    multiplierTextHi: (m as any).multiplierTextHi,
  }));

  const { data: platformCompData, isLive: platformCompLive, lastUpdated: platformCompUpdated, refresh: refreshPlatformComp } =
    useApi(fetchPlatformComparison, { refreshInterval: 90000 });
  const platformComparison = (platformCompData?.comparison || []).length > 0
    ? (platformCompData!.comparison || []).map(p => ({
        platform: (p.platform === 'twitter' ? 'x' : p.platform) as Platform,
        neg: p.neg,
        neu: p.neu,
        pos: p.pos,
        vol: `${p.vol}`
      }))
    : [
        { platform: 'telegram' as Platform, neg: 54, neu: 28, pos: 18, vol: '12.4k' },
        { platform: 'youtube' as Platform, neg: 48, neu: 32, pos: 20, vol: '9.8k' },
        { platform: 'reddit' as Platform, neg: 51, neu: 34, pos: 15, vol: '4.2k' },
        { platform: 'facebook' as Platform, neg: 38, neu: 36, pos: 26, vol: '5.1k' },
        { platform: 'instagram' as Platform, neg: 41, neu: 37, pos: 22, vol: '6.5k' },
        { platform: 'x' as Platform, neg: 49, neu: 27, pos: 24, vol: '8.3k' },
      ];

  const { data: languageData, isLive: languageLive, lastUpdated: languageUpdated, refresh: refreshLanguage } =
    useApi(fetchLanguageBreakdown, { refreshInterval: 90000 });
  const languageComparison = (languageData?.breakdown || []).length > 0
    ? (languageData!.breakdown || []).map(l => ({
        name: l.name,
        nameHi: l.nameHi,
        neg: l.neg,
        neu: l.neu,
        pos: l.pos,
        share: l.share || `${l.percentage}%`
      }))
    : [
        { name: 'Hindi', nameHi: 'हिन्दी', neg: 52, neu: 29, pos: 19, share: '45%' },
        { name: 'English', nameHi: 'अंग्रेज़ी', neg: 42, neu: 34, pos: 24, share: '35%' },
        { name: 'Hinglish', nameHi: 'हिंग्लिश', neg: 49, neu: 31, pos: 20, share: '20%' },
      ];

  // Interactive dynamic calculation based on active filter
  const getDynamicSentiment = () => {
    if (filterTopic === 'neet-exam-2026') {
      return { positive: 14, neutral: 28, negative: 58 };
    }
    if (filterTopic === 'subsidy-update') {
      return { positive: 56, neutral: 32, negative: 12 };
    }
    if (filterTopic === 'rajasthan-power-outage') {
      return { positive: 9, neutral: 31, negative: 60 };
    }
    // Overall benchmark requested in prompt: Positive 22%, Neutral 31%, Negative 47%
    return { positive: 22, neutral: 31, negative: 47 };
  };

  const sentimentStats = getDynamicSentiment();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
              <Activity className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-700 font-mono">
              Affective Intelligence
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-serif">
            {t.sentimentPage.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            {t.sentimentPage.subtitle}
          </p>
        </div>

        {/* Hinglish Callout Badge */}
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{t.sentimentPage.anxietyCallout}</span>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>{language === 'hi' ? 'विश्लेषण फ़िल्टर' : 'Analytics Query Filters'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Platform Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              {language === 'hi' ? 'प्लेटफ़ॉर्म' : 'Platform'}
            </label>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">{language === 'hi' ? 'सभी प्लेटफ़ॉर्म' : 'All Platforms'}</option>
              <option value="telegram">Telegram</option>
              <option value="youtube">YouTube</option>
              <option value="reddit">Reddit</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="x">X (Archived corpus)</option>
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              {language === 'hi' ? 'विषय (Topic)' : 'Topic Narrative'}
            </label>
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">{language === 'hi' ? 'समग्र विषय (All Topics)' : 'Aggregate (All Topics)'}</option>
              {mockTopics.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {language === 'hi' ? tp.nameHi : tp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              {language === 'hi' ? 'भाषा' : 'Language'}
            </label>
            <select
              value={filterLang}
              onChange={(e) => setFilterLang(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">{language === 'hi' ? 'सभी भाषाएँ' : 'All Languages'}</option>
              <option value="hi">Hindi (45%)</option>
              <option value="en">English (35%)</option>
              <option value="hinglish">Hinglish (20%)</option>
            </select>
          </div>

          {/* Time Period Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              {language === 'hi' ? 'समय अवधि' : 'Time Horizon'}
            </label>
            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="1h">{language === 'hi' ? '1 घंटा' : 'Last 1 Hour'}</option>
              <option value="6h">{language === 'hi' ? '6 घंटे' : 'Last 6 Hours'}</option>
              <option value="24h">{language === 'hi' ? '24 घंटे' : 'Last 24 Hours'}</option>
              <option value="7d">{language === 'hi' ? '7 दिन' : 'Last 7 Days'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* TOP ROW: DONUT CHART + EMOTION BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sentiment Distribution Donut */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-serif">
              {t.sentimentPage.distributionTitle}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'कुल सोशल पोस्ट्स का भावना वर्गीकरण'
                : 'Proportional classification across verified feeds'}
            </p>

            {/* Donut graphic (SVG) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-4">
              <div className="relative w-40 h-40 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  {/* Negative (47%) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="transparent"
                    stroke="#f43f5e"
                    strokeWidth="4.5"
                    strokeDasharray={`${sentimentStats.negative} ${100 - sentimentStats.negative}`}
                    strokeDashoffset="0"
                  />
                  {/* Neutral (31%) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="transparent"
                    stroke="#94a3b8"
                    strokeWidth="4.5"
                    strokeDasharray={`${sentimentStats.neutral} ${100 - sentimentStats.neutral}`}
                    strokeDashoffset={`-${sentimentStats.negative}`}
                  />
                  {/* Positive (22%) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="4.5"
                    strokeDasharray={`${sentimentStats.positive} ${100 - sentimentStats.positive}`}
                    strokeDashoffset={`-${sentimentStats.negative + sentimentStats.neutral}`}
                  />
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xl font-extrabold text-slate-900 font-mono">
                    {sentimentStats.negative}%
                  </span>
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tight">
                    Negative Dominant
                  </span>
                </div>
              </div>

              {/* Legend stats */}
              <div className="space-y-2.5 w-full sm:w-auto">
                <div className="flex items-center justify-between gap-6 p-2 rounded-lg bg-rose-50 border border-rose-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold text-slate-800">
                      {language === 'hi' ? 'नकारात्मक (Negative)' : 'Negative'}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-rose-700 font-mono">
                    {sentimentStats.negative}%
                  </span>
                </div>

                <div className="flex items-center justify-between gap-6 p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-400" />
                    <span className="text-xs font-bold text-slate-800">
                      {language === 'hi' ? 'तटस्थ (Neutral)' : 'Neutral'}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-slate-700 font-mono">
                    {sentimentStats.neutral}%
                  </span>
                </div>

                <div className="flex items-center justify-between gap-6 p-2 rounded-lg bg-emerald-50 border border-emerald-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-800">
                      {language === 'hi' ? 'सकारात्मक (Positive)' : 'Positive'}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-700 font-mono">
                    {sentimentStats.positive}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            * Benchmark across 41,020 conversational units in last 24h
          </div>
        </div>

        {/* Emotion Breakdown */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-serif">
                  {t.sentimentPage.emotionsTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'hi'
                    ? 'छह प्रमुख मनोदशाओं का प्रतिशत विश्लेषण'
                    : 'Granular breakdown of cognitive affective vectors'}
                </p>
              </div>

              <span className="text-[11px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-bold">
                Anxiety: Critical Peak
              </span>
            </div>

            <div className="space-y-3 mt-4">
              {emotionMetrics.map((emotion) => (
                <div key={emotion.name}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: emotion.color }}
                      />
                      <span className="font-bold text-slate-800">
                        {language === 'hi' ? emotion.nameHi : emotion.name}
                      </span>
                      {emotion.multiplierText && (
                        <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                          {language === 'hi' ? emotion.multiplierTextHi : emotion.multiplierText}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-extrabold text-slate-900">
                      {emotion.percentage}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${emotion.percentage}%`,
                        backgroundColor: emotion.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
            <span>
              {emotionLive ? (
                <span className="text-emerald-600 font-semibold">✓ Live keyword sentiment ({emotionData?.total || 0} posts analyzed)</span>
              ) : (
                <span>Lexical dictionary: IndicVADER + Hindi Sentiment Lexicon v3.1</span>
              )}
            </span>
            {emotionUpdated && <span className="font-mono">{language === 'hi' ? 'अपडेटेड:' : 'Updated:'} {emotionUpdated.toLocaleTimeString()}</span>}
            <span className="text-rose-600 font-bold">Confidence: 89.4%</span>
          </div>
        </div>
      </div>

      {/* TIMELINE SECTION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2 mb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-serif">
              {t.dashboard.timelineHeading}
            </h3>
            <p className="text-xs text-slate-500">
              {t.dashboard.timelineSub}
            </p>
          </div>

          <div className="text-xs text-slate-600 font-medium">
            Timeline window: <strong className="text-slate-900">{filterTime}</strong>
          </div>
        </div>

        <SentimentLineChart
          data={liveTimeline.length > 0 ? liveTimeline : sentimentTimeline24h}
          language={language}
          mode={mode}
        />
        <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">
            {timelineLive ? <span className="text-emerald-600 font-semibold">✓ Live API data ({liveTimeline.length} points)</span> : `Stored benchmark series (${sentimentTimeline24h.length} pts)`}
          </span>
          {timelineUpdated && (
            <span className="text-slate-500 font-mono">
              {language === 'hi' ? 'अपडेटेड:' : 'Updated:'} {timelineUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* PLATFORM & LANGUAGE COMPARISON MATRICES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Platform Sentiment Comparison */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-base font-extrabold text-slate-900 font-serif mb-1">
            {t.sentimentPage.platformCompTitle}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {language === 'hi'
              ? 'प्रत्येक सोशल मीडिया मंच पर नकारात्मकता एवं मात्रा का अनुपात'
              : 'Cross-channel comparison of affective polarities'}
          </p>

          <div className="space-y-3">
            {platformComparison.map((item) => (
              <div key={item.platform} className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50">
                <div className="flex items-center justify-between mb-1.5">
                  <PlatformBadge platform={item.platform} size="sm" />
                  <span className="text-[11px] font-mono text-slate-500">
                    Vol: {item.vol}
                  </span>
                </div>

                {/* 3-segment bar */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${item.neg}%` }}
                    className="bg-rose-500"
                    title={`Negative ${item.neg}%`}
                  />
                  <div
                    style={{ width: `${item.neu}%` }}
                    className="bg-slate-400"
                    title={`Neutral ${item.neu}%`}
                  />
                  <div
                    style={{ width: `${item.pos}%` }}
                    className="bg-emerald-500"
                    title={`Positive ${item.pos}%`}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span className="text-rose-600 font-bold">{item.neg}% Neg</span>
                  <span>{item.neu}% Neu</span>
                  <span className="text-emerald-600 font-bold">{item.pos}% Pos</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Language Comparison */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-serif mb-1">
              {t.sentimentPage.langCompTitle}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'hi'
                ? 'हिन्दी, अंग्रेजी व हिंग्लिश में संवेदी अंतर'
                : 'Socio-linguistic affective variance in Indic dialogues'}
            </p>

            <div className="space-y-4">
              {languageComparison.map((l) => (
                <div key={l.name} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900">
                        {language === 'hi' ? l.nameHi : l.name}
                      </span>
                      <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                        {l.share} share
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-600">
                      {l.neg}% Negative
                    </span>
                  </div>

                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                    <div style={{ width: `${l.neg}%` }} className="bg-rose-500" />
                    <div style={{ width: `${l.neu}%` }} className="bg-slate-400" />
                    <div style={{ width: `${l.pos}%` }} className="bg-emerald-500" />
                  </div>

                  <p className="text-[11px] text-slate-600 mt-2">
                    {l.name === 'Hindi' &&
                      (language === 'hi'
                        ? 'टेलीग्राम व यूट्यूब पर चिंता एवं सवाल सबसे अधिक दर्ज।'
                        : 'Highest anxiety and rumor forward cascades on Telegram and regional YouTube.')}
                    {l.name === 'English' &&
                      (language === 'hi'
                        ? 'रेडिट व एक्स पर तथ्य-सत्यापन और विश्लेषण पर जोर।'
                        : 'Verification threads on Reddit and formal inquiries on X.')}
                    {l.name === 'Hinglish' &&
                      (language === 'hi'
                        ? 'मीम पेजों, इंस्टाग्राम रील्स और व्यंग्य में सर्वाधिक प्रयुक्त।'
                        : 'Dominant in student reels, satire, and informal status updates.')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mt-4">
            <strong>Indic NLP Benchmark:</strong> Hindi lexical anxiety markers increased 2.4x more sharply than English formal queries.
          </div>
        </div>
      </div>
    </div>
  );
};
