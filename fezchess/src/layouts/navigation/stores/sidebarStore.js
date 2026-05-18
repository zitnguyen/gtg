const STORAGE_KEY = "zchess.sidebarCollapsed";

const ensureBrowser = () => typeof window !== "undefined";

const readPersistedCollapsed = () => {
  if (!ensureBrowser()) return true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw === "1";
  } catch {
    return true;
  }
};

const persistCollapsed = (value) => {
  if (!ensureBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // Silent.
  }
};

let state = {
  collapsed: readPersistedCollapsed(),
  mobileOpen: false,
  paletteOpen: false,
};

const listeners = new Set();
const emit = () => {
  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      console.error("[sidebarStore] listener error", error);
    }
  }
};

const setState = (patch) => {
  state = { ...state, ...patch };
  emit();
};

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSnapshot = () => state;

export const toggleCollapsed = () => {
  const next = !state.collapsed;
  persistCollapsed(next);
  setState({ collapsed: next });
};

export const setCollapsed = (value) => {
  const next = Boolean(value);
  persistCollapsed(next);
  setState({ collapsed: next });
};

export const openMobileDrawer = () => setState({ mobileOpen: true });
export const closeMobileDrawer = () => setState({ mobileOpen: false });
export const setMobileOpen = (value) => setState({ mobileOpen: Boolean(value) });

export const openPalette = () => setState({ paletteOpen: true });
export const closePalette = () => setState({ paletteOpen: false });
export const togglePalette = () => setState({ paletteOpen: !state.paletteOpen });
