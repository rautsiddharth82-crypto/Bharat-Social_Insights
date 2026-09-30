import React, { useCallback, useMemo, useState } from 'react';
import { DashboardSectionId, Language, Mode, NavigateOpts, NavigateFn, PageId, TopicData } from './types';
import { translations } from './translations';
import { mockTopics } from './data/mockData';
import { fetchAlerts, fetchOverviewStats, fetchPipelineTelemetry } from './services/api';
import { useApi } from './services/useApi';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardHome } from './components/DashboardHome';
import { TrendingTopicsView } from './components/TrendingTopicsView';
import { NetworkAnalysisView } from './components/NetworkAnalysisView';
import { AlertsView } from './components/AlertsView';
import { RumorRadarView } from './components/RumorRadarView';
import { SettingsPrivacyView } from './components/SettingsPrivacyView';
import { TopicDetailModal } from './components/TopicDetailModal';
import LiveSignalFeed from './components/LiveSignalFeed';
import {
  LayoutDashboard,
  Route,
  ShieldAlert,
  AlertCircle,
  Inbox,
} from 'lucide-react';

interface NavTarget {
  page: PageId;
  opts?: NavigateOpts;
  // Bumped on every navigation so a repeated jump to the same page with the same
  // filters still re-applies the incoming filters.
  nonce: number;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [language, setLanguage] = useState<Language>('en');
  const [mode, setMode] = useState<Mode>('normal');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Topic detail modal state
  const [selectedTopicForModal, setSelectedTopicForModal] = useState<TopicData | null>(null);
  // Target topic for Rumor Radar
  const [radarTopic, setRadarTopic] = useState<TopicData | null>(null);

  // Filters pushed into the live data & signals page from the Navbar search,
  // a demographic bar click, or a "trace how this arrived" action.
  const [feedFilters, setFeedFilters] = useState<(NavigateOpts & { nonce?: number }) | undefined>(undefined);
  const [networkTopic, setNetworkTopic] = useState<string | undefined>(undefined);
  // Demographics and the audit trail are sections of the dashboard, not pages —
  // sidebar clicks set this so the dashboard scrolls to and highlights them.
  const [dashboardSection, setDashboardSection] = useState<DashboardSectionId | null>(null);

  const t = translations[language];

  // ── Global live state used for the sidebar badges and the alert bell ──
  const stats = useApi(() => fetchOverviewStats(), { refreshInterval: 30000, keepPrevious: true });
  const alertState = useApi(() => fetchAlerts(), { refreshInterval: 30000, keepPrevious: true });
  const pipeline = useApi(() => fetchPipelineTelemetry(), { refreshInterval: 30000, keepPrevious: true });

  const highAlerts = useMemo(
    () => (alertState.data?.alerts ?? []).filter((a: any) => a.severity === 'High').length,
    [alertState.data]
  );
  const alertCount = alertState.data?.alerts?.length ?? 0;

