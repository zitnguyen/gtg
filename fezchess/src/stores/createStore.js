// Tiny vanilla pub/sub store factory we already use across notifications, chat
// unread, sidebar, CMS editor. Centralising it avoids re-implementing the same
// shape per feature.

export const createStore = (initialState) => {
  let state = typeof initialState === "function" ? initialState() : initialState;
  const listeners = new Set();

  const getState = () => state;

  const setState = (updater) => {
    const next =
      typeof updater === "function" ? updater(state) : { ...state, ...updater };
    if (next === state) return;
    state = next;
    listeners.forEach((listener) => listener(state));
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { getState, setState, subscribe };
};

export const shallowEqual = (a, b) => {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null) return false;
  if (typeof b !== "object" || b === null) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
};
