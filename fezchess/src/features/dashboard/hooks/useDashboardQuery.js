import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchKey,
  invalidateKey,
  isFresh,
  readKey,
  subscribeKey,
} from "../services/dashboardCache";

const DEFAULT_TTL = 60_000;

const makeKey = (key) => {
  if (Array.isArray(key)) return key.filter(Boolean).join("|");
  return String(key || "");
};

/**
 * Lightweight SWR-like hook backed by `dashboardCache`.
 *
 * - Returns cached value immediately if available (stale-while-revalidate).
 * - Dedupes concurrent fetchers across components.
 * - Skips fetch when `enabled === false` or key falsy.
 * - Refetches when revalidating after `ttl` window expires.
 */
export default function useDashboardQuery(key, fetcher, options = {}) {
  const { enabled = true, ttl = DEFAULT_TTL, refreshInterval = 0 } = options;
  const cacheKey = makeKey(key);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [state, setState] = useState(() => {
    const entry = readKey(cacheKey);
    return entry
      ? { data: entry.data, error: entry.error, isLoading: false, isValidating: false }
      : { data: null, error: null, isLoading: enabled, isValidating: false };
  });

  const runFetch = useCallback(
    async ({ silent = false } = {}) => {
      if (!cacheKey || !enabled) return null;
      if (!silent) {
        setState((prev) => ({
          ...prev,
          isValidating: true,
          isLoading: prev.data == null,
        }));
      }
      try {
        const value = await fetchKey(cacheKey, () => fetcherRef.current(), ttl);
        return value;
      } catch (error) {
        // error already stored in cache, state subscriber will pick up
        return null;
      }
    },
    [cacheKey, enabled, ttl],
  );

  useEffect(() => {
    if (!cacheKey || !enabled) return undefined;
    const unsubscribe = subscribeKey(cacheKey, () => {
      const entry = readKey(cacheKey);
      setState((prev) => ({
        data: entry?.data ?? prev.data,
        error: entry?.error ?? null,
        isLoading: false,
        isValidating: false,
      }));
    });
    if (!isFresh(cacheKey)) {
      runFetch();
    } else {
      const entry = readKey(cacheKey);
      setState({
        data: entry?.data ?? null,
        error: entry?.error ?? null,
        isLoading: false,
        isValidating: false,
      });
    }
    return unsubscribe;
  }, [cacheKey, enabled, runFetch]);

  useEffect(() => {
    if (!refreshInterval || !cacheKey || !enabled) return undefined;
    const timer = window.setInterval(() => {
      runFetch({ silent: true });
    }, refreshInterval);
    return () => window.clearInterval(timer);
  }, [cacheKey, enabled, refreshInterval, runFetch]);

  const refetch = useCallback(() => {
    if (!cacheKey) return Promise.resolve(null);
    invalidateKey(cacheKey);
    return runFetch();
  }, [cacheKey, runFetch]);

  return {
    data: state.data,
    error: state.error,
    isLoading: state.isLoading,
    isValidating: state.isValidating,
    refetch,
  };
}
