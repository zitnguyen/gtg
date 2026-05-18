import notificationApiService from "../services/notificationApiService";

const HYDRATE_TTL_MS = 5000;
const INGEST_DEDUPE_TTL_MS = 4000;

const ensureBrowser = () => typeof window !== "undefined";

const createInitialState = () => ({
  items: [],
  byId: {},
  unreadCount: 0,
  latestUnreadCreatedAt: null,
  loaded: false,
  loading: false,
  loadingMore: false,
  hasMore: true,
  cursor: null,
  error: null,
  lastHydratedAt: 0,
});

let state = createInitialState();
const listeners = new Set();
const recentIngest = new Map();
let hydrateInFlight = null;

const emit = () => {
  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      console.error("[notificationStore] listener error", error);
    }
  }
};

const setState = (patch) => {
  state = { ...state, ...patch };
  emit();
};

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSnapshot = () => state;

const sortItemsDesc = (items) =>
  [...items].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
  );

const upsertItem = (existingItems, newItem) => {
  if (!newItem || !newItem.id) return existingItems;
  const id = String(newItem.id);
  const indexedExisting = existingItems.find((item) => String(item.id) === id);
  if (!indexedExisting) {
    return sortItemsDesc([newItem, ...existingItems]);
  }
  return existingItems.map((item) =>
    String(item.id) === id ? { ...indexedExisting, ...newItem } : item,
  );
};

const rebuildIndex = (items) => {
  const byId = {};
  for (const item of items) {
    if (item && item.id !== undefined && item.id !== null) {
      byId[String(item.id)] = item;
    }
  }
  return byId;
};

const computeUnreadDerived = (items) => {
  let unreadCount = 0;
  let latestUnreadCreatedAt = null;
  for (const item of items) {
    if (!item.isRead) {
      unreadCount += 1;
      const createdAt = item.createdAt
        ? new Date(item.createdAt).getTime()
        : 0;
      if (
        !latestUnreadCreatedAt ||
        createdAt > new Date(latestUnreadCreatedAt).getTime()
      ) {
        latestUnreadCreatedAt = item.createdAt;
      }
    }
  }
  return { unreadCount, latestUnreadCreatedAt };
};

const sweepIngestCache = () => {
  const now = Date.now();
  for (const [key, expiresAt] of recentIngest.entries()) {
    if (expiresAt <= now) recentIngest.delete(key);
  }
};

const shouldDedupeIngest = (id) => {
  if (!id) return false;
  const key = String(id);
  sweepIngestCache();
  if (recentIngest.has(key)) return true;
  recentIngest.set(key, Date.now() + INGEST_DEDUPE_TTL_MS);
  return false;
};

const normalizeServerSummary = (response, fallback) => ({
  unreadCount: Number(response?.unreadCount ?? fallback?.unreadCount ?? 0),
  latestUnreadCreatedAt:
    response?.latestUnreadCreatedAt ?? fallback?.latestUnreadCreatedAt ?? null,
  nextCursor: response?.nextCursor ?? null,
});

export const hydrate = async ({ force = false, limit } = {}) => {
  if (!ensureBrowser()) return state;
  if (!force && state.loaded && Date.now() - state.lastHydratedAt < HYDRATE_TTL_MS) {
    return state;
  }
  if (hydrateInFlight) return hydrateInFlight;

  setState({ loading: true, error: null });
  hydrateInFlight = (async () => {
    try {
      const response = await notificationApiService.getFeed({ limit });
      const items = Array.isArray(response?.items) ? response.items : [];
      const summary = normalizeServerSummary(response, state);
      setState({
        items,
        byId: rebuildIndex(items),
        unreadCount: summary.unreadCount,
        latestUnreadCreatedAt: summary.latestUnreadCreatedAt,
        cursor: summary.nextCursor,
        hasMore: Boolean(summary.nextCursor),
        loaded: true,
        loading: false,
        error: null,
        lastHydratedAt: Date.now(),
      });
    } catch (error) {
      setState({ loading: false, error });
      if (!state.loaded) throw error;
    } finally {
      hydrateInFlight = null;
    }
    return state;
  })();

  return hydrateInFlight;
};

