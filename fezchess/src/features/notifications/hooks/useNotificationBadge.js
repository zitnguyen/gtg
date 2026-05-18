import { useEffect } from "react";
import authService from "../../../services/authService";
import { useNotificationSocket } from "./useNotificationSocket";
import { useNotificationStore } from "./useNotificationStore";
import { hydrate } from "../stores/notificationStore";

export const useNotificationBadge = ({ initialLimit = 8 } = {}) => {
  const currentUser = authService.getCurrentUser();
  useNotificationSocket();

  const { unreadCount, latestUnreadCreatedAt, loaded } = useNotificationStore(
    (state) => ({
      unreadCount: state.unreadCount,
      latestUnreadCreatedAt: state.latestUnreadCreatedAt,
      loaded: state.loaded,
    }),
  );

  useEffect(() => {
    if (!currentUser?._id && !currentUser?.userId) return;
    hydrate({ limit: initialLimit }).catch(() => {});
  }, [currentUser?._id, currentUser?.userId, initialLimit]);

  return {
    unreadCount,
    latestUnreadCreatedAt,
    loaded,
  };
};
