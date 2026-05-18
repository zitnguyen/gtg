import authService from "../../../services/authService";
import chatApiService from "../../../features/chat/services/chatApiService";
import {
  CHAT_EVENTS,
  subscribeChatEvent,
  subscribeSocketLifecycle,
} from "../../../features/chat/services/chatSocketClient";

const HYDRATE_TTL_MS = 5000;

let state = {
  totalUnread: 0,
  bySender: {},
  loaded: false,
  loading: false,
  lastHydratedAt: 0,
  error: null,
};

const listeners = new Set();
let activeSubscriptions = 0;
let unsubscribeIncoming = null;
let unsubscribeLifecycle = null;
let inFlight = null;

const emit = () => {
  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      console.error("[chatUnreadStore] listener error", error);
    }
  }
};

const setState = (patch) => {
  state = { ...state, ...patch };
  emit();
};

const computeTotalFromBySender = (bySender) => {
  let total = 0;
  for (const value of Object.values(bySender || {})) {
    total += Number(value || 0);
  }
  return total;
};

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSnapshot = () => state;

export const hydrate = async ({ force = false } = {}) => {
  if (
    !force &&
    state.loaded &&
    Date.now() - state.lastHydratedAt < HYDRATE_TTL_MS
  ) {
    return state;
  }
  if (inFlight) return inFlight;

  setState({ loading: true, error: null });
  inFlight = (async () => {
    try {
      const data = await chatApiService.fetchUnreadSummary();
      const bySender =
        data && typeof data.bySender === "object" && data.bySender !== null
          ? data.bySender
          : {};
      const total = Number(
        data?.totalUnread ?? computeTotalFromBySender(bySender),
      );
      setState({
        totalUnread: total,
        bySender,
        loaded: true,
        loading: false,
        lastHydratedAt: Date.now(),
        error: null,
      });
    } catch (error) {
      setState({ loading: false, error });
    } finally {
      inFlight = null;
    }
    return state;
  })();

  return inFlight;
};

export const clearForSender = (senderId) => {
  if (!senderId) return;
  const key = String(senderId);
  if (!state.bySender[key]) return;
  const nextBySender = { ...state.bySender, [key]: 0 };
  setState({
    bySender: nextBySender,
    totalUnread: computeTotalFromBySender(nextBySender),
  });
};

export const ingestIncomingMessage = (payload) => {
  if (!payload || !payload.senderId) return;
  const currentUserId = authService.getCurrentUser()?._id;
  if (currentUserId && String(payload.senderId) === String(currentUserId)) {
    return;
  }
  const key = String(payload.senderId);
  const current = Number(state.bySender[key] || 0);
  const nextBySender = { ...state.bySender, [key]: current + 1 };
  setState({
    bySender: nextBySender,
    totalUnread: computeTotalFromBySender(nextBySender),
  });
};

const ensureSubscription = () => {
  if (unsubscribeIncoming) return;
  unsubscribeIncoming = subscribeChatEvent(
    CHAT_EVENTS.MESSAGE_NEW,
    ingestIncomingMessage,
  );
  unsubscribeLifecycle = subscribeSocketLifecycle({
    onConnect: () => hydrate({ force: true }).catch(() => {}),
    onReconnect: () => hydrate({ force: true }).catch(() => {}),
  });
};

const releaseSubscription = () => {
  if (unsubscribeIncoming) {
    unsubscribeIncoming();
    unsubscribeIncoming = null;
  }
  if (unsubscribeLifecycle) {
    unsubscribeLifecycle();
    unsubscribeLifecycle = null;
  }
};

export const acquire = () => {
  activeSubscriptions += 1;
  ensureSubscription();
  hydrate().catch(() => {});
  return () => {
    activeSubscriptions = Math.max(0, activeSubscriptions - 1);
    if (activeSubscriptions === 0) releaseSubscription();
  };
};

export const reset = () => {
  state = {
    totalUnread: 0,
    bySender: {},
    loaded: false,
    loading: false,
    lastHydratedAt: 0,
    error: null,
  };
  emit();
};
