import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollText, Activity, Database, Server, BrainCircuit, Layers, Circle,
  Search, RefreshCw, ShieldCheck, HardDrive, Users, GitCommitVertical, Radio,
  AlertTriangle, Clock,
} from 'lucide-react';
import { AuditLogEntry, Language as AppLanguage, NavigateFn } from '../types';
import { fetchAuditLog, fetchPipelineTelemetry } from '../services/api';
import { useApi } from '../services/useApi';
import { LiveBadge } from './LiveBadge';

interface AuditTrailViewProps {
  language: AppLanguage;
  onNavigatePage?: NavigateFn;
  // Rendered inside a dashboard card: the host supplies the heading, so the
  // component skips its own full-page header.
  embedded?: boolean;
}

const COMPONENT_META: Record<string, { label: string; labelHi: string; icon: React.ReactNode }> = {
  postgres: { label: 'TimescaleDB / Postgres', labelHi: 'टाइमस्केल डीबी', icon: <Database className="w-4 h-4" /> },
  neo4j: { label: 'Neo4j Influence Graph', labelHi: 'नियो4ज ग्राफ', icon: <GitCommitVertical className="w-4 h-4" /> },
  redis: { label: 'Redis (BullMQ broker)', labelHi: 'रिडिस ब्रोकर', icon: <HardDrive className="w-4 h-4" /> },
  ml_service: { label: 'ML Inference Service', labelHi: 'एमएल सेवा', icon: <BrainCircuit className="w-4 h-4" /> },
  queue: { label: 'Ingestion Queue', labelHi: 'इंजेक्शन क्यू', icon: <Layers className="w-4 h-4" /> },
};

