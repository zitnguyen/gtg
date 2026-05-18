import notificationApiService from "../features/notifications/services/notificationApiService";
import { subscribeAllNotificationEvents } from "../features/notifications/services/notificationSocketClient";
import {
  hydrate,
  getSnapshot,
} from "../features/notifications/stores/notificationStore";

const HYDRATE_TTL_MS = 5000;

const buildLegacyResponseFromState = () => {
  const snapshot = getSnapshot();
  return {
    items: snapshot.items,
    unreadCount: snapshot.unreadCount,
    latestUnreadCreatedAt: snapshot.latestUnreadCreatedAt,
  };
};

const notificationService = {
  create: (payload) => notificationApiService.create(payload),
  getMine: async ({ force = false } = {}) => {
    const snapshot = getSnapshot();
    if (
      !force &&
      snapshot.loaded &&
      Date.now() - snapshot.lastHydratedAt < HYDRATE_TTL_MS
    ) {
      return buildLegacyResponseFromState();
    }
    try {
      await hydrate({ force, limit: 0 });
    } catch (error) {
      if (snapshot.loaded) {
        return buildLegacyResponseFromState();
      }
      throw error;
    }
    return buildLegacyResponseFromState();
  },
  getById: (id) => notificationApiService.getById(id),
  markRead: (id, isRead = true) => notificationApiService.markRead(id, isRead),
  markAllRead: () => notificationApiService.markAllRead(),
  subscribeRealtime: (handler) => {
    if (typeof handler !== "function") return () => {};
    return subscribeAllNotificationEvents((event) => {
      handler(event?.payload || {});
    });
  },
};

export default notificationService;
