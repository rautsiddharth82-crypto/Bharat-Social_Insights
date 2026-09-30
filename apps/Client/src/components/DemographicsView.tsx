import React, { useCallback, useMemo, useState } from 'react';
import {
  Users, ShieldCheck, MapPin, Briefcase, Languages, Lock, Search, EyeOff,
  Database, ArrowRight, Activity,
} from 'lucide-react';
import { DemographicsLiveResponse, Language as AppLanguage, NavigateFn } from '../types';
import { fetchDemographics, fetchDemographicsSummary, fetchPipelineTelemetry } from '../services/api';
import { useApi } from '../services/useApi';
import { LiveBadge } from './LiveBadge';

interface DemographicsViewProps {
  language: AppLanguage;
  onNavigatePage?: NavigateFn;
  // Rendered as a dashboard section: the host card supplies the heading, so the
  // component skips its own full-page header.
  embedded?: boolean;
}

interface Bucket {
  name: string;
  value: number;
  suppressed: boolean;
  note?: string;
  share_pct?: number;
}

const BAR_COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#eab308', '#ef4444', '#0ea5e9', '#94a3b8'];

function DistributionCard({
  title,
  titleHi,
  icon,
  buckets,
  kThreshold,
  hi,
  onSelectRegion,
  emptyLabel,
}: {
  title: string;
  titleHi: string;
  icon: React.ReactNode;
  buckets: Bucket[];
  kThreshold: number;
  hi: boolean;
  onSelectRegion?: (name: string) => void;
  emptyLabel: string;
}) {
  const visible = buckets.filter((b) => !b.suppressed);
  const suppressed = buckets.filter((b) => b.suppressed);
  const max = Math.max(1, ...visible.map((b) => b.value));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
          {icon}
          {hi ? titleHi : title}
        </h3>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
          k = {kThreshold}
        </span>
      </div>

      {buckets.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {visible.map((b, i) => {
            const pct = Math.round((b.value / max) * 100);
            const share = b.share_pct ?? Math.round((b.value / Math.max(1, visible.reduce((s, x) => s + x.value, 0))) * 100);
            return (
              <button
                key={b.name}
                onClick={() => onSelectRegion?.(b.name)}
                disabled={!onSelectRegion}
                className={`w-full text-left group ${onSelectRegion ? 'cursor-pointer' : 'cursor-default'}`}
                title={onSelectRegion ? (hi ? 'इस क्षेत्र की पोस्ट खोजें' : 'Search posts for this segment') : undefined}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-700 truncate flex items-center gap-1">
                    {b.name || '—'}
                    {onSelectRegion && (
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                    )}
                  </span>
                  <span className="text-slate-500 font-mono shrink-0 ml-2">
                    {b.value.toLocaleString('en-IN')} · {share}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                  />
                </div>
              </button>
            );
          })}

          {suppressed.length > 0 && (
            <div className="pt-2 mt-2 border-t border-dashed border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <EyeOff className="w-3 h-3" />
                {hi ? `${suppressed.length} खंड दबाए गए (k-anonymity)` : `${suppressed.length} segments suppressed (k-anonymity)`}
              </div>
              {suppressed.slice(0, 6).map((b) => (
                <div key={b.name} className="flex items-center justify-between text-[10px] bg-slate-50 border border-slate-200 rounded px-2 py-1">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                    <span className="font-mono">n &lt; {kThreshold}</span>
                  </span>
                  <span className="text-slate-400 italic">{b.note || (hi ? 'नाम प्रकट नहीं' : 'identity withheld')}</span>
                </div>
              ))}
              <p className="text-[10px] text-slate-400 leading-snug pt-1">
                {hi
                  ? '5 से कम व्यक्तियों वाले समूहों का नाम कानूनी गोपनीयता नियम के अनुसार प्रकट नहीं किया जाता।'
                  : 'Buckets with fewer than k contributing records are not disclosed — a small cohort name is re-identifying even without a handle.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const DemographicsView: React.FC<DemographicsViewProps> = ({ language, onNavigatePage, embedded = false }) => {
  const hi = language === 'hi';

  // Two independent authorities: the full-history view (k=5) and the rolling
  // 24-hour operational view (k=100). Showing both makes the privacy trade-off concrete.
  const [scope, setScope] = useState<'all' | '24h'>('all');

  const allFetcher = useCallback(() => fetchDemographics(), []);
  const dayFetcher = useCallback(() => fetchDemographicsSummary(), []);

  const allState = useApi<DemographicsLiveResponse>(allFetcher, { deps: [], keepPrevious: true });
  const dayState = useApi<DemographicsLiveResponse>(dayFetcher, { deps: [], keepPrevious: true });
  const teleState = useApi(() => fetchPipelineTelemetry(), { refreshInterval: 30000, keepPrevious: true });

  const active = scope === 'all' ? allState : dayState;
  const d = active.data;

  const totals = useMemo(() => {
    const sum = (arr?: Bucket[]) => (arr || []).filter((b) => !b.suppressed).reduce((s, b) => s + (b.value || 0), 0);
    return {
      region: sum(d?.region_distribution),
      profession: sum(d?.profession_distribution),
      language: sum(d?.language_distribution),
    };
  }, [d]);

  const suppressedCount = useMemo(() => {
    return [d?.region_distribution, d?.profession_distribution, d?.language_distribution]
      .flat()
      .filter((b: any) => b?.suppressed).length;
  }, [d]);

  const tele = teleState.data;
  const dbTotal = tele?.database?.total_posts ?? 0;
  const sourceCount = tele?.database?.platforms ?? 0;

  const goSearch = (segment: string, field: 'region' | 'language') => {
    if (field === 'region') {
      onNavigatePage?.('live-feed', { region: segment });
    } else {
      onNavigatePage?.('live-feed', { language: segment });
    }
  };

  return (
    <div className="space-y-5">
      {!embedded && (
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {hi ? 'दर्शक विवरण (k-anonymity सहित)' : 'Audience Demographics & K-Anonymity'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            {hi
              ? 'क्षेत्र, व्यवसाय और भाषा — gazetteer inference से प्राप्त, कानूनी k-anonymity threshold के साथ।'
              : 'Region, profession and language inferred by the gazetteer stage of the ingestion pipeline, then passed through a legal k-anonymity threshold before display.'}
          </p>
        </div>
        <LiveBadge isLive={active.isLive} loading={active.loading} lastUpdated={active.lastUpdated} onRefresh={active.refresh} />
      </div>
      )}

      {/* Scope switch + privacy explainer */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{hi ? 'दायरा' : 'Scope'}</span>
          <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
            {[
              { key: 'all', labelEn: 'All captured history', labelHi: 'संपूर्ण इतिहास', k: 5 },
              { key: '24h', labelEn: 'Rolling 24 hours', labelHi: 'पिछले 24 घंटे', k: 100 },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setScope(opt.key as any)}
                className={`px-3 py-1.5 text-[11px] font-bold transition-colors ${
                  scope === opt.key ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {hi ? opt.labelHi : opt.labelEn}
                <span className={`ml-1.5 font-mono ${scope === opt.key ? 'text-amber-300' : 'text-slate-400'}`}>k={opt.k}</span>
              </button>
            ))}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1 text-slate-500">
              <Database className="w-3.5 h-3.5" />
              {dbTotal.toLocaleString('en-IN')} {hi ? 'कुल पंक्तियाँ' : 'rows total'}
            </span>
            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
              <Database className="w-3 h-3" />
              {sourceCount} {hi ? 'स्रोत लिख रहे हैं' : 'sources writing'}
            </span>
            {suppressedCount > 0 && (
              <span className="flex items-center gap-1 text-slate-600 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                <Lock className="w-3 h-3" />
                {suppressedCount} {hi ? 'दबाए खंड' : 'suppressed'}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-600 bg-emerald-50/70 border border-emerald-200 rounded-lg p-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-emerald-800">{hi ? 'गोपनीयता डिज़ाइन' : 'Privacy-by-design'}</strong>
            <p className="mt-0.5 leading-relaxed">
              {hi
                ? 'लेखक की पहचान SHA-256 से 16 अक्षर के छद्मनाम में बदल दी जाती है; कच्चा बायो संग्रहीत नहीं होता। कोई भी खंड जिसमें k से कम योगदानकर्ता हैं, उसका नाम प्रकट नहीं किया जाता।'
                : 'Author identities are truncated SHA-256 pseudonyms (`author_hashed`); raw bios are never persisted. Any demographic bucket with fewer than k contributing records has its label withheld, because naming a cohort of two is re-identifying even without handles.'}
            </p>
          </div>
        </div>
      </div>

      {/* Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DistributionCard
          hi={hi}
          title="Geographic Distribution"
          titleHi="भौगोलिक वितरण"
          icon={<MapPin className="w-3.5 h-3.5 text-orange-600" />}
          buckets={(d?.region_distribution as Bucket[]) || []}
          kThreshold={d?.k_threshold ?? (scope === 'all' ? 5 : 100)}
          onSelectRegion={(name) => goSearch(name, 'region')}
          emptyLabel={hi ? 'क्षेत्र पहचाना नहीं गया' : 'No regions classified yet'}
        />
        <DistributionCard
          hi={hi}
          title="Profession Cohorts"
          titleHi="व्यवसाय वर्ग"
          icon={<Briefcase className="w-3.5 h-3.5 text-blue-600" />}
          buckets={(d?.profession_distribution as Bucket[]) || []}
          kThreshold={d?.k_threshold ?? (scope === 'all' ? 5 : 100)}
          emptyLabel={hi ? 'व्यवसाय अनुमानित नहीं' : 'No professions inferred yet'}
        />
        <DistributionCard
          hi={hi}
          title="Language Split"
          titleHi="भाषाई विभाजन"
          icon={<Languages className="w-3.5 h-3.5 text-emerald-600" />}
          buckets={(d?.language_distribution as Bucket[]) || []}
          kThreshold={1}
          onSelectRegion={(name) => goSearch(name, 'language')}
          emptyLabel={hi ? 'भाषा पहचानी नहीं गई' : 'No languages detected yet'}
        />
      </div>

      {/* Coverage table */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 mb-3">
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          {hi ? 'कवरेज सारांश' : 'Classification coverage'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {[
            { label: hi ? 'क्षेत्र सहित पोस्ट' : 'Posts with a region', value: totals.region, icon: <MapPin className="w-3 h-3" /> },
            { label: hi ? 'व्यवसाय सहित पोस्ट' : 'Posts with a profession', value: totals.profession, icon: <Briefcase className="w-3 h-3" /> },
            { label: hi ? 'भाषा सहित पोस्ट' : 'Posts with a language', value: totals.language, icon: <Languages className="w-3 h-3" /> },
          ].map((row, i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-3 bg-slate-50/70">
              <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                {row.icon} {row.label}
              </div>
              <div className="text-lg font-extrabold text-slate-900 mt-1">{row.value.toLocaleString('en-IN')}</div>
              <div className="h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${dbTotal > 0 ? Math.min(100, Math.round((row.value / dbTotal) * 100)) : 0}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {dbTotal > 0 ? Math.min(100, Math.round((row.value / dbTotal) * 100)) : 0}% {hi ? 'कवरेज' : 'of all captured rows'}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
          <Search className="w-3 h-3" />
          {hi
            ? 'किसी भी पट्टी पर क्लिक करके उस खंड की पोस्ट लाइव फ़ीड में खोलें।'
            : 'Click any bar to open that segment in Live Data & Signals — the region filter is pushed into /posts/live.'}
        </p>
      </div>
    </div>
  );
};

export default DemographicsView;
