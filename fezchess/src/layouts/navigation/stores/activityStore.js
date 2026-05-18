let state = {
  activities: new Map(),
  pulse: 0,
};

const listeners = new Set();
const emit = () => {
  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      console.error("[activityStore] listener error", error);
    }
  }
};

const buildSnapshot = () => ({
  busy: state.activities.size > 0,
  count: state.activities.size,
  labels: [...state.activities.values()],
  pulse: state.pulse,
});

let snapshotCache = buildSnapshot();

const refreshSnapshot = () => {
  snapshotCache = buildSnapshot();
};

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSnapshot = () => snapshotCache;

export const startActivity = (key, label = "Đang đồng bộ...") => {
  if (!key) return () => {};
  state.activities.set(String(key), label);
  state.pulse = (state.pulse + 1) % 1024;
  refreshSnapshot();
  emit();
  return () => endActivity(key);
};

export const endActivity = (key) => {
  if (!key) return;
  if (!state.activities.delete(String(key))) return;
  state.pulse = (state.pulse + 1) % 1024;
  refreshSnapshot();
  emit();
};

export const reset = () => {
  state = { activities: new Map(), pulse: 0 };
  refreshSnapshot();
  emit();
};
