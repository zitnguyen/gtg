import { useSyncExternalStore } from "react";
import {
  subscribe,
  getSnapshot,
  toggleCollapsed,
  setCollapsed,
  openMobileDrawer,
  closeMobileDrawer,
  setMobileOpen,
  openPalette,
  closePalette,
  togglePalette,
} from "../stores/sidebarStore";

export const useSidebarStore = (selector = (state) => state) => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return selector(snapshot);
};

export const useSidebarActions = () => ({
  toggleCollapsed,
  setCollapsed,
  openMobileDrawer,
  closeMobileDrawer,
  setMobileOpen,
  openPalette,
  closePalette,
  togglePalette,
});
