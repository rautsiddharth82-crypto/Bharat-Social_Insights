import React, { useState } from 'react';
import { TopicData, Language, ActionCardItem } from '../types';
import { actionCardsData, topicForensicMap } from '../data/mockData';
import { PlatformBadge } from './PlatformBadge';
import {
  X as CloseIcon,
  AlertTriangle,
  Copy,
  CheckCircle2,
  Send,
  Radio,
  Check,
  Zap,
  Share2,
  MapPin,
  AlertOctagon,
  ArrowRight,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

interface TopicDetailModalProps {
  topic: TopicData | null;
  onClose: () => void;
  language: Language;
  onOpenRumorRadar: (topic: TopicData) => void;
}

export const TopicDetailModal: React.FC<TopicDetailModalProps> = ({
  topic,
  onClose,
  language,
}) => {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [dispatched, setDispatched] = useState<Record<string, boolean>>({});
  const [dispatching, setDispatching] = useState(false);
  const [draftLang, setDraftLang] = useState<'en' | 'hi'>(language === 'hi' ? 'hi' : 'en');

  if (!topic) return null;

  // Forensic origin & circulation data for this topic
  const forensicData = topicForensicMap[topic.id] || topicForensicMap['neet-exam-2026'];
  const origin = forensicData.origin;
  const circulation = forensicData.circulation;

  // Matching action cards for the topic
  const matchingCards: ActionCardItem[] = actionCardsData.filter(
    (c) => c.topicId === topic.id
  );
  const cards: ActionCardItem[] =
    matchingCards.length > 0 ? matchingCards : [actionCardsData[0]];

  const currentCard = cards[activeCardIndex] || cards[0];
  const activeDraft =
    draftLang === 'hi' ? currentCard.draftContentHi : currentCard.draftContentEn;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDispatch = () => {
    setDispatching(true);
    setTimeout(() => {
      setDispatched((prev) => ({ ...prev, [currentCard.id]: true }));
      setDispatching(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-white shrink-0">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-600 text-white">
                <Zap className="w-3 h-3 text-amber-300" />
                {language === 'hi' ? 'एक्शन कार्ड' : 'Action Card'}
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  currentCard.priority.includes('Immediate')
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {currentCard.priority}
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {language === 'hi' ? topic.nameHi : topic.name}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-serif leading-snug">
              {language === 'hi' ? currentCard.titleHi : currentCard.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            title="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Action Channel Selector (if multiple cards exist for topic) */}
        {cards.length > 1 && (
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wide">
              {language === 'hi' ? 'चैनल:' : 'Channel:'}
            </span>
            {cards.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCardIndex(idx);
                  setCopied(false);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-all border ${
                  activeCardIndex === idx
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                {idx === 0
                  ? '📰 Press Wire'
                  : idx === 1
                  ? '📢 Telegram'
                  : idx === 2
                  ? '🎥 YouTube'
                  : idx === 3
                  ? '💬 Reddit'
                  : '📱 Social'}
              </button>
            ))}
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto grow">
          {/* STEP 1: KHABAR KAHA SE AAYI (NEWS ORIGIN) */}
          <div className="bg-rose-50/70 border border-rose-200/90 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-rose-600 text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
                  1
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  {language === 'hi' ? 'ख़बर कहाँ से आई (News Origin)' : 'Where the News Came From (Origin)'}
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-100/90 px-2.5 py-0.5 rounded-full border border-rose-200">
                {origin.time}
              </span>
            </div>

            <div className="bg-white rounded-lg p-3 border border-rose-200/80 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    {language === 'hi' ? 'शुरुआती प्लेटफ़ॉर्म:' : 'Origin Platform:'}
                  </span>
                  <PlatformBadge platform={origin.platform} size="sm" />
                </div>
                <span className="text-xs font-semibold text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded">
                  {language === 'hi' ? origin.sourceTypeHi : origin.sourceType}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-0.5">
                  {language === 'hi' ? 'पहला लीक / भ्रामक सामग्री:' : 'Initial Spark / Alleged Leak:'}
                </span>
                <p className="text-xs text-slate-900 font-medium leading-relaxed bg-amber-50/60 p-2 rounded border border-amber-200/60">
                  "{language === 'hi' ? origin.rawSparkHi : origin.rawSpark}"
                </p>
              </div>

              <div className="flex items-start gap-1.5 text-[11px] text-rose-900 bg-rose-50/90 p-2 rounded border border-rose-200 font-medium">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  <strong>{language === 'hi' ? 'फोरेंसिक सबूत / कमी:' : 'Forensic Red Flag:'}</strong>{' '}
                  {language === 'hi' ? origin.forensicFlagHi : origin.forensicFlag}
                </span>
              </div>
            </div>
          </div>

          {/* STEP 2: KAISE CIRCULATE HUI (CIRCULATION CASCADE) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-orange-600 text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
                  2
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-orange-600" />
                  {language === 'hi' ? 'कैसे सर्कुलेट हुई (Circulation Flow)' : 'How It Circulated (Spread Flow)'}
                </h3>
              </div>
              <span className="text-[11px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full font-mono">
                {circulation.length} {language === 'hi' ? 'चरण' : 'Stages'}
              </span>
            </div>

            {/* Step-by-step circulation flow */}
            <div className="space-y-2 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
              {circulation.map((st, idx) => (
                <div key={idx} className="relative flex items-start gap-2.5 pl-0.5">
                  {/* Step number badge */}
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-orange-500 text-orange-600 text-[10px] font-bold flex items-center justify-center shrink-0 z-10 shadow-xs">
                    {idx + 1}
                  </div>

                  {/* Step detail card */}
                  <div className="bg-white border border-slate-200/90 rounded-lg p-2.5 flex-1 shadow-2xs hover:border-orange-300 transition-colors">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <div className="flex items-center gap-1.5">
                        <PlatformBadge platform={st.platform} size="sm" showName={false} />
                        <span className="text-xs font-bold text-slate-900">
                          {language === 'hi' ? st.actionTitleHi : st.actionTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                          {st.time}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          {st.reach}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {language === 'hi' ? st.descriptionHi : st.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 3: OFFICIAL READY-TO-USE RESPONSE DRAFT */}
          <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-[11px]">
                  3
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  {language === 'hi' ? 'आधिकारिक स्पष्टीकरण संदेश (Response Draft)' : 'Official Clarification Draft'}
                </span>
              </div>

              {/* Language Switcher */}
              <div className="inline-flex bg-slate-800 rounded p-0.5 text-[11px] font-bold">
                <button
                  onClick={() => setDraftLang('en')}
                  className={`px-2 py-0.5 rounded transition-all ${
                    draftLang === 'en'
                      ? 'bg-orange-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setDraftLang('hi')}
                  className={`px-2 py-0.5 rounded transition-all ${
                    draftLang === 'hi'
                      ? 'bg-orange-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            </div>

            {/* The Draft Text */}
            <p className="text-xs sm:text-sm font-sans text-slate-100 leading-relaxed bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 select-all">
              "{activeDraft}"
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'कॉपी हो गया!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'ड्राफ्ट कॉपी करें' : 'Copy Text'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDispatch}
                disabled={dispatched[currentCard.id] || dispatching}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  dispatched[currentCard.id]
                    ? 'bg-emerald-600 text-white cursor-default'
                    : dispatching
                    ? 'bg-orange-600 text-white opacity-90'
                    : 'bg-orange-600 hover:bg-orange-500 text-white shadow-xs active:scale-95'
                }`}
              >
                {dispatched[currentCard.id] ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'प्रसारित किया गया' : 'Dispatched'}</span>
                  </>
                ) : dispatching ? (
                  <>
                    <Radio className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'hi' ? 'प्रसारण जारी...' : 'Broadcasting...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{language === 'hi' ? 'सीधे प्रसारित करें' : 'Dispatch Now'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* STEP 4: TARGET CHANNELS & EXPECTED CONTAINMENT IMPACT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                {language === 'hi' ? 'प्रसारण चैनल्स' : 'Target Channels'}
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentCard.channels.map((ch, idx) => (
                  <span
                    key={idx}
                    className="bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold"
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                {language === 'hi' ? 'अनुमानित प्रभाव' : 'Expected Impact'}
              </span>
              <p className="text-[11px] text-emerald-900 font-semibold mt-1">
                🎯 {language === 'hi' ? currentCard.expectedImpactHi : currentCard.expectedImpactEn}
              </p>
            </div>
          </div>
        </div>

        {/* Simple Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            {language === 'hi' ? 'बंद करें' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};

