import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useSidebarStore,
  useSidebarActions,
} from "../hooks/useSidebarStore";
import { useResolvedMenu } from "../hooks/useResolvedMenu";

const RECENT_KEY = "zchess.commandPaletteRecent";
const RECENT_MAX = 5;

const readRecent = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistRecent = (keys) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(keys.slice(0, RECENT_MAX)));
  } catch {
    // Silent.
  }
};

const fuzzyMatch = (item, query) => {
  if (!query) return true;
  const text = `${item.label || ""} ${item.to || ""}`.toLowerCase();
  const lowered = query.toLowerCase();
  return text.includes(lowered);
};

export const useCommandPalette = ({ role } = {}) => {
  const open = useSidebarStore((state) => state.paletteOpen);
  const { closePalette } = useSidebarActions();
  const navigate = useNavigate();
  const { flatItems } = useResolvedMenu(role);
  const [query, setQuery] = useState("");
  const [recentKeys, setRecentKeys] = useState(readRecent);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const filteredItems = useMemo(() => {
    const search = query.trim();
    return flatItems.filter((item) => fuzzyMatch(item, search));
  }, [flatItems, query]);

  const recentItems = useMemo(() => {
    if (query.trim()) return [];
    const map = new Map(flatItems.map((item) => [item.key, item]));
    return recentKeys.map((key) => map.get(key)).filter(Boolean);
  }, [flatItems, recentKeys, query]);

  const handleSelect = (item) => {
    if (!item?.to) return;
    setRecentKeys((prev) => {
      const next = [item.key, ...prev.filter((key) => key !== item.key)].slice(
        0,
        RECENT_MAX,
      );
      persistRecent(next);
      return next;
    });
    closePalette();
    navigate(item.to);
  };

  return {
    open,
    query,
    setQuery,
    filteredItems,
    recentItems,
    onSelect: handleSelect,
    onClose: closePalette,
  };
};
