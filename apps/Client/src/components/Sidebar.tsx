import React from 'react';
import { DashboardSectionId, PageId, Language } from '../types';
import { translations } from '../translations';
import {
  LayoutDashboard,
  TrendingUp,
  Share2,
  AlertCircle,
  ShieldAlert,
  Settings,
  ShieldCheck,
  ChevronRight,
  Database,
  Layers,
  Sparkles,
  ScrollText,
  Inbox,
} from 'lucide-react';
import {
  InstagramIcon,
  FacebookIcon,
  TwitterIcon,
  TelegramIcon,
  YouTubeIcon,
  RedditIcon,
} from './SocialBrandIcons';

interface SidebarProps {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  language: Language;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  activeAlertCount?: number;
  // Everything below is derived from live orchestrator calls — the badges on the
  // nav items and the ingestion box reflect real counts, not fixed strings.
  topicCount?: number;
  activePlatforms?: number;
  postsLastHour?: number;
  totalPosts?: number;
  graphNodes?: number;
  pipelineOverall?: 'healthy' | 'degraded' | 'critical' | string;
  mlStatus?: string;
  queueWaiting?: number;
  // Only the audit trail is still listed as a jump-target; demographics lives inside
  // the Dashboard and sentiment rides along with every post, so neither is listed.
  dashboardSection?: DashboardSectionId | null;
  onNavigateSection?: (section: DashboardSectionId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  language,
  mobileMenuOpen,
  setMobileMenuOpen,
  activeAlertCount = 0,
  topicCount = 0,
  activePlatforms = 0,
  postsLastHour = 0,
  totalPosts = 0,
  graphNodes = 0,
  pipelineOverall = 'unknown',
  mlStatus,
  queueWaiting = 0,
  dashboardSection = null,
  onNavigateSection,
}) => {
  const t = translations[language];
  const hi = language === 'hi';

  const navItems: {
    id: PageId | DashboardSectionId;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
    section?: DashboardSectionId;
  }[] = [
    {
      id: 'dashboard',
      label: t.nav.dashboard,
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      // One page for the captured signals + the connectors they came from.
      id: 'live-feed',
      label: t.nav['live-feed'],
      icon: <Inbox className="w-4 h-4 text-orange-500" />,
      // Real throughput out of the ingestion queue, not a static "Live" label.
      badge: postsLastHour > 0 ? `+${postsLastHour}/h` : hi ? 'फ़ीड' : 'feed',
      badgeColor: 'bg-orange-100 text-orange-700',
    },
    {
      id: 'trending',
      label: t.nav.trending,
      icon: <TrendingUp className="w-4 h-4" />,
      badge: topicCount > 0 ? `${topicCount} active` : undefined,
      badgeColor: 'bg-orange-100 text-orange-700',
    },
    {
      id: 'network',
      label: t.nav.network,
      icon: <Share2 className="w-4 h-4" />,
      badge: graphNodes > 0 ? `${graphNodes} nodes` : undefined,
      badgeColor: 'bg-sky-100 text-sky-800',
    },
    {
      id: 'alerts',
      label: t.nav.alerts,
      icon: <AlertCircle className="w-4 h-4" />,
      badge: activeAlertCount > 0 ? `${activeAlertCount}` : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
    },
    {
      id: 'rumor-radar',
      label: t.nav['rumor-radar'],
      icon: <ShieldAlert className="w-4 h-4" />,
    },
    {
      id: 'audit',
      section: 'audit',
      label: t.nav.audit,
      icon: <ScrollText className="w-4 h-4" />,
      badge: queueWaiting > 0 ? `q ${queueWaiting}` : undefined,
      badgeColor: 'bg-slate-200 text-slate-700',
    },
    {
      id: 'settings',
      label: t.nav.settings,
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const healthLabel =
    pipelineOverall === 'healthy' ? 'HEALTHY' : pipelineOverall === 'critical' ? 'CRITICAL' : pipelineOverall === 'degraded' ? 'DEGRADED' : 'UNKNOWN';
  const healthClasses =
    pipelineOverall === 'healthy'
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : pipelineOverall === 'critical'
      ? 'text-rose-600 bg-rose-50 border-rose-200'
      : 'text-amber-600 bg-amber-50 border-amber-200';

  const handleSelect = (item: { id: PageId | DashboardSectionId; section?: DashboardSectionId }) => {
    if (item.section) {
      // Section link: land on the dashboard, then scroll to and flash the section.
      onNavigateSection?.(item.section);
      setMobileMenuOpen(false);
      return;
    }
    setCurrentPage(item.id as PageId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-24 bottom-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Navigation list */}
        <div className="p-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {language === 'hi' ? 'मुख्य नेविगेशन' : 'Enterprise Modules'}
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.section
                ? currentPage === 'dashboard' && dashboardSection === item.section
                : currentPage === item.id && !dashboardSection;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-amber-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Quick status box */}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  {language === 'hi' ? 'स्ट्रीम स्थिति' : 'Data Ingestion'}
                </span>
                <span className={`text-[10px] font-mono px-1 rounded border ${healthClasses}`}>
                  {healthLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {totalPosts > 0
                  ? hi
                    ? `${totalPosts.toLocaleString('en-IN')} पंक्तियाँ इंडेक्सड · ${activePlatforms || 0} स्रोत स्ट्रीमिंग कर रहे हैं।`
                    : `${totalPosts.toLocaleString('en-IN')} rows indexed · ${activePlatforms || 0} sources streaming.`
                  : hi
                  ? 'अभी कोई डेटा संग्रहित नहीं — ingestion worker प्रारंभ करें।'
                  : 'No rows stored yet — start the ingestion worker and a connector.'}
              </p>

              <div className="grid grid-cols-3 gap-1.5 mt-2 text-center">
                {[
                  { label: hi ? 'घंटे में' : '/hour', value: postsLastHour },
                  { label: hi ? 'विषय' : 'topics', value: topicCount },
                  { label: hi ? 'क्यू' : 'queued', value: queueWaiting },
                ].map((cell, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded px-1 py-1">
                    <div className="text-[11px] font-extrabold text-slate-800">{Number(cell.value).toLocaleString('en-IN')}</div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-wide">{cell.label}</div>
                  </div>
                ))}
              </div>

              {mlStatus && (
                <div
                  className={`mt-2 flex items-center gap-1.5 text-[10px] font-semibold rounded px-1.5 py-1 border ${
                    mlStatus === 'unreachable'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  {mlStatus === 'unreachable'
                    ? hi
                      ? 'ML सेवा अनुपलब्ध — नेटिव लैक्सिकॉन स्कोरिंग सक्रिय'
                      : 'ML service offline — native lexicon scoring active'
                    : hi
                    ? 'ML अनुमान सेवा सक्रिय'
                    : 'ML inference service online'}
                </div>
              )}

              {/* Social Platform Icons Mini Bar */}
              <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-200/70">
                <div title="Telegram" className="hover:scale-110 transition-transform">
                  <TelegramIcon className="w-3.5 h-3.5" />
                </div>
                <div title="Instagram" className="hover:scale-110 transition-transform">
                  <InstagramIcon className="w-3.5 h-3.5" />
                </div>
                <div title="Twitter / X" className="hover:scale-110 transition-transform">
                  <TwitterIcon className="w-3.5 h-3.5" />
                </div>
                <div title="YouTube" className="hover:scale-110 transition-transform">
                  <YouTubeIcon className="w-3.5 h-3.5" />
                </div>
                <div title="Facebook" className="hover:scale-110 transition-transform">
                  <FacebookIcon className="w-3.5 h-3.5" />
                </div>
                <div title="Reddit" className="hover:scale-110 transition-transform">
                  <RedditIcon className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Security / Compliance Badge */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-start gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-slate-700">
                {language === 'hi' ? 'गोपनीयता अनुपालन' : 'Zero-PII Privacy Enforced'}
              </p>
              <p className="text-[10px] text-slate-500 leading-snug">
                {language === 'hi'
                  ? 'व्यक्तिगत पहचान का कोई डेटा संग्रहीत नहीं है।'
                  : 'Aggregated statistical estimates only. No individual tracking.'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
