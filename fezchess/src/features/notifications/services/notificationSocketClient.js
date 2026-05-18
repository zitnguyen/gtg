import authService from "../../../services/authService";
import { getRealtimeSocket } from "../../../services/realtimeSocket";

export const NOTIFICATION_EVENTS = Object.freeze({
  NEW: "notification:new",
  BROADCAST: "notification:broadcast",
});

const ensureSocket = () => {
  const accessToken = authService.getCurrentUser()?.accessToken;
  if (!accessToken) return null;
  return getRealtimeSocket(accessToken);
};

export const subscribeNotificationEvent = (event, handler) => {
  if (typeof handler !== "function") return () => {};
  const socket = ensureSocket();
  if (!socket) return () => {};
  socket.on(event, handler);
  return () => {
    socket.off(event, handler);
  };
};

export const subscribeAllNotificationEvents = (handler) => {
  const unsubscribers = [
    subscribeNotificationEvent(NOTIFICATION_EVENTS.NEW, (payload) =>
      handler({ event: NOTIFICATION_EVENTS.NEW, payload }),
    ),
    subscribeNotificationEvent(NOTIFICATION_EVENTS.BROADCAST, (payload) =>
      handler({ event: NOTIFICATION_EVENTS.BROADCAST, payload }),
    ),
  ];
  return () => {
    unsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe?.();
      } catch {
        // Silent: socket may already be torn down.
      }
    });
  };
};
