import { io } from "socket.io-client";

let socketInstance = null;

const resolveSocketUrl = () => {
  if (import.meta.env.DEV) {
    if (typeof window !== "undefined") {
      const { protocol, hostname } = window.location;
      if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
        const scheme = protocol === "https:" ? "https" : "http";
        return `${scheme}://${hostname}:5000`;
      }
    }
    return "http://localhost:5000";
  }
  const explicitUrl = import.meta.env.VITE_SOCKET_URL;
  if (explicitUrl) return explicitUrl;
  return "http://localhost:5000";
};

const readPersistedAccessToken = () => {
  if (typeof window === "undefined") return null;
  const userStr = window.localStorage.getItem("user");
  if (!userStr || userStr === "undefined") return null;
  try {
    const parsed = JSON.parse(userStr);
    return parsed?.accessToken || null;
  } catch {
    return null;
  }
};

const attachLifecycleHandlers = (socket) => {
  socket.io.on("reconnect_attempt", () => {
    const fresh = readPersistedAccessToken();
    if (fresh) {
      socket.auth = { token: fresh };
    }
  });
};

export const getRealtimeSocket = (token) => {
  const usableToken = token || readPersistedAccessToken();
  if (!usableToken) return null;
  if (socketInstance && socketInstance.connected) return socketInstance;
  if (socketInstance) {
    socketInstance.auth = { token: usableToken };
    socketInstance.connect();
    return socketInstance;
  }
  socketInstance = io(resolveSocketUrl(), {
    transports: ["websocket", "polling"],
    withCredentials: true,
    autoConnect: true,
    auth: { token: usableToken },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });
  attachLifecycleHandlers(socketInstance);
  return socketInstance;
};

export const disconnectRealtimeSocket = () => {
  if (!socketInstance) return;
  socketInstance.disconnect();
  socketInstance = null;
};
