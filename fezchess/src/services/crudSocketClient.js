/**
 * Task: Subscribe to backend `api:crud` Socket.IO events
 * Content: Thin wrapper + DOM event for pages that are not React-aware.
 * Author: DucManh-BlueOC
 */
import authService from "./authService";
import { getRealtimeSocket } from "./realtimeSocket";

/** Must match zchess-be `emitApiCrud` event name. */
export const API_CRUD_SOCKET_EVENT = "api:crud";

/** Fired on `window` when a CRUD mutation is broadcast (detail = server payload). */
export const API_CRUD_WINDOW_EVENT = "fezchess:api-crud";

const ensureSocket = () => {
  const accessToken = authService.getCurrentUser()?.accessToken;
  if (!accessToken) return null;
  return getRealtimeSocket(accessToken);
};

/**
 * @param {(payload: Record<string, unknown>) => void} handler
 * @returns {() => void}
 */
export const subscribeApiCrud = (handler) => {
  if (typeof handler !== "function") return () => {};
  const socket = ensureSocket();
  if (!socket) return () => {};
  const wrapped = (payload) => {
    try {
      handler(payload);
    } catch {
      // ignore consumer errors
    }
  };
  socket.on(API_CRUD_SOCKET_EVENT, wrapped);
  return () => {
    socket.off(API_CRUD_SOCKET_EVENT, wrapped);
  };
};
