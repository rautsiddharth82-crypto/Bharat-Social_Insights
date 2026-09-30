import React, { useState } from 'react';
import { Language, Mode } from '../types';
import { translations } from '../translations';
import {
  Settings,
  ShieldCheck,
  Lock,
  Database,
  History,
  UserCheck,
  Languages,
  Zap,
  Volume2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
} from 'lucide-react';

interface SettingsPrivacyViewProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
}

export const SettingsPrivacyView: React.FC<SettingsPrivacyViewProps> = ({
  language,
  setLanguage,
  mode,
  setMode,
}) => {
  const t = translations[language];

  const [audioAlerts, setAudioAlerts] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('30s');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSavePreferences = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-mono">
              Governance & Compliance
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-serif">
            {t.settingsPage.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
            {t.settingsPage.subtitle}
          </p>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Preferences Updated</span>
          </div>
        )}
      </div>

      {/* PRIVACY & GOVERNANCE ARCHITECTURE (Mandated requirements) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-extrabold text-slate-900 font-serif">
              {t.settingsPage.privacyFrameworkTitle}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            “{t.settingsPage.privacyFrameworkDesc}”
          </p>
        </div>

        {/* 8 Core Privacy Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. No phone numbers */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <span className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center mb-2">
              ✕
            </span>
            <h3 className="text-xs font-bold text-slate-900">
              No Phone Numbers
            </h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Mobile numbers and MSISDN identifiers are blocked at parser boundary and strictly discarded.
            </p>
          </div>

          {/* 2. No emails */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <span className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center mb-2">
              ✕
            </span>
            <h3 className="text-xs font-bold text-slate-900">
              No Email Addresses
            </h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              All RFC-822 email patterns are automatically scrubbed from incoming textual streams.
            </p>
          </div>

          {/* 3. No exact addresses */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <span className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center mb-2">
              ✕
            </span>
            <h3 className="text-xs font-bold text-slate-900">
              No Exact Addresses
            </h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Geographic coordinates and door-level pin locations are rounded to broad state/district zones.
            </p>
          </div>

          {/* 4. Hashed identifiers */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center mb-2">
              ✓
            </span>
            <h3 className="text-xs font-bold text-slate-900">
              Hashed User Identifiers
            </h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Public account handles are irreversibly hashed using salted SHA-256 before statistical analysis.
            </p>
          </div>

          {/* 5. Aggregated demographic information */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center mb-2">
              ✓
            </span>
            <h3 className="text-xs font-bold text-slate-900">
              Aggregated Demographics
            </h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Demographic charts represent aggregate cohorts (k ≥ 100), never individual-level records.
            </p>
          </div>

          {/* 6. Role-based access control */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center mb-2">
              ✓
            </span>
            <h3 className="text-xs font-bold text-slate-900">
              Role-Based Access (RBAC)
            </h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Tiered clearance levels ensure raw forensic drill-downs are limited strictly to verified desks.
            </p>
          </div>

          {/* 7. Limited retention */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center mb-2">
              ✓
            </span>
            <h3 className="text-xs font-bold text-slate-900">
              Limited Data Retention
            </h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Temporary post streams are automatically purged after 7 days; only aggregated trend counters persist.
            </p>
          </div>

          {/* 8. Maintained audit logs */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center mb-2">
              ✓
            </span>
            <h3 className="text-xs font-bold text-slate-900">
              Immutable Audit Logs
            </h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Every query, alert dismissal, and exported report is logged to a write-only audit trail for oversight.
            </p>
          </div>
        </div>
      </div>

      {/* SYSTEM PREFERENCES */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <h2 className="text-base font-extrabold text-slate-900 font-serif pb-3 border-b border-slate-100">
          Operator Console Preferences
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language Selection */}
          <div className="p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Languages className="w-4 h-4 text-orange-600" />
              <h3 className="text-xs font-bold text-slate-900">Interface Language</h3>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  language === 'en'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                English (Standard)
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  language === 'hi'
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                हिन्दी (Hindi)
              </button>
            </div>
          </div>

          {/* Bandwidth / Lite Mode */}
          <div className="p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">Bandwidth Profile</h3>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setMode('normal')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  mode === 'normal'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Normal (Rich Visuals)
              </button>
              <button
                onClick={() => setMode('lite')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  mode === 'lite'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Lite Mode (Low Bandwidth)
              </button>
            </div>
          </div>

          {/* Audio Chime on High Risk Alerts */}
          <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-slate-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-900">Audio Chime on Critical Alerts</h3>
                <p className="text-[11px] text-slate-500">Play alert tone when rumor risk score exceeds 85%</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={audioAlerts}
              onChange={(e) => setAudioAlerts(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
          </div>

          {/* Pipeline Polling Interval */}
          <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-slate-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-900">Stream Sampling Frequency</h3>
                <p className="text-[11px] text-slate-500">Interval for ingesting incoming stream batches</p>
              </div>
            </div>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-mono"
            >
              <option value="15s">15 seconds</option>
              <option value="30s">30 seconds</option>
              <option value="60s">60 seconds</option>
            </select>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSavePreferences}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
