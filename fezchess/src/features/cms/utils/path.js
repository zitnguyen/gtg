// Tiny utilities for working with deeply nested CMS state via dot-paths.
// Pure functions, no React dep, fully tree-shakable.

export const splitPath = (path) =>
  String(path || "")
    .split(".")
    .filter(Boolean);

export const getByPath = (obj, path, fallback = undefined) => {
  if (!obj || !path) return obj ?? fallback;
  const keys = splitPath(path);
  let cursor = obj;
  for (const key of keys) {
    if (cursor == null) return fallback;
    cursor = cursor[key];
  }
  return cursor === undefined ? fallback : cursor;
};

export const setByPath = (obj, path, value) => {
  const keys = splitPath(path);
  if (keys.length === 0) return value;
  const root = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let cursor = root;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    const existing = cursor[key];
    cursor[key] = Array.isArray(existing)
      ? [...existing]
      : { ...(existing || {}) };
    cursor = cursor[key];
  }
  cursor[keys[keys.length - 1]] = value;
  return root;
};

export const deletePath = (obj, path) => {
  const keys = splitPath(path);
  if (keys.length === 0) return obj;
  const root = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let cursor = root;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    const existing = cursor[key];
    if (existing == null) return root;
    cursor[key] = Array.isArray(existing)
      ? [...existing]
      : { ...(existing || {}) };
    cursor = cursor[key];
  }
  delete cursor[keys[keys.length - 1]];
  return root;
};

export const deepMerge = (base, incoming) => {
  if (incoming == null || typeof incoming !== "object") return base;
  if (base == null || typeof base !== "object") return incoming;
  if (Array.isArray(base) || Array.isArray(incoming)) return incoming;
  const out = { ...base };
  Object.keys(incoming).forEach((key) => {
    const baseValue = base[key];
    const incomingValue = incoming[key];
    if (
      baseValue &&
      incomingValue &&
      typeof baseValue === "object" &&
      typeof incomingValue === "object" &&
      !Array.isArray(baseValue) &&
      !Array.isArray(incomingValue)
    ) {
      out[key] = deepMerge(baseValue, incomingValue);
    } else {
      out[key] = incomingValue;
    }
  });
  return out;
};

export const stableJson = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
};