function stateClasses(state: string): { dot: string; box: string } {
  if (state === 'ok') return { dot: 'bg-emerald-500', box: 'bg-emerald-50 border-emerald-200 text-emerald-800' };
  if (state === 'degraded') return { dot: 'bg-amber-500', box: 'bg-amber-50 border-amber-200 text-amber-800' };
  return { dot: 'bg-rose-500', box: 'bg-rose-50 border-rose-200 text-rose-800' };
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const AuditTrailView: React.FC<AuditTrailViewProps> = ({ language, onNavigatePage, embedded = false }) => {
  const hi = language === 'hi';
  const [analystFilter, setAnalystFilter] = useState('');
  const [limit, setLimit] = useState(50);

  const auditFetcher = useCallback(() => fetchAuditLog({ limit, user: analystFilter || undefined }), [limit, analystFilter]);
  const audit = useApi<AuditLogEntry[] | null>(
    () => auditFetcher().then((r) => ({ ...r, data: (r.data.logs ?? null) as AuditLogEntry[] | null })),
    { refreshInterval: 15000, deps: [limit, analystFilter], keepPrevious: true }
  );

  const tele = useApi(() => fetchPipelineTelemetry(), { refreshInterval: 15000, keepPrevious: true });
  const t = tele.data;

  const logs = useMemo(() => {
    const rows = audit.data ?? [];
    const term = analystFilter.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (l) => String(l.user_id || '').toLowerCase().includes(term) || String(l.endpoint || '').toLowerCase().includes(term)
    );
  }, [audit.data, analystFilter]);

  const endpointTally = useMemo(() => {
    const acc: Record<string, number> = {};
    logs.forEach((l) => {
      const base = String(l.endpoint || '').split('?')[0];
      acc[base] = (acc[base] || 0) + 1;
    });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [logs]);

  const db = t?.database || {};
  const q = t?.queue || {};

  return (
    <div className="space-y-5">
      {!embedded && (
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-orange-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {hi ? 'सिस्टम हेल्थ व ऑडिट ट्रैक' : 'System Health & Analyst Audit Trail'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            {hi
              ? 'प्रत्येक सेवा की वास्तविक स्थिति, और हर एनालिस्ट अनुरोध का अभिवेदन-योग्य लॉग।'
              : 'Live status of every backing service, plus the tamper-evident log of which analyst queried which endpoint and with what filters.'}
          </p>
        </div>
        <LiveBadge isLive={tele.isLive} loading={tele.loading} lastUpdated={tele.lastUpdated} onRefresh={tele.refresh} />
      </div>
      )}

      {/* Overall banner */}
      {t && (
        <div
          className={`rounded-xl border p-4 flex flex-wrap items-center gap-3 ${
            t.overall === 'healthy'
              ? 'bg-emerald-50 border-emerald-200'
              : t.overall === 'critical'
              ? 'bg-rose-50 border-rose-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <Activity
            className={`w-5 h-5 ${t.overall === 'healthy' ? 'text-emerald-600' : t.overall === 'critical' ? 'text-rose-600' : 'text-amber-600'}`}
          />
          <div className="flex-1 min-w-[200px]">
            <div className="text-sm font-extrabold text-slate-900">
              {hi ? 'समग्र पाइपलाइन स्थिति' : 'Overall pipeline state'}:{' '}
              <span className="uppercase">{t.overall}</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {hi
                ? 'यह पैनल हर 15 सेकंड में असली स्वस्थ-जाँच endpoints को पूछता है।'
                : 'This panel polls the real /health, /system/pipeline and Neo4j/Redis probes every 15 seconds.'}
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            <Clock className="w-3 h-3 inline mr-1" />
            {t.generated_at ? new Date(t.generated_at).toLocaleTimeString('en-IN') : '—'}
          </span>
        </div>
      )}

      {/* Component grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(t?.component_health || {}).map(([key, info]) => {
          const meta = COMPONENT_META[key] || { label: key, labelHi: key, icon: <Server className="w-4 h-4" /> };
          const cls = stateClasses(info.state);
          return (
            <div key={key} className={`rounded-xl border p-3.5 ${cls.box}`}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="opacity-70">{meta.icon}</span>
                  <span className="text-xs font-extrabold">{hi ? meta.labelHi : meta.label}</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase">
                  <span className={`w-2 h-2 rounded-full ${cls.dot} ${info.state === 'ok' ? 'animate-pulse' : ''}`} />
                  {info.state}
                </span>
              </div>
              <p className="text-[11px] leading-snug opacity-90 break-words">{info.detail}</p>
            </div>
          );
        })}
        {!t && (
          <div className="sm:col-span-2 lg:col-span-3 text-xs text-slate-400 border border-dashed border-slate-300 rounded-xl p-6 text-center">
            {hi ? 'टेलीमेट्री लोड हो रही है…' : 'Loading telemetry — is the orchestrator running on :8000?'}
          </div>
        )}
      </div>

      {/* Raw counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: hi ? 'संग्रहीत पोस्ट' : 'Rows in Timescale', value: db.total_posts ?? 0, icon: <Database className="w-4 h-4" /> },
          { label: hi ? 'लाइव कैप्चर' : 'Live captures', value: db.live_posts ?? 0, icon: <Radio className="w-4 h-4" /> },
          { label: hi ? '15 मिनट में कैप्चर' : 'Captured · 15 min', value: db.posts_15m ?? 0, icon: <Radio className="w-4 h-4" /> },
          { label: hi ? 'विषय' : 'Topics', value: db.topics ?? 0, icon: <Layers className="w-4 h-4" /> },
          { label: hi ? 'ग्राफ नोड' : 'Graph nodes', value: t?.graph?.nodes ?? 0, icon: <GitCommitVertical className="w-4 h-4" /> },
          { label: hi ? 'ग्राफ edge' : 'Graph edges', value: t?.graph?.relationships ?? 0, icon: <GitCommitVertical className="w-4 h-4" /> },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              {kpi.icon}
              <span className="text-[9px] font-bold uppercase tracking-wider">{kpi.label}</span>
            </div>
            <div className="text-lg font-extrabold text-slate-900">{Number(kpi.value).toLocaleString('en-IN')}</div>
          </div>
        ))}
      </div>

      {/* Queue + throughput */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 mb-3">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            {hi ? 'BullMQ इनजेक्शन क्यू' : 'BullMQ ingestion queue'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {[
              { label: 'waiting', value: q.waiting ?? 0, tone: 'bg-sky-50 text-sky-800 border-sky-200' },
              { label: 'active', value: q.active ?? 0, tone: 'bg-amber-50 text-amber-800 border-amber-200' },
              { label: 'completed', value: q.completed ?? 0, tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
              { label: 'failed', value: q.failed ?? 0, tone: 'bg-rose-50 text-rose-800 border-rose-200' },
            ].map((cell) => (
              <div key={cell.label} className={`rounded-lg border p-2.5 ${cell.tone}`}>
                <div className="text-lg font-extrabold">{Number(cell.value).toLocaleString('en-IN')}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{cell.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>{hi ? 'पिछले 15 मिनट में कैप्चर' : 'Captured in last 15 min'}</span>
              <strong className="text-slate-900 font-mono">{db.posts_15m ?? 0}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>{hi ? 'अंतिम कैप्चर' : 'Last pipeline write'}</span>
              <strong className="text-slate-900 font-mono">{timeAgo(db.latest_capture)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>{hi ? 'Redis स्मृति' : 'Redis memory used'}</span>
              <strong className="text-slate-900 font-mono">{t?.redis?.used_memory_human || '—'}</strong>
            </div>
          </div>
        </div>

        {/* Endpoint tally */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 mb-3">
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            {hi ? 'अधिकतम उपयोग endpoints' : 'Most-queried endpoints (this session)'}
          </h3>
          {endpointTally.length === 0 ? (
            <p className="text-xs text-slate-400">
              {hi ? 'अभी कोई लॉग नहीं — कोई पृष्ठ खोलें।' : 'No entries yet — navigate around and the hook records each query.'}
            </p>
          ) : (
            <div className="space-y-2">
              {endpointTally.map(([ep, count], i) => {
                const max = endpointTally[0][1] || 1;
                return (
                  <div key={ep}>
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="font-mono text-slate-600 truncate">{ep}</span>
                      <span className="text-slate-500 font-bold">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.round((count / max) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Audit table */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            {hi ? 'एनालिस्ट अभिगम लॉग' : 'Analyst access log'}
            <span className="text-[10px] font-normal text-slate-400">
              ({logs.length} {hi ? 'प्रविष्टियाँ' : 'entries'})
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={analystFilter}
                onChange={(e) => setAnalystFilter(e.target.value)}
                placeholder={hi ? 'एनालिस्ट आईडी / endpoint' : 'analyst id or endpoint'}
                className="pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5"
            >
              {[25, 50, 100, 200].map((n) => (
                <option key={n} value={n}>{hi ? `अंतिम ${n}` : `last ${n}`}</option>
              ))}
            </select>
            <button
              onClick={audit.refresh}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              title={hi ? 'ताज़ा करें' : 'Refresh'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${audit.loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <th className="py-2 pr-3">{hi ? 'समय' : 'When'}</th>
                <th className="py-2 pr-3">{hi ? 'एनालिस्ट' : 'Analyst'}</th>
                <th className="py-2 pr-3">Endpoint</th>
                <th className="py-2 pr-3">{hi ? 'प्रश्न पैरामीटर' : 'Query params'}</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                    {hi ? 'कोई अभिगम लॉग नहीं मिला।' : 'No access entries recorded yet.'}
                  </td>
                </tr>
              )}
              {logs.map((l, i) => {
                const params =
                  typeof l.query_params === 'string'
                    ? l.query_params
                    : JSON.stringify(l.query_params ?? {}).slice(0, 120);
                const ts = (l as any).timestamp || l.accessed_at;
                return (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/70">
                    <td className="py-2 pr-3 text-slate-500 whitespace-nowrap">{timeAgo(ts)}</td>
                    <td className="py-2 pr-3">
                      <span className="flex items-center gap-1 font-mono text-slate-700">
                        <Users className="w-3 h-3 text-slate-400" />
                        {l.user_id}
                      </span>
                    </td>
                    <td className="py-2 pr-3 font-mono text-slate-700">{String(l.endpoint || '').split('?')[0]}</td>
                    <td className="py-2 pr-3 font-mono text-[10px] text-slate-500 max-w-[280px] truncate">{params}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => {
                          const topic = (l.query_params as any)?.topic;
                          const q = (l.query_params as any)?.q;
                          const isFeedQuery = String(l.endpoint || '').startsWith('/posts/live');
                          // Everything lands on the single Live Data & Signals page:
                          // provenance-style calls open its per-post trace panel.
                          onNavigatePage?.('live-feed', {
                            topic: typeof topic === 'string' ? topic : undefined,
                            q: typeof q === 'string' ? q : undefined,
                            trace: isFeedQuery ? undefined : true,
                          });
                        }}
                        className="text-[10px] font-bold text-orange-700 hover:underline"
                      >
                        {hi ? 'पुनः चलें' : 're-run'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3" />
          {hi
            ? 'यह लॉग NTRO अभिवेदन आवश्यकता के अनुसार है — यह दर्शाता है कि किस विश्लेषक ने कौन-सा डेटा कब देखा।'
            : 'Written by the Fastify onRequest hook on every intelligence endpoint — required for chain-of-custody attribution of who looked at what.'}
        </p>
      </div>

      {/* Connector roll-up */}
      {(t?.connectors?.length ?? 0) > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 mb-3">
            <Server className="w-3.5 h-3.5 text-slate-500" />
            {hi ? 'कनेक्टर अंतिम स्थिति' : 'Connector last-run roll-up'}
            <button
              onClick={() => onNavigatePage?.('live-feed', { tab: 'sources' })}
              className="ml-auto text-[11px] font-bold text-orange-700 hover:underline"
            >
              {hi ? 'स्रोत टैब' : 'Sources tab →'}
            </button>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {t!.connectors.map((c) => {
              const live =
                c.configured && !/STANDBY|UNCONFIG|INACTIVE|IDLE|NO CREDENTIAL|DEMO/i.test(c.status);
              return (
                <div key={c.platform} className={`rounded-lg border p-2.5 ${live ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 capitalize flex items-center gap-1.5">
                      <Circle className={`w-2 h-2 fill-current ${live ? 'text-emerald-500' : 'text-slate-400'}`} />
                      {c.platform}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">{timeAgo(c.last_fetch)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{c.status}</div>
                  {c.error_message && (
                    <div className="text-[10px] text-rose-600 mt-0.5 line-clamp-1" title={c.error_message}>
                      {c.error_message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrailView;
