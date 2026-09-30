import React, { useCallback } from 'react';
import { ConnectorStatus, Language, Mode, Platform } from '../types';
import { translations } from '../translations';
import { PlatformBadge } from './PlatformBadge';
import { LiveBadge } from './LiveBadge';
import { useApi } from '../services/useApi';
import { fetchConnectors, fetchPipelineTelemetry } from '../services/api';
import {
  Radio, RefreshCw, Database, Share2, Gauge, ServerCog, KeyRound,
  CheckCircle2, AlertTriangle, Clock, Layers,
} from 'lucide-react';

interface DataConnectorsViewProps {
  language: Language;
  mode: Mode;
  /**
   * Embedded inside the Live Data & Signals page — the surrounding page already
   * prints the title, so the standalone banner is skipped.
   */
  embedded?: boolean;
}

/**
 * Status strings are written by the collectors themselves ("Active (gramjs)",
 * "Rate limited: 429", "Standby (no credentials)" …), so colour by meaning
 * instead of matching a fixed enum.
 */
function toneFor(status: string, configured: boolean) {
  const s = String(status || '').toUpperCase();
  if (/ERROR|FAIL|UNAUTH|REGISTERED|401|403/.test(s)) {
    return { chip: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', Icon: AlertTriangle };
  }
  if (/RATE|LIMIT|429|THROTTLE|QUOTA/.test(s)) {
    return { chip: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500', Icon: Gauge };
  }
  if (/STANDBY|UNCONFIG|INACTIVE|IDLE|NO CREDENTIAL|NOT CONFIG/.test(s) || !configured) {
    return { chip: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400', Icon: KeyRound };
  }
  return { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500 animate-pulse', Icon: CheckCircle2 };
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'never';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * Architecture of the ingestion layer, kept next to the live connector status so
 * an analyst can see both what is running right now and what it would take to
 * switch the remaining platforms on.
 */
const BLUEPRINT: {
  platform: Platform;
  headline: string;
  headlineHi: string;
  detail: string;
  detailHi: string;
  cost: string;
  tier: 'live' | 'quota' | 'limited' | 'none';
}[] = [
  {
    platform: 'telegram',
    headline: 'Strongest free live source',
    headlineHi: 'सबसे मजबूत निःशुल्क लाइव स्रोत',
    detail:
      'MTProto client (GramJS / Telethon) reading public broadcast channels only. Forward cascades arrive with sub-45s latency and carry real forward counts.',
    detailHi:
      'MTProto क्लाइंट (GramJS/Telethon) केवल सार्वजनिक ब्रॉडकास्ट चैनल पढ़ता है। फ़ॉरवर्ड कैस्केड 45 सेकंड में भीतर आते हैं, वास्तविक फ़ॉरवर्ड गिनती के साथ।',
    cost: '₹0 · open MTProto API, no application fee',
    tier: 'live',
  },
  {
    platform: 'youtube',
    headline: 'Comment threads carry the real anxiety signal',
    headlineHi: 'कमेंट थ्रेड में वास्तविक चिंता का संकेत',
    detail:
      'YouTube Data API v3 commentThreads.list on monitored news and education channels. bounded by the 10,000 unit daily quota, which the panel reports live.',
    detailHi:
      'YouTube Data API v3 commentThreads.list — चयनित समाचार/शिक्षा चैनल। 10,000 यूनिट प्रतिदिन कोटा, पैनल में लाइव दिखाया जाता है।',
    cost: '₹0 · GCP free daily quota',
    tier: 'quota',
  },
  {
    platform: 'reddit',
    headline: 'Text-heavy, first place debunking appears',
    headlineHi: 'पाठ-प्रधान, डिबंकिंग सबसे पहले यहाँ',
    detail:
      'OAuth developer app over r/india, r/JEENEETards, r/IndianStudents megathreads (60 requests/min). Currently blocked by the Responsible Builder policy until app review clears.',
    detailHi:
      'r/india, r/JEENEETards, r/IndianStudents मेगाथ्रेड OAuth एप से (60 अनुरोध/मिनट)। Responsible Builder नीति के कारण समीक्षा तक अवरुद्ध।',
    cost: '₹0 · free developer app',
    tier: 'limited',
  },
  {
    platform: 'facebook',
    headline: 'Public pages only, no profiles or groups',
    headlineHi: 'केवल सार्वजनिक पेज, प्रोफ़ाइल/ग्रुप नहीं',
    detail:
      'Meta Graph API against verified news portals, state discom notices and district collectorate pages. Requires a page token per monitored page.',
    detailHi:
      'Meta Graph API — सत्यापित समाचार पोर्टल, राज्य डिस्कॉम नोटिस एवं जिला अधिकारी पृष्ठ। प्रत्येक पृष्ठ हेतु पेज टोकन आवश्यक।',
    cost: '₹0 · public page token',
    tier: 'limited',
  },
  {
    platform: 'instagram',
    headline: 'Reel captions on public hashtag buckets',
    headlineHi: 'सार्वजनिक हैशटैग पर रील कैप्शन',
    detail:
      'Instagram Graph API media endpoints for public hashtag mentions, giving the visual-first narratives that spread among student audiences.',
    detailHi:
      'Instagram Graph API मीडिया एंडपॉइंट — सार्वजनिक हैशटैग मेंशन, जिनसे छात्र जनसंपर्क में दृश्य-प्रधान कथाएँ फैलती हैं।',
    cost: '₹0 · Meta Business app token',
    tier: 'limited',
  },
  {
    platform: 'x',
    headline: 'No free ingestion tier',
    headlineHi: 'कोई निःशुल्क टियर उपलब्ध नहीं',
    detail:
      'X retired all free read access. A narrow single-hashtag filtered stream is the only affordable option; until it is funded the platform stays on the archived corpus rather than being simulated.',
    detailHi:
      'X ने सभी निःशुल्क रीड एक्सेस बंद किया है। एक हैशटैग-सीमित फ़िल्टर्ड स्ट्रीम ही मात्र सुलभ विकल्प है; वित्तपोषण तक यह प्लेटफ़ॉर्म संग्रहीत कॉर्पस पर रहेगा, अनुकरण नहीं।',
    cost: '₹0 archived · ~$100/mo for a live filtered stream',
    tier: 'none',
  },
];

const TIER_LABEL: Record<string, { en: string; hi: string; cls: string }> = {
  live: { en: 'Live now', hi: 'अभी लाइव', cls: 'bg-emerald-100 text-emerald-800' },
  quota: { en: 'Live · quota bound', hi: 'लाइव · कोटा सीमित', cls: 'bg-blue-100 text-blue-800' },
  limited: { en: 'Free · needs credentials', hi: 'निःशुल्क · क्रेडेंशियल आवश्यक', cls: 'bg-slate-100 text-slate-800' },
  none: { en: 'Paid tier only', hi: 'केवल सशुल्क टियर', cls: 'bg-amber-100 text-amber-900' },
};

export const DataConnectorsView: React.FC<DataConnectorsViewProps> = ({
  language,
  embedded = false,
}) => {
  const t = translations[language];
  const hi = language === 'hi';

  const connectorsFetcher = useCallback(() => fetchConnectors(), []);
  const pipelineFetcher = useCallback(() => fetchPipelineTelemetry(), []);

  const connectorsState = useApi(connectorsFetcher, { refreshInterval: 15000, keepPrevious: true });
  const pipelineState = useApi(pipelineFetcher, { refreshInterval: 30000, keepPrevious: true });

  const connectors: ConnectorStatus[] = connectorsState.data?.connectors ?? [];
  const db = (pipelineState.data?.database ?? {}) as Record<string, any>;
  const graph = pipelineState.data?.graph ?? { nodes: 0, relationships: 0, users: 0, posts: 0 };
  const queue = (pipelineState.data?.queue ?? {}) as Record<string, any>;
  const ml = (pipelineState.data?.ml ?? (pipelineState.data as any)?.ml_service ?? {}) as Record<string, any>;

  return (
    <div className="space-y-5">
      {/* Standalone banner — skipped when embedded in the feed page */}
      {!embedded && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-white/10">
                <Radio className="w-4 h-4 text-amber-300" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
                {t.dashboard.dataSourcesTitle}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold font-serif">
              {hi ? 'इनजेक्शन स्रोत एवं पाइपलाइन स्थिति' : 'Ingestion Sources & Pipeline Status'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              {t.dashboard.dataSourcesSub}
            </p>
          </div>
          <LiveBadge
            isLive={connectorsState.isLive}
            loading={connectorsState.loading}
            lastUpdated={connectorsState.lastUpdated}
            onRefresh={connectorsState.refresh}
          />
        </div>
      )}

      {/* ── LIVE CONNECTOR STATUS — straight out of connector_status ───────── */}
      <section className="premium-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2 text-slate-900">
            <ServerCog className="w-4 h-4 text-emerald-600" />
            <span>{hi ? 'कनेक्टर स्थिति (लाइव)' : 'Connector Status (live from the worker)'}</span>
          </h3>
          <LiveBadge
            isLive={connectorsState.isLive}
            loading={connectorsState.loading}
            lastUpdated={connectorsState.lastUpdated}
            onRefresh={connectorsState.refresh}
          />
        </div>

        {connectors.length === 0 ? (
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${connectorsState.loading ? 'animate-spin' : ''}`} />
            {connectorsState.loading
              ? (hi ? 'स्थिति लोड हो रही है…' : 'Loading connector status…')
              : (hi ? 'चयनित कनेक्टर से कोई पंक्ति दर्ज नहीं — ingestion worker चालू करें।' : 'No connector has written a status row yet — start the ingestion worker.')}
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
                  <th className="py-2 px-1 font-bold">{hi ? 'प्लेटफ़ॉर्म' : 'Platform'}</th>
                  <th className="py-2 px-1 font-bold">{hi ? 'स्थिति' : 'Reported status'}</th>
                  <th className="py-2 px-1 font-bold">{hi ? 'अंतिम पूछ' : 'Last poll'}</th>
                  <th className="py-2 px-1 font-bold">{hi ? 'इस बार प्राप्त' : 'Items this poll'}</th>
                  <th className="py-2 px-1 font-bold">{hi ? 'कोटा शेष' : 'Quota left'}</th>
                </tr>
              </thead>
              <tbody>
                {connectors.map((c) => {
                  const tone = toneFor(c.status, c.configured);
                  const quota =
                    c.rate_limit_total && c.rate_limit_remaining != null
                      ? `${Math.max(0, c.rate_limit_total - c.rate_limit_remaining)}/${c.rate_limit_total}`
                      : null;
                  return (
                    <tr key={c.platform} className="border-b border-slate-100 align-top">
                      <td className="py-2.5 px-1">
                        <PlatformBadge platform={(c.platform as Platform) || 'twitter'} size="sm" showName />
                      </td>
                      <td className="py-2.5 px-1">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${tone.chip}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                          {c.status}
                        </span>
                        {c.error_message && (
                          <div className="mt-1 text-[10px] text-rose-600 leading-snug max-w-md line-clamp-2">
                            {c.error_message}
                          </div>
                        )}
                        {!c.error_message && c.message && (
                          <div className="mt-1 text-[10px] text-slate-500 leading-snug max-w-md line-clamp-2">{c.message}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-1 font-mono text-slate-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {relativeTime(c.last_fetch)}
                        </span>
                      </td>
                      <td className="py-2.5 px-1 font-mono text-slate-700">
                        {c.items_collected != null ? Number(c.items_collected).toLocaleString('en-IN') : '—'}
                      </td>
                      <td className="py-2.5 px-1 font-mono text-slate-700">
                        {quota ? (
                          <span className="inline-flex items-center gap-1">
                            <Gauge className="w-3 h-3 text-slate-400" />
                            {quota}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
          {hi
            ? 'ये पंक्तियाँ स्वयं कनेक्टर द्वारा हर पूल के बाद PostgreSQL में लिखी जाती हैं; UI में कहीं भी हस्तचालित रूप से नहीं जोड़ी गईं।'
            : 'Each row is written by the connector itself after every poll cycle — nothing on this table is hand-entered by the interface.'}
        </p>
      </section>

      {/* ── STORAGE & PROCESSING TELEMETRY ───────────────────────────────── */}
      <section className="premium-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2 text-slate-900">
            <Database className="w-4 h-4 text-sky-600" />
            <span>{hi ? 'भंडारण एवं प्रसंस्करण' : 'Storage & Processing'}</span>
          </h3>
          <LiveBadge
            isLive={pipelineState.isLive}
            loading={pipelineState.loading}
            lastUpdated={pipelineState.lastUpdated}
            onRefresh={pipelineState.refresh}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: hi ? 'संग्रहित पंक्तियाँ' : 'Rows stored', value: db.total_rows ?? db.total_posts ?? 0, icon: <Database className="w-3.5 h-3.5" /> },
            { label: hi ? 'अंतिम घंटा' : 'Last hour', value: db.recent_posts ?? db.posts_last_hour ?? 0, icon: <Clock className="w-3.5 h-3.5" /> },
            { label: hi ? 'ग्राफ नोड्स' : 'Graph nodes', value: graph.nodes, icon: <Share2 className="w-3.5 h-3.5" /> },
            { label: hi ? 'संबंध' : 'Relationships', value: graph.relationships, icon: <Layers className="w-3.5 h-3.5" /> },
            { label: hi ? 'क्यू में' : 'Queued', value: queue.waiting ?? 0, icon: <ServerCog className="w-3.5 h-3.5" /> },
            { label: hi ? 'क्यू से निपटे' : 'Processed', value: queue.completed ?? 0, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
          ].map((cell, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-slate-400">{cell.icon}</div>
              <div className="text-sm font-extrabold text-slate-900 mt-1 font-mono">
                {Number(cell.value || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[9px] uppercase tracking-wide text-slate-400 mt-0.5">{cell.label}</div>
            </div>
          ))}
        </div>

        {(ml.models || ml.status) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="font-bold uppercase tracking-wide text-slate-400">
              {hi ? 'मॉडल' : 'ML models'}:
            </span>
            {Object.entries((ml.models ?? {}) as Record<string, string>).map(([k, v]) => (
              <span key={k} className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 font-mono">
                {k}: {v}
              </span>
            ))}
            {!Object.keys((ml.models ?? {}) as Record<string, string>).length && (
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                {String(ml.status ?? 'unknown')}
              </span>
            )}
          </div>
        )}
      </section>

      {/* ── ARCHITECTURE BLUEPRINT ───────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800">
          <h2 className="text-base sm:text-lg font-extrabold font-serif text-amber-400 mb-1">
            {hi ? 'आर्किटेक्चर ब्लूप्रिंट: मल्टी-प्लेटफ़ॉर्म डेटा संग्रह' : 'Architecture Blueprint: How the platform layer collects data'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            {hi
              ? 'भारतीय सार्वजनिक चर्चा को निःशुल्क एवं लगभग शून्य-लागत डेवलपर पाइपलाइनों से संग्रहीत करने की पूरी नीति।'
              : 'The full strategy for collecting public Indian discourse using free and near-zero-cost developer pipelines.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BLUEPRINT.map((b) => {
            const tier = TIER_LABEL[b.tier];
            const live = connectors.find((c) => c.platform === b.platform || (b.platform === 'x' && c.platform === 'twitter'));
            return (
              <div key={b.platform} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <PlatformBadge platform={b.platform} size="sm" />
                      {b.platform === 'x' ? 'X (Twitter)' : b.platform[0].toUpperCase() + b.platform.slice(1)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tier.cls}`}>
                      {hi ? tier.hi : tier.en}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1">{hi ? b.headlineHi : b.headline}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{hi ? b.detailHi : b.detail}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-500">{b.cost}</span>
                  {live && (
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${toneFor(live.status, live.configured).chip}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${toneFor(live.status, live.configured).dot}`} />
                      {live.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default DataConnectorsView;
