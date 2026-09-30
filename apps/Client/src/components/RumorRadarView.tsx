import React, { useState, useCallback } from 'react';
import { TopicData, Language, Mode } from '../types';
import { translations } from '../translations';
import { mockTopics } from '../data/mockData';
import { PlatformBadge } from './PlatformBadge';
import {
  ShieldAlert,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  RefreshCw,
  Copy,
} from 'lucide-react';
import { useApi } from '../services/useApi';
import { fetchRumorRisk } from '../services/api';

interface RumorRadarViewProps {
  language: Language;
  mode: Mode;
  initialTopic?: TopicData | null;
}

export const RumorRadarView: React.FC<RumorRadarViewProps> = ({
  language,
  mode,
  initialTopic,
}) => {
  const t = translations[language];

  // Current selected or custom topic
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    initialTopic ? initialTopic.id : 'neet-exam-2026'
  );
  const [customClaimQuery, setCustomClaimQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(true); // Default true so user immediately sees results as requested
  const [scanStep, setScanStep] = useState(3);
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

  const activeTopic =
    mockTopics.find((t) => t.id === selectedTopicId) || mockTopics[0];

  const rumorFetcher = useCallback(() => fetchRumorRisk(), []);
  const { data: rumorData, isLive: rumorLive, loading: rumorLoading, lastUpdated: rumorUpdated, refresh: refreshRumor } =
    useApi(rumorFetcher, { refreshInterval: 120000 });

  const handleRunScan = () => {
    setIsScanning(true);
    setHasScanned(false);
    setScanStep(1);
    setTimeout(() => setScanStep(2), 600);
    setTimeout(() => setScanStep(3), 1200);
    setTimeout(() => {
      void refreshRumor();
      setIsScanning(false);
      setHasScanned(true);
    }, 1800);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAction(id);
    setTimeout(() => setCopiedAction(null), 2000);
  };

  return (
    <div className="space-y-6">

      {/* PRIMARY CTA & TOPIC SELECTOR CENTERPIECE */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 text-center relative overflow-hidden">
        {/* Subtle background radar circles */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="w-96 h-96 rounded-full border border-amber-400 animate-ping" />
          <div className="w-[550px] h-[550px] rounded-full border border-orange-500" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-5">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              Automated Forensic Engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-serif">
              {language === 'hi' ? 'सोशल मीडिया अफ़वाह एवं दावा जांच' : 'Multi-Platform Narrative Risk Audit'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {language === 'hi'
                ? 'टेलीग्राम, यूट्यूब, रेडिट, एक्स, और मेटा प्लेटफॉर्म पर फॉरवर्डिंग स्पाइक की जांच करें।'
                : 'Scans forward chain velocity, anxiety lexicon surge, and multi-platform synchronized dispersion.'}
            </p>
          </div>

          {/* Selector or custom query */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 bg-slate-800/80 p-2 rounded-2xl border border-slate-700">
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full sm:w-auto bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {mockTopics.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {language === 'hi' ? tp.nameHi : tp.name} ({tp.posts.toLocaleString()} posts)
                </option>
              ))}
            </select>

            <span className="text-xs text-slate-400 hidden sm:inline font-mono">
              or
            </span>

            <input
              type="text"
              placeholder={
                language === 'hi'
                  ? 'या कोई अन्य दावा दर्ज करें (जैसे: एडमिट कार्ड लीक)...'
                  : 'Or paste custom claim (e.g., Admit card release date)...'
              }
              value={customClaimQuery}
              onChange={(e) => setCustomClaimQuery(e.target.value)}
              className="w-full sm:flex-1 bg-slate-900 text-white placeholder-slate-500 text-xs px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* LARGE PRIMARY BUTTON */}
          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-600 via-rose-600 to-orange-600 hover:from-orange-500 hover:to-rose-500 text-white text-sm sm:text-base font-extrabold uppercase tracking-wider rounded-2xl shadow-xl shadow-orange-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 mx-auto cursor-pointer"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>{language === 'hi' ? 'विश्लेषण जारी है...' : 'Scanning Cross-Platform Feeds...'}</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-5 h-5" />
                <span>{t.rumorPage.primaryCta}</span>
              </>
            )}
          </button>

          {isScanning && (
            <div className="pt-2">
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden max-w-md mx-auto">
                <div
                  className="bg-orange-500 h-full transition-all duration-500"
                  style={{ width: `${(scanStep / 3) * 100}%` }}
                />
              </div>
              <p className="text-xs text-amber-300 font-mono mt-2 animate-pulse">
                {scanStep === 1 && 'Querying Telegram & YouTube forward cascades...'}
                {scanStep === 2 && 'Scoring anxiety vs sarcasm emotional ratios...'}
                {scanStep === 3 && 'Synthesizing forensic risk vectors...'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* REALISTIC DEMO ANALYSIS RESULT (When hasScanned is true) */}
      {hasScanned && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Top Result Card Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-extrabold tracking-wider uppercase flex items-center gap-1.5 shadow-xs">
                  <AlertOctagon className="w-4 h-4" />
                  {t.rumorPage.riskResultTitle}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Status: UNVERIFIED / HIGH VELOCITY
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
                {language === 'hi' ? activeTopic.nameHi : activeTopic.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'hi'
                  ? 'सोशल मीडिया दावा: परीक्षा तिथि 3 हफ्ते आगे बढ़ने का नोटिस प्रसारित।'
                  : 'Claim circulating: Notice alleging exam postponed by 3 weeks.'}
              </p>
            </div>

            {/* Score Meters */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="text-center px-2">
                <p className="text-[11px] text-slate-500 font-bold uppercase">
                  Rumor Risk
                </p>
                <p className="text-xl font-black text-rose-600">
                  {rumorLive && rumorData?.level ? rumorData.level : activeTopic.riskLevel}
                </p>
              </div>

              <div className="h-8 w-px bg-slate-200" />

              <div className="text-center px-2">
                <p className="text-[11px] text-slate-500 font-bold uppercase">
                  {t.rumorPage.confidenceLabel}
                </p>
                <p className="text-xl font-black text-slate-900">
                  {rumorLive && rumorData?.score ? `${Math.round(rumorData.score)}%` : `${activeTopic.confidence}%`}
                </p>
              </div>

              {rumorLive && (
                <>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-center px-2">
                    <p className="text-[11px] text-slate-500 font-bold uppercase">
                      Source
                    </p>
                    <p className="text-sm font-bold text-emerald-600">LIVE API</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Risk Factors Checklist + Platforms Detected */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Factors */}
            <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-4">
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                {t.rumorPage.riskFactorsTitle}
              </h4>
              <ul className="space-y-2 text-xs text-slate-800">
                {rumorLive && rumorData?.contributing_factors && rumorData.contributing_factors.length > 0 ? (
                  rumorData.contributing_factors.map((factor: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                      <strong>Factor #{i + 1}:</strong> {factor}
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                      <strong>High anxiety:</strong> 38% of mentions express fear, urgency, and panic.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                      <strong>Rapid growth:</strong> Post frequency accelerated by +142% in 24 hours.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                      <strong>Cross-platform spread:</strong> Synchronized appearance on 4 major platforms.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                      <strong>Conflicting claims:</strong> Fake circular timestamp contradicts official gazette format.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                      <strong>High forwarding activity:</strong> Over 12,400 forwards/hr on private student groups.
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Platforms Detected & AI Explanation */}
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {t.rumorPage.platformsDetected}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeTopic.platforms.map((p) => (
                    <PlatformBadge key={p} platform={p} size="md" />
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  {t.rumorPage.explanationTitle}
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {rumorLive && rumorData?.explanation ? rumorData.explanation : `"${t.rumorPage.explanationText}"`}
                </p>
                {rumorLive && rumorUpdated && (
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    Generated: {rumorUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* THREE ACTION CARDS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-extrabold text-slate-900 font-serif">
                {t.rumorPage.actionsTitle}
              </h4>
              <span className="text-[11px] text-slate-500 italic">
                {language === 'hi'
                  ? '* एनालिटिक्स द्वारा सुझाई गई सिफारिशें'
                  : '* Standard operational containment playbook'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Action Card 1: Verify */}
              <div className="border border-slate-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-xs transition-all bg-white flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm mb-3">
                    1
                  </div>
                  <h5 className="text-sm font-bold text-slate-900">
                    {t.rumorPage.action1Title}
                  </h5>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {t.rumorPage.action1Desc}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Target: Official Desk
                  </span>
                  <button
                    onClick={() => handleCopyText(t.rumorPage.action1Desc, 'act1')}
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    {copiedAction === 'act1' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Step</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Card 2: Prepare */}
              <div className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-xs transition-all bg-white flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm mb-3">
                    2
                  </div>
                  <h5 className="text-sm font-bold text-slate-900">
                    {t.rumorPage.action2Title}
                  </h5>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {t.rumorPage.action2Desc}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Format: Hindi + English
                  </span>
                  <button
                    onClick={() => handleCopyText(t.rumorPage.action2Desc, 'act2')}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {copiedAction === 'act2' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Step</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Card 3: Monitor */}
              <div className="border border-slate-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-xs transition-all bg-white flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mb-3">
                    3
                  </div>
                  <h5 className="text-sm font-bold text-slate-900">
                    {t.rumorPage.action3Title}
                  </h5>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {t.rumorPage.action3Desc}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Window: 120 minutes
                  </span>
                  <button
                    onClick={() => handleCopyText(t.rumorPage.action3Desc, 'act3')}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    {copiedAction === 'act3' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Step</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mandatory AI-Generated Data Label */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
            <span className="font-bold text-slate-700 uppercase tracking-wider">
              {language === 'hi' ? 'सुरक्षा एवं सत्यनिष्ठा सूचना:' : 'Governance Notice:'}
            </span>{' '}
            {t.rumorPage.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
