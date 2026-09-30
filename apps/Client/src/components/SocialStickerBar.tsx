import React from 'react';
import {
  InstagramIcon,
  FacebookIcon,
  TwitterIcon,
  TelegramIcon,
  YouTubeIcon,
  RedditIcon,
  WhatsAppIcon,
  SocialSticker,
} from './SocialBrandIcons';
import { Sparkles, Radio, Flame, ArrowRight } from 'lucide-react';

interface SocialStickerBarProps {
  onExploreConnectors?: () => void;
  language?: string;
}

export const SocialStickerBar: React.FC<SocialStickerBarProps> = ({
  onExploreConnectors,
  language = 'en',
}) => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl overflow-hidden relative">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-64 h-32 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-amber-400">
              {language === 'hi' ? 'सोशल मीडिया लाइव स्ट्रीम्स' : 'Social Media Pulse Hub'}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-white font-serif mt-0.5">
            {language === 'hi'
              ? 'इंस्टाग्राम, फेसबुक, ट्विटर, टेलीग्राम एवं यूट्यूब पर निगरानी'
              : 'Multi-Platform Social Signal Ingestion & Anomaly Radar'}
          </h3>
        </div>

        {onExploreConnectors && (
          <button
            onClick={onExploreConnectors}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 shadow-xs self-start sm:self-auto group"
          >
            <span>{language === 'hi' ? 'सभी कनेक्टर्स देखें' : 'View Ingestion Pipelines'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-amber-400" />
          </button>
        )}
      </div>

      {/* Interactive Social Media Sticker Grid */}
      <div className="mt-4 flex flex-wrap items-center gap-3 relative z-10">
        {/* Telegram Sticker */}
        <div
          onClick={onExploreConnectors}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-sky-500 to-[#229ED9] text-white shadow-lg shadow-sky-500/25 border-2 border-white/30 cursor-pointer transform hover:-translate-y-1 hover:rotate-1 transition-all select-none group"
        >
          <div className="p-1 rounded-full bg-white/20">
            <TelegramIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black tracking-tight font-sans">Telegram</span>
              <span className="text-[9px] bg-black/25 px-1 rounded font-mono font-bold">100% Free</span>
            </div>
            <span className="text-[10px] text-sky-100 font-mono font-bold">
              1,240+ Channels • 420k Hub
            </span>
          </div>
        </div>

        {/* Instagram Sticker */}
        <div
          onClick={onExploreConnectors}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white shadow-lg shadow-pink-500/25 border-2 border-white/30 cursor-pointer transform hover:-translate-y-1 hover:-rotate-1 transition-all select-none group"
        >
          <div className="p-1 rounded-full bg-white/20">
            <InstagramIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black tracking-tight font-sans">Instagram</span>
              <span className="text-[9px] bg-black/25 px-1 rounded font-mono font-bold">Reels & Stories</span>
            </div>
            <span className="text-[10px] text-pink-100 font-mono font-bold">
              84k Mentions/hr • Gen-Z Pulse
            </span>
          </div>
        </div>

        {/* Twitter / X Sticker */}
        <div
          onClick={onExploreConnectors}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/40 border-2 border-slate-600 cursor-pointer transform hover:-translate-y-1 hover:rotate-1 transition-all select-none group"
        >
          <div className="p-1 rounded-full bg-sky-500/20">
            <TwitterIcon className="w-5 h-5 text-sky-400" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black tracking-tight font-sans">Twitter / X</span>
              <span className="text-[9px] bg-sky-500/30 text-sky-200 px-1 rounded font-mono font-bold">Trends</span>
            </div>
            <span className="text-[10px] text-slate-300 font-mono font-bold">
              #NEET_POSTPONE • 142k Tweets
            </span>
          </div>
        </div>

        {/* YouTube Sticker */}
        <div
          onClick={onExploreConnectors}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg shadow-red-500/25 border-2 border-white/30 cursor-pointer transform hover:-translate-y-1 hover:-rotate-1 transition-all select-none group"
        >
          <div className="p-1 rounded-full bg-white/20">
            <YouTubeIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black tracking-tight font-sans">YouTube</span>
              <span className="text-[9px] bg-black/25 px-1 rounded font-mono font-bold">Live Comments</span>
            </div>
            <span className="text-[10px] text-red-100 font-mono font-bold">
              12 Video Streams • Top Edu
            </span>
          </div>
        </div>

        {/* Facebook Sticker */}
        <div
          onClick={onExploreConnectors}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#1877F2] text-white shadow-lg shadow-blue-500/25 border-2 border-white/30 cursor-pointer transform hover:-translate-y-1 hover:rotate-1 transition-all select-none group"
        >
          <div className="p-1 rounded-full bg-white/20">
            <FacebookIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black tracking-tight font-sans">Facebook</span>
              <span className="text-[9px] bg-black/25 px-1 rounded font-mono font-bold">Public Groups</span>
            </div>
            <span className="text-[10px] text-blue-100 font-mono font-bold">
              310k Aspirants Reach
            </span>
          </div>
        </div>

        {/* Reddit Sticker */}
        <div
          onClick={onExploreConnectors}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#FF4500] text-white shadow-lg shadow-orange-500/25 border-2 border-white/30 cursor-pointer transform hover:-translate-y-1 hover:-rotate-1 transition-all select-none group"
        >
          <div className="p-1 rounded-full bg-white/20">
            <RedditIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black tracking-tight font-sans">Reddit</span>
              <span className="text-[9px] bg-black/25 px-1 rounded font-mono font-bold">r/JEENEETards</span>
            </div>
            <span className="text-[10px] text-orange-100 font-mono font-bold">
              88% Panic Sentiments
            </span>
          </div>
        </div>

        {/* WhatsApp Forward Sticker */}
        <div
          onClick={onExploreConnectors}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#25D366] text-white shadow-lg shadow-emerald-500/25 border-2 border-white/30 cursor-pointer transform hover:-translate-y-1 hover:rotate-1 transition-all select-none group"
        >
          <div className="p-1 rounded-full bg-white/20">
            <WhatsAppIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black tracking-tight font-sans">WhatsApp</span>
              <span className="text-[9px] bg-black/25 px-1 rounded font-mono font-bold">Virality Index</span>
            </div>
            <span className="text-[10px] text-emerald-100 font-mono font-bold">
              5.8x Cascade Velocity
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
