export const SHORTCUTS = Object.freeze({
  COMMAND_PALETTE: { key: "k", meta: true },
  TOGGLE_SIDEBAR: { key: "b", meta: true },
  QUICK_SEARCH: { key: "/", meta: false, requireFreeFocus: true },
  CLOSE_OVERLAY: { key: "Escape" },
});

export const isPlatformMac =
  typeof navigator !== "undefined" &&
  /(Mac|iPhone|iPad)/i.test(navigator.platform || "");

export const formatShortcut = (shortcut) => {
  if (!shortcut) return "";
  const modifier = shortcut.meta ? (isPlatformMac ? "⌘" : "Ctrl") : "";
  const key = shortcut.key === " " ? "Space" : shortcut.key.toUpperCase();
  return modifier ? `${modifier}${shortcut.key.length === 1 ? "" : "+"}${key}` : key;
};

export const matchesShortcut = (event, shortcut) => {
  if (!event || !shortcut) return false;
  if (shortcut.key === "Escape") return event.key === "Escape";
  const expectedKey = String(shortcut.key || "").toLowerCase();
  const actualKey = String(event.key || "").toLowerCase();
  if (expectedKey !== actualKey) return false;
  const metaPressed = event.metaKey || event.ctrlKey;
  if (shortcut.meta) return metaPressed;
  return !metaPressed;
};
