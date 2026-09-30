import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiOptions {
  refreshInterval?: number; // ms, 0 = no auto-refresh
  immediate?: boolean;
  // When the fetcher is an inline closure over filter state, pass the same values
  // here so the hook knows when a genuine re-fetch is required instead of firing
  // on every render.
  deps?: ReadonlyArray<any>;
  // Suppress the loading flag on background refreshes so a live-updating panel
  // does not flash a spinner every tick.
  keepPrevious?: boolean;
}

interface UseApiState<T> {
  data: T | null;
  isLive: boolean;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useApi<T>(
  fetcher: () => Promise<{ data: T; isLive: boolean }>,
  options: UseApiOptions = {}
): UseApiState<T> {
  const { refreshInterval = 0, immediate = true, deps = [], keepPrevious = false } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const hasDataRef = useRef(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    // On a background refresh of already-rendered data we skip the spinner.
    if (!(keepPrevious && hasDataRef.current)) setLoading(true);
    try {
      const result = await fetcherRef.current();
      if (mountedRef.current) {
        setData(result.data);
        hasDataRef.current = true;
        setIsLive(result.isLive);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (e: any) {
      if (mountedRef.current) setError(e.message || 'Unknown error');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keepPrevious, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) run();
    if (refreshInterval > 0) {
      timerRef.current = setInterval(run, refreshInterval);
    }
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [run, immediate, refreshInterval]);

  return { data, isLive, loading, error, lastUpdated, refresh: run };
}
