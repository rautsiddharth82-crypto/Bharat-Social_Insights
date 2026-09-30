import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell, Languages as LangIcon, Zap, Check, Menu, X as CloseIcon,
  Flame, Radio, ExternalLink, Search, Loader2, ArrowRight, UserCog, ShieldAlert,
  TrendingUp, Inbox,
} from 'lucide-react';
import { Language, Mode, NavigateFn, NavigateOpts, Platform } from '../types';
import { translations } from '../translations';
import { fetchAlerts, fetchFeedFacets, fetchLivePosts, getAnalystId, setAnalystId } from '../services/api';
import { useApi } from '../services/useApi';
import { SocialTickerRibbon } from './SocialBrandIcons';
import { PlatformBadge } from './PlatformBadge';
import { LiveBadge } from './LiveBadge';

interface NavbarProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onSelectTopic: (topicId: string) => void;
  onNavigatePage: NavigateFn;
}

const SEVERITY_STYLE: Record<string, { icon: React.ReactNode; box: string }> = {
  High: { icon: <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />, box: 'hover:bg-rose-50/70 text-rose-700' },
  Medium: { icon: <Flame className="w-4 h-4 shrink-0 mt-0.5" />, box: 'hover:bg-amber-50/70 text-amber-700' },
  Low: { icon: <TrendingUp className="w-4 h-4 shrink-0 mt-0.5" />, box: 'hover:bg-emerald-50/70 text-emerald-700' },
};

