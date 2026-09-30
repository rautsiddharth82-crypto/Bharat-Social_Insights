import React, { useState, useCallback, useEffect } from 'react';
import { AlertItem, Language, Mode, TopicData } from '../types';
import { translations } from '../translations';
import { mockAlerts, mockTopics } from '../data/mockData';
import { PlatformBadge } from './PlatformBadge';
import {
  AlertCircle,
  AlertTriangle,
  Flame,
  Activity,
  Share2,
  CheckCircle2,
  Eye,
  EyeOff,
  Clock,
  ShieldAlert,
  Sparkles,
  Copy,
  Info,
  X as CloseIcon,
  Zap,
} from 'lucide-react';
import { LiveBadge } from './LiveBadge';
import { useApi } from '../services/useApi';
import { fetchAlerts } from '../services/api';

interface AlertsViewProps {
  language: Language;
  mode: Mode;
  onOpenRumorRadar: (topic: TopicData) => void;
  onSelectTopic: (topic: TopicData) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  language,
  mode,
  onOpenRumorRadar,
  onSelectTopic,
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<AlertItem | null>(null);
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  // ── Real API data ──────────────────────────────────────────────
  const alertsFetcher = useCallback(() => fetchAlerts(), []);
  const { data: alertsApiData, isLive: alertsLive, loading: alertsLoading, lastUpdated: alertsUpdated, refresh: refreshAlerts } =
    useApi(alertsFetcher, { refreshInterval: 30000 });

