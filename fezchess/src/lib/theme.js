export const THEME_STORAGE_KEY = "theme";

export function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getStoredTheme() {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return null;
}

export function resolveInitialTheme() {
  return getStoredTheme() ?? "light";
}

export function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const resolved = theme === "dark" ? "dark" : "light";
  const root = document.documentElement;
  const isDark = resolved === "dark";

  root.classList.toggle("dark", isDark);
  root.setAttribute("data-theme", resolved);
  root.style.colorScheme = resolved;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, resolved);
  } catch {
    /* private mode */
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", isDark ? "#0f172a" : "#ffffff");
  }
}