function timeAgoShort(iso: string | undefined): string {
  if (!iso) return '';
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (Number.isNaN(s)) return '';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  setLanguage,
  mode,
  setMode,
  mobileMenuOpen,
  setMobileMenuOpen,
  onSelectTopic,
  onNavigatePage,
}) => {
  const t = translations[language];
  const hi = language === 'hi';

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [analystOpen, setAnalystOpen] = useState(false);
  const [analystId, setAnalystIdLocal] = useState(getAnalystId());
  const searchBoxRef = useRef<HTMLInputElement>(null);

  // Real alerts from /alerts — 6-hour topic aggregation done in TimescaleDB.
  const alertsState = useApi(() => fetchAlerts(), { refreshInterval: 30000, keepPrevious: true });
  const alerts = (alertsState.data?.alerts ?? []) as any[];
  const unread = alerts.filter((a) => !readIds.includes(a.id) && a.severity !== 'Low');

  // Live suggestions: keyword matches against actual stored posts + real topic facets.
  const suggestFetcher = useCallback(
    () =>
      debounced.trim().length >= 2
        ? fetchLivePosts({ q: debounced.trim(), limit: 8, sort: 'engagement' })
        : Promise.resolve({ data: { posts: [], total: 0, total_matching: 0, source: 'empty' as const }, isLive: false }),
    [debounced]
  );
  const suggest = useApi(suggestFetcher, { deps: [debounced], keepPrevious: true });

  const facetsState = useApi(() => fetchFeedFacets(), { refreshInterval: 120000 });
  const facets = facetsState.data;

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  // ⌘K / Ctrl-K focuses the global search, like a real analyst console.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchBoxRef.current?.focus(), 30);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setAnalystOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const topicMatches = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    if (!term) return [];
    return (facets?.topics || [])
      .filter((x) => (x.topic_name || x.topic_id || '').toLowerCase().includes(term))
      .slice(0, 4);
  }, [debounced, facets]);

  const postMatches = suggest.data?.posts ?? [];

  const runSearch = (opts: NavigateOpts) => {
    onNavigatePage('live-feed', opts);
    setSearchOpen(false);
    setQuery('');
    setMobileMenuOpen(false);
  };

  const commitAnalyst = () => {
    const id = (analystId || '').trim() || 'analyst_guest';
    setAnalystId(id);
    setAnalystIdLocal(id);
    setAnalystOpen(false);
    alertsState.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Main navigation row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile trigger + Logo + Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => onNavigatePage('dashboard')}
          >
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-amber-600 via-orange-500 to-emerald-700 p-0.5 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center text-white">
                <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>

            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 font-serif sm:text-xl">
                  {t.brand.name}
                </span>
                <span className="hidden lg:inline-block px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-[10px] font-bold tracking-wider uppercase border border-orange-200">
                  Gov / Enterprise
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 leading-none">{t.brand.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Centre: GLOBAL SEARCH */}
        <div className="flex-1 max-w-xl relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) runSearch({ q: query.trim() });
            }}
            placeholder={hi ? t.topBar.searchPlaceholder : 'Search posts, topics, regions, hashtags across every platform…'}
            className="w-full pl-9 pr-16 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:bg-white placeholder:text-slate-400"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 pointer-events-none">
            ⌘K
          </kbd>

          {searchOpen && (query.trim().length > 0) && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSearchOpen(false)} />
              <div className="absolute left-0 right-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden text-slate-800">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {hi ? 'लाइव परिणाम' : 'Live matches from TimescaleDB'}
                  </span>
                  <LiveBadge isLive={suggest.isLive} loading={suggest.loading} />
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {/* Topic quick-jumps */}
                  {topicMatches.length > 0 && (
                    <div className="border-b border-slate-100 py-1.5">
                      <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {hi ? 'विषय' : 'Topics'}
                      </div>
                      {topicMatches.map((tm) => (
                        <button
                          key={tm.topic_id}
                          onClick={() => runSearch({ topic: tm.topic_id })}
                          className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-orange-50/60 text-left"
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800 truncate flex-1">
                            {tm.topic_name || tm.topic_id}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{tm.count} posts</span>
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Matching captured posts */}
                  <div className="py-1.5">
                    <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {hi ? 'कैप्चर की गई पोस्ट' : 'Captured posts'}
                      {suggest.data?.total_matching ? ` · ${suggest.data.total_matching} matched` : ''}
                    </div>

                    {suggest.loading && postMatches.length === 0 && (
                      <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> {hi ? 'खोज रहा है…' : 'Querying the live feed…'}
                      </div>
                    )}

                    {!suggest.loading && postMatches.length === 0 && topicMatches.length === 0 && (
                      <div className="px-3 py-3 text-xs text-slate-400">
                        {hi ? 'कोई मेल नहीं मिला।' : 'No captured signal matches this term.'}
                      </div>
                    )}

                    {postMatches.map((p) => (
                      <button
                        key={`${p.post_key || p.post_id}-${p.timestamp}`}
                        onClick={() => runSearch({ q: query.trim() })}
                        className="w-full px-3 py-2 hover:bg-slate-50 text-left border-t border-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <PlatformBadge platform={(p.platform as Platform) || 'twitter'} size="sm" showName={false} />
                          <span className="text-[10px] font-mono text-slate-400 truncate">{p.post_key}</span>
                          <span className={`text-[10px] font-bold ml-auto ${
                            p.sentiment === 'negative' ? 'text-rose-600' : p.sentiment === 'positive' ? 'text-emerald-600' : 'text-slate-400'
                          }`}>
                            {Number(p.sentiment_score ?? 0).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 mt-1 line-clamp-2">{p.text}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          {p.region && <span>📍 {p.region}</span>}
                          {p.topic_name && <span className="text-orange-600 font-semibold">#{p.topic_name}</span>}
                          <span className="ml-auto">{timeAgoShort(p.timestamp)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <button
                    onClick={() => runSearch({ q: query.trim() })}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-lg px-3 py-1.5"
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    {hi ? 'लाइव डेटा व सिग्नल में पूर्ण खोज' : 'Open full results in Live Data & Signals'}
                  </button>
                  <button
                    onClick={() => runSearch({ q: query.trim(), bot: 'true' })}
                    className="text-[11px] font-semibold text-rose-700 hover:underline"
                  >
                    {hi ? 'केवल बॉट-संकेत' : 'bot-flagged only'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile search trigger */}
          <button
            onClick={() => onNavigatePage('live-feed', { q: query.trim() || undefined })}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Hindi / English Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-md transition-all ${
                language === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                language === 'hi' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LangIcon className="w-3 h-3" />
              हिन्दी
            </button>
          </div>

          {/* Lite Mode */}
          <button
            onClick={() => setMode(mode === 'normal' ? 'lite' : 'normal')}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              mode === 'lite'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/30'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title={mode === 'lite' ? 'Disable Lite Mode' : 'Enable Lite Mode for low bandwidth'}
          >
            <Zap className={`w-3.5 h-3.5 ${mode === 'lite' ? 'text-emerald-600 fill-emerald-500' : 'text-slate-400'}`} />
            <span>{mode === 'lite' ? 'Lite' : 'Std'}</span>
          </button>

          {/* LIVE indicator — actual orchestrator reachability */}
          <div className="hidden lg:flex items-center">
            <LiveBadge isLive={alertsState.isLive} loading={alertsState.loading} lastUpdated={alertsState.lastUpdated} onRefresh={alertsState.refresh} />
          </div>

          {/* Notifications — driven by /alerts */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unread.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full ring-2 ring-white flex items-center justify-center">
                  {unread.length}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-slate-800">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{t.topBar.notifications}</span>
                      {unread.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                          {unread.length} new
                        </span>
                      )}
                    </div>
                    {unread.length > 0 && (
                      <button
                        onClick={() => setReadIds(alerts.map((a) => a.id))}
                        className="text-xs text-orange-600 hover:underline font-medium"
                      >
                        {t.topBar.markAllRead}
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2">
                    {alerts.length === 0 && (
                      <div className="py-6 text-center text-xs text-slate-400">
                        {hi ? 'कोई सक्रिय अलर्ट नहीं' : 'No active alerts generated in the last 6 hours'}
                      </div>
                    )}
                    {alerts.slice(0, 8).map((a) => {
                      const style = SEVERITY_STYLE[a.severity] || SEVERITY_STYLE.Low;
                      const isUnread = !readIds.includes(a.id);
                      return (
                        <div
                          key={a.id}
                          onClick={() => {
                            setReadIds((prev) => [...prev, a.id]);
                            onNavigatePage('alerts');
                            setNotificationsOpen(false);
                          }}
                          className={`p-2.5 rounded-lg cursor-pointer transition-colors ${style.box} ${isUnread ? '' : 'opacity-55'}`}
                        >
                          <div className="flex items-start gap-2">
                            <span className={a.severity === 'High' ? 'text-rose-600' : a.severity === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}>
                              {style.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 truncate">{a.title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{a.description}</p>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {(a.platforms || []).slice(0, 4).map((p: string) => (
                                  <PlatformBadge key={p} platform={(p as Platform) || 'twitter'} size="sm" showName={false} />
                                ))}
                                <span className="text-[10px] text-slate-400 ml-auto font-semibold">
                                  {timeAgoShort(a.timestamp)} • {hi ? 'देखें' : 'tap to review'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        onNavigatePage('alerts');
                        setNotificationsOpen(false);
                      }}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                    >
                      {hi ? 'सभी अलर्ट देखें' : 'Open Complete Alerts Manager'} <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        onNavigatePage('dashboard', { section: 'audit' });
                        setNotificationsOpen(false);
                      }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                    >
                      {hi ? 'सिस्टम हेल्थ' : 'System health'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Analyst identity — feeds the x-analyst-id audit header */}
          <div className="relative">
            <button
              onClick={() => setAnalystOpen(!analystOpen)}
              className="flex items-center gap-2 pl-2 sm:pl-3 sm:border-l border-slate-200"
              title={hi ? 'विश्लेषक पहचान' : 'Analyst identity used for audit logging'}
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center ring-2 ring-amber-500/20 uppercase">
                {(analystId || 'analyst_guest').replace(/^analyst_/, '').slice(0, 2) || 'AN'}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight max-w-[120px] truncate">{analystId}</p>
                <p className="text-[10px] text-slate-500 leading-none">{hi ? 'सरकारी बौद्धिक डेस्क' : 'Gov Intel Desk'}</p>
              </div>
            </button>

            {analystOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAnalystOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-2">
                    <UserCog className="w-3.5 h-3.5 text-slate-500" />
                    {hi ? 'विश्लेषक पहचान' : 'Analyst identity'}
                  </div>
                  <input
                    value={analystId}
                    onChange={(e) => setAnalystIdLocal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && commitAnalyst()}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    placeholder="analyst_ndtc_01"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">
                    {hi
                      ? 'यह पहचान हर अनुरोध में x-analyst-id हेडर के रूप में जाती है और ऑडिट लॉग में दर्ज होती है।'
                      : 'Sent as the x-analyst-id header on every request and written into the audit trail, so each query is attributable.'}
                  </p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      onClick={commitAnalyst}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-bold bg-slate-900 text-white rounded-lg py-1.5 hover:bg-slate-700"
                    >
                      <Check className="w-3.5 h-3.5" /> {hi ? 'सेव करें' : 'Save'}
                    </button>
                    <button
                      onClick={() => onNavigatePage('dashboard', { section: 'audit' })}
                      className="text-xs font-semibold text-orange-700 hover:underline"
                    >
                      {hi ? 'लॉग' : 'My trail'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search row */}
      {searchOpen && (
        <div className="md:hidden px-3 pb-3 -mt-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) runSearch({ q: query.trim() });
              }}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              placeholder={t.topBar.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
        </div>
      )}

      <SocialTickerRibbon onPlatformClick={(p: any) => onNavigatePage('live-feed', typeof p === 'string' ? { platform: p } : {})} />
    </header>
  );
};