  const handleOpenRumorRadar = (topic: TopicData) => {
    setRadarTopic(topic);
    setCurrentPage('rumor-radar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTopic = (topic: TopicData) => {
    setSelectedTopicForModal(topic);
  };

  const handleSelectTopicById = (topicId: string) => {
    const found = mockTopics.find((t) => t.id === topicId) || mockTopics[0];
    setSelectedTopicForModal(found);
  };

  // One navigation function for the whole app: any view can jump anywhere and
  // carry real filter values with it. Feeds, sources and origin traces all live
  // on the single Live Data & Signals page now.
  const navigate: NavigateFn = useCallback((page, opts) => {
    setCurrentPage(page);
    if (page !== 'dashboard') setDashboardSection(null);
    if (page === 'dashboard') setDashboardSection(opts?.section ?? null);
    if (page === 'live-feed') setFeedFilters({ ...(opts || {}), nonce: Date.now() });
    if (page === 'network') setNetworkTopic(opts?.topic);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardHome
            language={language}
            mode={mode}
            onNavigatePage={navigate}
            onSelectTopic={handleSelectTopic}
            onOpenRumorRadarForTopic={handleOpenRumorRadar}
            focusSection={dashboardSection}
          />
        );
      case 'live-feed':
        return (
          <LiveSignalFeed
            // Remount on every pushed navigation so incoming filters/tab always win.
            key={`feed-${feedFilters?.nonce ?? 0}`}
            language={language}
            mode={mode}
            initialFilters={feedFilters}
            onNavigatePage={navigate}
          />
        );
      case 'trending':
        return (
          <TrendingTopicsView
            language={language}
            mode={mode}
            onSelectTopic={handleSelectTopic}
            onOpenRumorRadar={handleOpenRumorRadar}
          />
        );

      case 'network':
        return <NetworkAnalysisView language={language} mode={mode} initialTopic={networkTopic} onNavigatePage={navigate} />;
      case 'alerts':
        return (
          <AlertsView
            language={language}
            mode={mode}
            onOpenRumorRadar={handleOpenRumorRadar}
            onSelectTopic={handleSelectTopic}
          />
        );
      case 'rumor-radar':
        return (
          <RumorRadarView
            language={language}
            mode={mode}
            initialTopic={radarTopic}
          />
        );
      case 'settings':
        return (
          <SettingsPrivacyView
            language={language}
            setLanguage={setLanguage}
            mode={mode}
            setMode={setMode}
          />
        );
      default:
        return (
          <DashboardHome
            language={language}
            mode={mode}
            onNavigatePage={navigate}
            onSelectTopic={handleSelectTopic}
            onOpenRumorRadarForTopic={handleOpenRumorRadar}
            focusSection={dashboardSection}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col antialiased">
      {/* Top Navbar */}
      <Navbar
        language={language}
        setLanguage={setLanguage}
        mode={mode}
        setMode={setMode}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onSelectTopic={handleSelectTopicById}
        onNavigatePage={navigate}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 lg:pb-8">
        {/* Left Sidebar (Desktop & Mobile Drawer) */}
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          language={language}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          activeAlertCount={alertCount}
          topicCount={stats.data?.active_topics ?? 0}
          activePlatforms={stats.data?.active_platforms ?? 0}
          postsLastHour={stats.data?.posts_last_hour ?? 0}
          totalPosts={pipeline.data?.database?.total_posts ?? stats.data?.total_posts ?? 0}
          graphNodes={pipeline.data?.graph?.nodes ?? 0}
          pipelineOverall={pipeline.data?.overall ?? stats.data?.source}
          mlStatus={(pipeline.data?.ml as any)?.status}
          queueWaiting={Number(pipeline.data?.queue?.waiting ?? 0)}
          dashboardSection={dashboardSection}
          onNavigateSection={(section) => {
            setDashboardSection(section);
            setCurrentPage('dashboard');
            setMobileMenuOpen(false);
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
          {renderCurrentPage()}
        </main>
      </div>

      {/* Modal for Topic Details */}
      {selectedTopicForModal && (
        <TopicDetailModal
          topic={selectedTopicForModal}
          onClose={() => setSelectedTopicForModal(null)}
          language={language}
          onOpenRumorRadar={handleOpenRumorRadar}
        />
      )}

      {/* Mobile Bottom Navigation Bar for rapid thumb navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setCurrentPage('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold ${
            currentPage === 'dashboard' ? 'text-orange-600' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>{language === 'hi' ? 'डैशबोर्ड' : 'Home'}</span>
        </button>

        <button
          onClick={() => navigate('live-feed')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold ${
            currentPage === 'live-feed' && !feedFilters?.trace ? 'text-orange-600' : 'text-slate-500'
          }`}
        >
          <Inbox className="w-4 h-4 mb-0.5" />
          <span>{language === 'hi' ? 'फ़ीड' : 'Feed'}</span>
        </button>

        <button
          onClick={() => navigate('live-feed', { trace: true })}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold ${
            currentPage === 'live-feed' && feedFilters?.trace ? 'text-orange-600' : 'text-slate-500'
          }`}
        >
          <Route className="w-4 h-4 mb-0.5" />
          <span>{language === 'hi' ? 'उत्पत्ति' : 'Origin'}</span>
        </button>

        <button
          onClick={() => setCurrentPage('rumor-radar')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold ${
            currentPage === 'rumor-radar' ? 'text-rose-600 font-extrabold' : 'text-slate-500'
          }`}
        >
          <ShieldAlert className="w-4 h-4 mb-0.5 text-rose-500 animate-pulse" />
          <span>{language === 'hi' ? 'रडार' : 'Radar'}</span>
        </button>

        <button
          onClick={() => setCurrentPage('alerts')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-bold relative ${
            currentPage === 'alerts' ? 'text-orange-600' : 'text-slate-500'
          }`}
        >
          <AlertCircle className="w-4 h-4 mb-0.5" />
          {alertCount > 0 && (
            <span className="absolute top-0.5 right-1.5 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
              {alertCount}
            </span>
          )}
          <span>{language === 'hi' ? 'अलर्ट' : 'Alerts'}</span>
        </button>
      </div>
    </div>
  );
}
