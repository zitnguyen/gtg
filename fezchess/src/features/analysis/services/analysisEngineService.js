// Lightweight cache + helper functions used by the analysis page. We keep
// this stateless so it can be called from anywhere without dragging in
// React / store deps.

const evaluationCache = new Map();
const CACHE_LIMIT = 200;

const trimCache = () => {
  if (evaluationCache.size <= CACHE_LIMIT) return;
  const overflow = evaluationCache.size - CACHE_LIMIT;
  const keys = evaluationCache.keys();
  for (let i = 0; i < overflow; i += 1) {
    const next = keys.next();
    if (next.done) break;
    evaluationCache.delete(next.value);
  }
};

export const cacheEvaluation = (fen, lines) => {
  if (!fen || !lines) return;
  evaluationCache.set(fen, { lines, savedAt: Date.now() });
  trimCache();
};

export const readEvaluation = (fen) => evaluationCache.get(fen) || null;

export const clearAnalysisCache = () => evaluationCache.clear();
