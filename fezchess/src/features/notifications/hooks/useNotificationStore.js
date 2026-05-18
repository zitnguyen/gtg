import { useSyncExternalStore } from "react";
import {
  subscribe,
  getSnapshot,
} from "../stores/notificationStore";

export const useNotificationStore = (selector = (state) => state) => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return selector(snapshot);
};

export const useNotificationSummary = () =>
  useNotificationStore((state) => ({
    unreadCount: state.unreadCount,
    latestUnreadCreatedAt: state.latestUnreadCreatedAt,
    loaded: state.loaded,
  }));

export const useNotificationItems = () =>
  useNotificationStore((state) => state.items);