  // Use real alerts if available, fall back to mockAlerts
  const [alerts, setAlerts] = useState<AlertItem[]>(mockAlerts);
  useEffect(() => {
    const apiAlerts = alertsApiData?.alerts || [];
    if (apiAlerts.length > 0) {
      // Map API alert shape to AlertItem shape
      const mapped: AlertItem[] = apiAlerts.map((a: any): AlertItem => ({
        id: a.id,
        // API returns 'High'/'Medium'/'Low', AlertItem wants 'high'/'medium'/'low'
        severity: (String(a.severity || 'medium').toLowerCase()) as AlertItem['severity'],
        type: (a.type || 'rumor_risk') as AlertItem['type'],
        typeLabelEn: a.type === 'trend_growth' ? 'Trend Growth' : a.type === 'sentiment_spike' ? 'Sentiment Spike' : a.type === 'cross_platform' ? 'Cross-Platform' : 'Rumor Risk',
        typeLabelHi: a.type === 'trend_growth' ? 'ट्रेंड ग्रोथ' : a.type === 'sentiment_spike' ? 'सेंटिमेंट स्पाइक' : a.type === 'cross_platform' ? 'क्रॉस-प्लेटफॉर्म' : 'अफवाह जोखिम',
        topic: a.title || '',
        topicHi: a.title || '',
        platforms: (a.platforms || []) as AlertItem['platforms'],
        reasonEn: a.description || '',
        reasonHi: a.description || '',
        timeAgo: a.timestamp ? `Live · ${new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live Update',
        timeAgoHi: a.timestamp ? `लाइव · ${new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'लाइव अपडेट',
        reviewed: false,
        monitored: false,
      }));
      setAlerts(mapped);
    }
  }, [alertsApiData]);

  const getMatchedTopic = (alertItem: AlertItem): TopicData => {
    return (
      mockTopics.find(
        (t) =>
          alertItem.topic.toLowerCase().includes(t.name.toLowerCase()) ||
          t.name.toLowerCase().includes(alertItem.topic.toLowerCase())
      ) || mockTopics[0]
    );
  };

  const toggleReviewed = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, reviewed: !a.reviewed } : a))
    );
  };

  const toggleMonitored = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, monitored: !a.monitored } : a))
    );
  };

  const filteredAlerts = alerts.filter((a) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'rumor') return a.type === 'rumor_risk';
    if (activeTab === 'trend') return a.type === 'trend_growth';
    if (activeTab === 'sentiment') return a.type === 'sentiment_spike';
    if (activeTab === 'cross') return a.type === 'cross_platform';
    return true;
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'rumor_risk':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'trend_growth':
        return <Flame className="w-5 h-5 text-orange-600" />;
      case 'sentiment_spike':
        return <Activity className="w-5 h-5 text-amber-600" />;
      case 'cross_platform':
      default:
        return <Share2 className="w-5 h-5 text-blue-600" />;
    }
  };

  const copyText = (txt: string, tag: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedStep(tag);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <AlertCircle className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 font-mono">
              Operational Triage Desk
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-serif">
            {t.alertsPage.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            {t.alertsPage.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold font-mono">
            {alerts.filter((a) => !a.reviewed).length} Pending Review
          </span>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {t.alertsPage.tabAll} ({alerts.length})
        </button>
        <button
          onClick={() => setActiveTab('rumor')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'rumor'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          {t.alertsPage.tabRumor}
        </button>
        <button
          onClick={() => setActiveTab('trend')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'trend'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-white text-orange-700 border border-orange-200 hover:bg-orange-50'
          }`}
        >
          {t.alertsPage.tabTrend}
        </button>
        <button
          onClick={() => setActiveTab('sentiment')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'sentiment'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          {t.alertsPage.tabSentiment}
        </button>
        <button
          onClick={() => setActiveTab('cross')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'cross'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
          }`}
        >
          {t.alertsPage.tabCross}
        </button>
      </div>

      {/* ALERTS LIST */}
      <div className="space-y-3.5">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              alert.reviewed
                ? 'bg-slate-50/60 border-slate-200 opacity-80'
                : alert.severity === 'high'
                ? 'bg-white border-rose-300 shadow-sm ring-1 ring-rose-400/20'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              {/* Alert details */}
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    alert.type === 'rumor_risk'
                      ? 'bg-rose-100'
                      : alert.type === 'trend_growth'
                      ? 'bg-orange-100'
                      : alert.type === 'sentiment_spike'
                      ? 'bg-amber-100'
                      : 'bg-blue-100'
                  }`}
                >
                  {getAlertIcon(alert.type)}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider ${
                        alert.severity === 'high'
                          ? 'bg-rose-600 text-white'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {language === 'hi' ? alert.typeLabelHi : alert.typeLabelEn}
                    </span>

                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {language === 'hi' ? alert.timeAgoHi : alert.timeAgo}
                    </span>

                    {alert.reviewed && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {t.alertsPage.reviewedBadge}
                      </span>
                    )}

                    {alert.monitored && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {t.alertsPage.monitoringBadge}
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => {
                      const matched = getMatchedTopic(alert);
                      onSelectTopic(matched);
                    }}
                    className="text-sm sm:text-base font-bold text-slate-900 hover:text-orange-600 cursor-pointer transition-colors flex items-center gap-2 group"
                    title={language === 'hi' ? 'एक्शन कार्ड खोलें' : 'Click to open Action Card'}
                  >
                    <span>{language === 'hi' ? alert.topicHi : alert.topic}</span>
                    <span className="hidden group-hover:inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      ⚡ {language === 'hi' ? 'एक्शन कार्ड' : 'Action Card'}
                    </span>
                  </h3>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    <strong>{language === 'hi' ? 'कारण: ' : 'Trigger Reason: '}</strong>
                    {language === 'hi' ? alert.reasonHi : alert.reasonEn}
                  </p>

                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    {alert.platforms.map((p) => (
                      <PlatformBadge key={p} platform={p} size="sm" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2 shrink-0">
                <button
                  onClick={() => {
                    const matched = getMatchedTopic(alert);
                    onSelectTopic(matched);
                  }}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  title="Open Action Card"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>{language === 'hi' ? 'एक्शन कार्ड' : 'Action Card'}</span>
                </button>

                <button
                  onClick={() => setSelectedAlertForAction(alert)}
                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t.alertsPage.btnViewAnalysis}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleReviewed(alert.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      alert.reviewed
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {alert.reviewed ? 'Mark Unread' : t.alertsPage.btnMarkReviewed}
                  </button>

                  <button
                    onClick={() => toggleMonitored(alert.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      alert.monitored
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {alert.monitored ? 'Watching' : t.alertsPage.btnMonitor}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>



      {/* RECOMMENDED ACTIONS MODAL (When an alert's "View Analysis" is clicked) */}
      {selectedAlertForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 z-10">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  {selectedAlertForAction.typeLabelEn}
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 font-serif mt-1">
                  {t.alertsPage.modalTitle}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedAlertForAction.topic}
                </p>
              </div>

              <button
                onClick={() => setSelectedAlertForAction(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Trigger reason recap */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                <span className="font-bold text-slate-900">Incident Context: </span>
                {selectedAlertForAction.reasonEn}
              </div>

              {/* THREE RECOMMENDED ACTIONS */}
              <div className="space-y-3">
                {/* 1. VERIFY */}
                <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black uppercase text-orange-800 tracking-wider flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px]">1</span>
                      VERIFY
                    </span>
                    <button
                      onClick={() => copyText('Check official portal sources and testing calendar verification notice.', 'step1')}
                      className="text-[11px] text-orange-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedStep === 'step1' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    Check official sources directly. Confirm with testing authority / press information bureau before issuing external rebuttals.
                  </p>
                </div>

                {/* 2. COMMUNICATE */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black uppercase text-blue-800 tracking-wider flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                      COMMUNICATE
                    </span>
                    <button
                      onClick={() => copyText('Prepare a short Hindi/English clarification bulletin for social channels.', 'step2')}
                      className="text-[11px] text-blue-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedStep === 'step2' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    Prepare a short Hindi/English clarification bulletin. Dispel rumors regarding altered schedules or fake circulars.
                  </p>
                </div>

                {/* 3. MONITOR */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                      MONITOR
                    </span>
                    <button
                      onClick={() => copyText('Track sentiment and spread for the next 2 hours across Telegram and YouTube.', 'step3')}
                      className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedStep === 'step3' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    Track sentiment and spread velocity for the next 2 hours across Telegram channels and video streaming platforms.
                  </p>
                </div>
              </div>

              {/* Strict Non-authoritative Disclaimer */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Mandatory Disclaimer:</strong> {t.alertsPage.modalDisclaimer}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setSelectedAlertForAction(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>

              <button
                onClick={() => {
                  const targetTopic = mockTopics[0];
                  setSelectedAlertForAction(null);
                  onOpenRumorRadar(targetTopic);
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <ShieldAlert className="w-4 h-4" />
                Run Rumor Radar Forensics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
