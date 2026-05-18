// In-memory query cache with TTL + dedupe.
// Backed by useDashboardQuery hook. Lightweight SWR-like layer that does
// not require a new dependency and can be swapped for React Query later.

const DEFAULT_TTL = 60_000;
const cache = new Map();
const inflight = new Map();
const subscribers = new Map();

const now = () => Date.now();

const notify = (key) => {
  const set = subscribers.get(key);
  if (!set) return;
  set.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      // listener should be defensive
      console.error("dashboardCache listener error", err);
    }
  });
};

export const subscribeKey = (key, listener) => {
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key).add(listener);
  return () => {
    const set = subscribers.get(key);
    if (!set) return;
    set.delete(listener);
    if (set.size === 0) subscribers.delete(key);
  };
};

export const readKey = (key) => cache.get(key) || null;

export const writeKey = (key, value, ttl = DEFAULT_TTL) => {
  cache.set(key, {
    data: value,
    error: null,
    expiresAt: now() + ttl,
    updatedAt: now(),
  });
  notify(key);
};

export const writeKeyError = (key, error) => {
  const existing = cache.get(key);
  cache.set(key, {
    data: existing?.data ?? null,
    error,
    expiresAt: existing?.expiresAt ?? 0,
    updatedAt: now(),
  });
  notify(key);
};

export const isFresh = (key) => {
  const entry = cache.get(key);
  if (!entry) return false;
  return entry.expiresAt > now();
};

export const fetchKey = async (key, fetcher, ttl = DEFAULT_TTL) => {
  if (inflight.has(key)) {
    return inflight.get(key);
  }
  const promise = Promise.resolve()
    .then(() => fetcher())
    .then((value) => {
      writeKey(key, value, ttl);
      return value;
    })
    .catch((error) => {
      writeKeyError(key, error);
      throw error;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
};

export const invalidateKey = (key) => {
  cache.delete(key);
  notify(key);
};

export const invalidatePrefix = (prefix) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
  for (const key of subscribers.keys()) {
    if (key.startsWith(prefix)) notify(key);
  }
};
