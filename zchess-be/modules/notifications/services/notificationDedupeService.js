const DEFAULT_TTL_MS = Number(process.env.NOTIF_DEDUPE_TTL_MS || 5000);
const cache = new Map();

const sweep = (now) => {
  for (const [key, expiresAt] of cache.entries()) {
    if (expiresAt <= now) cache.delete(key);
  }
};

const buildDedupeKey = ({ title, content, targetPath, recipientIds = [], type = "" }) => {
  const recipientPart = [...recipientIds]
    .map((id) => String(id || "").trim())
    .filter(Boolean)
    .sort()
    .join(",");
  return [
    String(type || "").trim().toLowerCase(),
    String(title || "").trim().toLowerCase(),
    String(content || "").trim().toLowerCase(),
    String(targetPath || "").trim().toLowerCase(),
    recipientPart,
  ].join("|");
};

const shouldSkip = (key, ttlMs = DEFAULT_TTL_MS) => {
  if (!key) return false;
  const now = Date.now();
  sweep(now);
  if (cache.has(key)) return true;
  cache.set(key, now + ttlMs);
  return false;
};

const reset = () => {
  cache.clear();
};

module.exports = {
  buildDedupeKey,
  shouldSkip,
  reset,
};
