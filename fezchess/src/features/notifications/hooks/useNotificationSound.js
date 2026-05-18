import { useEffect, useRef } from "react";
import authService from "../../../services/authService";
import {
  initNotificationSound,
  playNotificationSound,
} from "../../../utils/notificationSound";
import { useNotificationStore } from "./useNotificationStore";

const ALLOWED_SOUND_ROLES = new Set(["teacher", "parent", "student"]);

export const useNotificationSound = () => {
  const currentUser = authService.getCurrentUser();
  const { unreadCount, latestUnreadCreatedAt } = useNotificationStore(
    (state) => ({
      unreadCount: state.unreadCount,
      latestUnreadCreatedAt: state.latestUnreadCreatedAt,
    }),
  );
  const previousUnreadRef = useRef(null);
  const previousLatestRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    initNotificationSound();
  }, []);

  useEffect(() => {
    const role = String(currentUser?.role || "").toLowerCase();
    if (!ALLOWED_SOUND_ROLES.has(role)) {
      return;
    }
    if (!initializedRef.current) {
      initializedRef.current = true;
      previousUnreadRef.current = unreadCount;
      previousLatestRef.current = latestUnreadCreatedAt;
      return;
    }

    const previousUnread = Number(previousUnreadRef.current || 0);
    const isNewUnread =
      unreadCount > previousUnread ||
      (latestUnreadCreatedAt &&
        previousLatestRef.current &&
        new Date(latestUnreadCreatedAt).getTime() >
          new Date(previousLatestRef.current).getTime());
    const shouldPlay =
      typeof document !== "undefined" &&
      document.visibilityState === "visible" &&
      document.hasFocus();

    if (isNewUnread && shouldPlay) {
      playNotificationSound();
    }

    previousUnreadRef.current = unreadCount;
    previousLatestRef.current = latestUnreadCreatedAt;
  }, [unreadCount, latestUnreadCreatedAt, currentUser?.role]);
};
