import React from 'react';
import { SentimentType, RiskLevel, Velocity } from '../types';

interface SentimentBadgeProps {
  sentiment: SentimentType;
  lang?: 'en' | 'hi';
}

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({ sentiment, lang = 'en' }) => {
  const map = {
    positive: {
      en: 'Positive',
      hi: 'सकारात्मक',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      dot: 'bg-emerald-500',
    },
    negative: {
      en: 'Negative',
      hi: 'नकारात्मक',
      classes: 'bg-rose-50 text-rose-700 border-rose-300',
      dot: 'bg-rose-500',
    },
    neutral: {
      en: 'Neutral',
      hi: 'तटस्थ',
      classes: 'bg-slate-100 text-slate-700 border-slate-300',
      dot: 'bg-slate-400',
    },
    mixed: {
      en: 'Mixed',
      hi: 'मिश्रित',
      classes: 'bg-amber-50 text-amber-800 border-amber-300',
      dot: 'bg-amber-500',
    },
  };

  const item = map[sentiment] || map.neutral;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${item.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      <span>{lang === 'hi' ? item.hi : item.en}</span>
    </span>
  );
};

export const RiskBadge: React.FC<{ risk: RiskLevel; lang?: 'en' | 'hi' }> = ({ risk, lang = 'en' }) => {
  const map = {
    High: {
      en: 'High Risk',
      hi: 'उच्च जोखिम',
      classes: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse',
      dot: 'bg-rose-600',
    },
    Medium: {
      en: 'Medium Risk',
      hi: 'मध्यम जोखिम',
      classes: 'bg-orange-100 text-orange-800 border-orange-300',
      dot: 'bg-orange-500',
    },
    Low: {
      en: 'Low Risk',
      hi: 'कम जोखिम',
      classes: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dot: 'bg-emerald-500',
    },
  };

  const item = map[risk] || map.Low;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border ${item.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      <span>{lang === 'hi' ? item.hi : item.en}</span>
    </span>
  );
};

export const VelocityBadge: React.FC<{ velocity: Velocity; lang?: 'en' | 'hi' }> = ({ velocity, lang = 'en' }) => {
  const map = {
    High: {
      en: 'High Velocity',
      hi: 'तीव्र गति',
      classes: 'text-rose-600 bg-rose-50 border-rose-200',
      symbol: '↑↑',
    },
    Medium: {
      en: 'Medium Velocity',
      hi: 'मध्यम गति',
      classes: 'text-amber-600 bg-amber-50 border-amber-200',
      symbol: '↑',
    },
    Low: {
      en: 'Stable',
      hi: 'स्थिर',
      classes: 'text-slate-600 bg-slate-100 border-slate-200',
      symbol: '→',
    },
  };

  const item = map[velocity] || map.Medium;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${item.classes}`}>
      <span className="font-bold">{item.symbol}</span>
      <span>{lang === 'hi' ? item.hi : item.en}</span>
    </span>
  );
};
