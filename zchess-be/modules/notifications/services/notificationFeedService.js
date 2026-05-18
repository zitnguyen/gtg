const notificationRepository = require("../repositories/notificationRepository");
const { buildHttpError } = require("../validators/notificationValidator");
const {
  buildItemFromRecipient,
  buildItemFromNotificationDoc,
} = require("../dto/notificationDto");

const DEFAULT_FEED_LIMIT = Number(process.env.NOTIF_FEED_DEFAULT_LIMIT || 0);
const MAX_FEED_LIMIT = Number(process.env.NOTIF_FEED_MAX_LIMIT || 100);

const sanitizeLimit = (rawLimit) => {
  const parsed = Number(rawLimit);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_FEED_LIMIT;
  return Math.min(parsed, MAX_FEED_LIMIT);
};

const getFeed = async (userId, { limit, before } = {}) => {
  const sanitizedLimit = sanitizeLimit(limit);
  const recipientDocs = await notificationRepository.findFeedForUser(userId, {
    limit: sanitizedLimit,
    before,
  });

  const items = recipientDocs.map(buildItemFromRecipient).filter(Boolean);
  const unreadCount = await notificationRepository.countUnreadForUser(userId);
  const latestUnread = await notificationRepository.findLatestUnreadForUser(userId);

  let nextCursor = null;
  if (sanitizedLimit > 0 && items.length === sanitizedLimit) {
    const last = items[items.length - 1];
    nextCursor = last?.createdAt
      ? new Date(last.createdAt).toISOString()
      : null;
  }

  return {
    items,
    unreadCount,
    latestUnreadCreatedAt: latestUnread?.createdAt || null,
    nextCursor,
  };
};

const getDetail = async ({ userId, role }, notificationId) => {
  const recipient = await notificationRepository.findRecipient(userId, notificationId);

  if (recipient && recipient.notificationId) {
    return buildItemFromRecipient(recipient);
  }

  if (role === "Admin") {
    const asCreator = await notificationRepository.findNotificationById(notificationId);
    if (asCreator) {
      return buildItemFromNotificationDoc(asCreator, "Admin");
    }
  }

  throw buildHttpError(404, "Notification không tồn tại");
};

const setReadState = async ({ userId, notificationId, isRead }) => {
  const recipient = await notificationRepository.findRecipientPlain(userId, notificationId);
  if (!recipient) {
    throw buildHttpError(404, "Notification không tồn tại");
  }
  recipient.isRead = Boolean(isRead);
  recipient.readAt = recipient.isRead ? new Date() : null;
  await recipient.save();
  return {
    isRead: recipient.isRead,
    readAt: recipient.readAt,
  };
};

const markAllRead = async (userId) => {
  const result = await notificationRepository.markAllReadForUser(userId);
  return {
    matchedCount: result?.matchedCount ?? result?.n ?? 0,
    modifiedCount: result?.modifiedCount ?? result?.nModified ?? 0,
  };
};

module.exports = {
  getFeed,
  getDetail,
  setReadState,
  markAllRead,
};
