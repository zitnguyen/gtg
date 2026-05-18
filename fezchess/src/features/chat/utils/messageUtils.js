export const MESSAGE_STATUS = Object.freeze({
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
});

const toMillis = (value) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

export const sortMessagesByCreatedAt = (messages) =>
  [...messages].sort((a, b) => toMillis(a?.createdAt) - toMillis(b?.createdAt));

export const isSameContact = (idA, idB) =>
  String(idA || "") === String(idB || "");

const isPersistedId = (id) =>
  typeof id === "string" && id.length > 0 && !id.startsWith("local-");

const OPTIMISTIC_MATCH_WINDOW_MS = 30_000;

// Best-effort match between an inbound persisted message and an in-flight
// optimistic one when the server doesn't echo back the local id. We require
// the same sender, recipient, content and a close timestamp to avoid false
// positives if the user sends the exact same text twice.
const findOptimisticMatchIndex = (messages, message) => {
  if (!isPersistedId(message._id)) return -1;
  return messages.findIndex((item) => {
    if (!item || !item._localId) return false;
    if (String(item.senderId) !== String(message.senderId)) return false;
    if (String(item.recipientId) !== String(message.recipientId)) return false;
    if ((item.content || "") !== (message.content || "")) return false;
    if ((item.imageUrl || "") !== (message.imageUrl || "")) return false;
    const dt = Math.abs(
      toMillis(item.createdAt) - toMillis(message.createdAt),
    );
    return dt <= OPTIMISTIC_MATCH_WINDOW_MS;
  });
};

// Defensive dedupe: keeps the first occurrence of each `_id` and merges any
// subsequent entries with the same id into it. Protects against socket /
// REST race conditions where the same message could otherwise appear twice.
const dedupeById = (messages) => {
  const positions = new Map();
  const result = [];
  messages.forEach((item) => {
    if (!item) return;
    const id = String(item._id || "");
    if (id && positions.has(id)) {
      const idx = positions.get(id);
      result[idx] = { ...result[idx], ...item };
      return;
    }
    if (id) positions.set(id, result.length);
    result.push(item);
  });
  return result;
};

export const findExistingMessageIndex = (messages, message) => {
  if (!message) return -1;
  if (isPersistedId(message._id)) {
    const byId = messages.findIndex(
      (item) => String(item._id) === String(message._id),
    );
    if (byId >= 0) return byId;
    const byOptimistic = findOptimisticMatchIndex(messages, message);
    if (byOptimistic >= 0) return byOptimistic;
  }
  if (message._localId) {
    const byLocalId = messages.findIndex(
      (item) => item._localId && item._localId === message._localId,
    );
    if (byLocalId >= 0) return byLocalId;
  }
  return -1;
};

export const upsertMessage = (messages, message) => {
  const idx = findExistingMessageIndex(messages, message);
  if (idx >= 0) {
    return dedupeById(
      messages.map((item, i) => {
        if (i !== idx) return item;
        const merged = { ...item, ...message };
        // When a socket promotes an optimistic message we keep status SENT.
        if (item._localId && isPersistedId(message._id)) {
          merged._localId = undefined;
          merged._status = MESSAGE_STATUS.SENT;
        }
        return merged;
      }),
    );
  }
  return dedupeById(sortMessagesByCreatedAt([...messages, message]));
};

export const replaceLocalMessage = (messages, localId, replacement) =>
  dedupeById(
    messages.map((item) =>
      item._localId && item._localId === localId
        ? {
            ...item,
            ...replacement,
            _localId: undefined,
            _status: MESSAGE_STATUS.SENT,
          }
        : item,
    ),
  );

export const markMessageFailed = (messages, localId, errorMessage) =>
  messages.map((item) =>
    item._localId && item._localId === localId
      ? { ...item, _status: MESSAGE_STATUS.FAILED, _error: errorMessage }
      : item,
  );

export const markMessagePending = (messages, localId) =>
  messages.map((item) =>
    item._localId && item._localId === localId
      ? { ...item, _status: MESSAGE_STATUS.PENDING, _error: null }
      : item,
  );

export const generateLocalId = () =>
  `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const buildOptimisticMessage = ({
  senderId,
  recipientId,
  content,
  imageUrl,
}) => ({
  _id: generateLocalId(),
  _localId: generateLocalId(),
  _status: MESSAGE_STATUS.PENDING,
  senderId,
  recipientId,
  content: content || "",
  imageUrl: imageUrl || "",
  createdAt: new Date().toISOString(),
});

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

export const buildMessageGroups = (messages) => {
  const groups = [];
  const seenIds = new Set();
  let currentDate = null;
  messages.forEach((message) => {
    if (!message) return;
    const id = String(message._id || message._localId || "");
    if (!id || seenIds.has(id)) return;
    seenIds.add(id);
    const date = new Date(message.createdAt);
    if (!isSameDay(currentDate, date)) {
      currentDate = date;
      groups.push({ type: "divider", id: `d-${date.toISOString()}`, date });
    }
    groups.push({ type: "message", id, message });
  });
  return groups;
};