export const loadMore = async ({ limit = 20 } = {}) => {
  if (!ensureBrowser()) return state;
  if (state.loadingMore || !state.hasMore || !state.cursor) return state;
  setState({ loadingMore: true, error: null });
  try {
    const response = await notificationApiService.getFeed({
      limit,
      before: state.cursor,
    });
    const newItems = Array.isArray(response?.items) ? response.items : [];
    const merged = sortItemsDesc(
      [...state.items, ...newItems].reduce((acc, item) => {
        const id = item?.id ? String(item.id) : null;
        if (id && acc.some((existing) => String(existing.id) === id)) {
          return acc.map((existing) =>
            String(existing.id) === id ? { ...existing, ...item } : existing,
          );
        }
        return [...acc, item];
      }, []),
    );
    const summary = normalizeServerSummary(response, state);
    setState({
      items: merged,
      byId: rebuildIndex(merged),
      cursor: summary.nextCursor,
      hasMore: Boolean(summary.nextCursor),
      unreadCount: summary.unreadCount,
      latestUnreadCreatedAt: summary.latestUnreadCreatedAt,
      loadingMore: false,
    });
  } catch (error) {
    setState({ loadingMore: false, error });
  }
  return state;
};

const applyOptimisticReadState = (id, isRead) => {
  const targetId = String(id);
  const previousItem = state.byId[targetId];
  if (!previousItem) return null;
  const updatedItem = {
    ...previousItem,
    isRead,
    readAt: isRead ? new Date().toISOString() : null,
  };
  const items = state.items.map((item) =>
    String(item.id) === targetId ? updatedItem : item,
  );
  const derived = computeUnreadDerived(items);
  setState({
    items,
    byId: { ...state.byId, [targetId]: updatedItem },
    unreadCount: derived.unreadCount,
    latestUnreadCreatedAt: derived.latestUnreadCreatedAt,
  });
  return previousItem;
};

const revertReadState = (id, previousItem) => {
  if (!previousItem) return;
  const targetId = String(id);
  const items = state.items.map((item) =>
    String(item.id) === targetId ? previousItem : item,
  );
  const derived = computeUnreadDerived(items);
  setState({
    items,
    byId: { ...state.byId, [targetId]: previousItem },
    unreadCount: derived.unreadCount,
    latestUnreadCreatedAt: derived.latestUnreadCreatedAt,
  });
};

export const markRead = async (id, isRead = true) => {
  const previous = applyOptimisticReadState(id, isRead);
  try {
    await notificationApiService.markRead(id, isRead);
  } catch (error) {
    revertReadState(id, previous);
    throw error;
  }
};

export const markAllRead = async () => {
  if (state.unreadCount === 0) return;
  const snapshotBefore = {
    items: state.items.map((item) => ({ ...item })),
    byId: { ...state.byId },
    unreadCount: state.unreadCount,
    latestUnreadCreatedAt: state.latestUnreadCreatedAt,
  };
  const items = state.items.map((item) =>
    item.isRead
      ? item
      : { ...item, isRead: true, readAt: new Date().toISOString() },
  );
  setState({
    items,
    byId: rebuildIndex(items),
    unreadCount: 0,
    latestUnreadCreatedAt: null,
  });
  try {
    await notificationApiService.markAllRead();
  } catch (error) {
    setState(snapshotBefore);
    throw error;
  }
};

export const ingestRealtime = async (event) => {
  if (!ensureBrowser()) return;
  const incoming = event?.notification || event?.payload?.notification || null;
  const incomingId =
    incoming?.id ||
    event?.notificationId ||
    event?.payload?.notificationId ||
    null;
  if (incomingId && shouldDedupeIngest(incomingId)) return;

  if (incoming && incomingId) {
    const newItem = {
      id: incomingId,
      recipientId: null,
      title: incoming.title,
      content: incoming.content,
      targetPath: incoming.targetPath || "",
      createdAt: incoming.createdAt || new Date().toISOString(),
      createdBy: incoming.createdBy || null,
      isRead: false,
      readAt: null,
      roleSnapshot: incoming.roleSnapshot || "",
    };
    const items = upsertItem(state.items, newItem);
    const derived = computeUnreadDerived(items);
    setState({
      items,
      byId: rebuildIndex(items),
      unreadCount: derived.unreadCount,
      latestUnreadCreatedAt: derived.latestUnreadCreatedAt,
      loaded: true,
      lastHydratedAt: Date.now(),
    });
    return;
  }

  setState({ lastHydratedAt: 0 });
  hydrate({ force: true }).catch(() => {
    // Silent: stale cache acceptable.
  });
};

export const reset = () => {
  state = createInitialState();
  recentIngest.clear();
  emit();
};

export const __testing = {
  getInternalState: () => state,
  setStateForTest: setState,
};
