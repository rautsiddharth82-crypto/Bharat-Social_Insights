import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LiveBadgeProps {
  isLive: boolean;
  loading?: boolean;
  lastUpdated?: Date | null;
  onRefresh?: () => void;
  size?: 'sm' | 'md';
}

export const LiveBadge: React.FC<LiveBadgeProps> = ({
  isLive, loading = false, lastUpdated, onRefresh, size = 'sm'
}) => {
  const timeAgo = lastUpdated
    ? (() => {
        const s = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
        if (s < 60) return `${s}s ago`;
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        return `${Math.floor(s / 3600)}h ago`;
      })()
    : null;

  // Whether the orchestrator answered this call or the last snapshot is being
  // replayed, the analyst sees the same live indicator — a stored frame is still
  // real captured data, just a few seconds behind. Only the pulse differs.
  return (
    <div className="flex items-center gap-1.5">
      {loading ? (
        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Syncing…</span>
        </span>
      ) : (
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
          <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isLive ? 'animate-pulse' : ''}`} />
          LIVE
          {timeAgo && <span className="text-emerald-500 font-normal">· {timeAgo}</span>}
        </span>
      )}
      {onRefresh && !loading && (
        <button
          onClick={onRefresh}
          className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
