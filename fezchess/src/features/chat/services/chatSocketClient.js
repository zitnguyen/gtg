import authService from "../../../services/authService";
import { getRealtimeSocket } from "../../../services/realtimeSocket";

export const CHAT_EVENTS = Object.freeze({
  MESSAGE_NEW: "message:new",
  MESSAGE_SENT: "message:sent",
  MESSAGE_READ: "message:read",
  MESSAGE_TYPING: "message:typing",
  MESSAGE_STOP_TYPING: "message:stopTyping",
  MESSAGE_MARK_READ: "message:markRead",
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  USER_STATUS: "user:status",
});

const acquireSocket = () => {
  const token = authService.getCurrentUser()?.accessToken;
  if (!token) return null;
  return getRealtimeSocket(token);
};

export const getChatSocket = () => acquireSocket();

export const subscribeChatEvent = (event, handler) => {
  if (!event || typeof handler !== "function") return () => {};
  const socket = acquireSocket();
  if (!socket) return () => {};
  socket.on(event, handler);
  return () => {
    socket.off(event, handler);
  };
};

export const emitChatEvent = (event, payload) => {
  if (!event) return;
  const socket = acquireSocket();
  if (!socket) return;
  socket.emit(event, payload || {});
};

export const subscribeSocketLifecycle = ({
  onConnect,
  onDisconnect,
  onReconnect,
} = {}) => {
  const socket = acquireSocket();
  if (!socket) return () => {};

  const cleanups = [];

  if (typeof onConnect === "function") {
    socket.on("connect", onConnect);
    cleanups.push(() => socket.off("connect", onConnect));
  }
  if (typeof onDisconnect === "function") {
    socket.on("disconnect", onDisconnect);
    cleanups.push(() => socket.off("disconnect", onDisconnect));
  }
  if (typeof onReconnect === "function" && socket.io) {
    socket.io.on("reconnect", onReconnect);
    cleanups.push(() => socket.io.off("reconnect", onReconnect));
  }

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
};
