import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyTheme,
  getStoredTheme,
  getSystemTheme,
  resolveInitialTheme,
} from "../lib/theme";

const ThemeContext = createContext({
  theme: "light",
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

const LIGHT_MIGRATION_KEY = "zchess-theme-default-light-v1";

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => resolveInitialTheme());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(LIGHT_MIGRATION_KEY)) {
      localStorage.setItem(LIGHT_MIGRATION_KEY, "1");
      localStorage.setItem("theme", "light");
      setThemeState("light");
      applyTheme("light");
      return;
    }
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event) => {
      if (!getStoredTheme()) {
        setThemeState(event.matches ? "dark" : "light");
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((next) => {
    setThemeState(next === "dark" ? "dark" : "light");
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export { getSystemTheme, resolveInitialTheme };
