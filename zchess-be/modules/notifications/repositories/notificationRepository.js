const Notification = require("../../../models/Notification");
const NotificationRecipient = require("../../../models/NotificationRecipient");

const createNotificationDoc = async ({ title, content, targetPath, createdBy }) =>
  Notification.create({
    title: String(title || "").trim(),
    content: String(content || "").trim(),
    targetPath: String(targetPath || "").trim(),
    createdBy,
  });

const insertRecipients = async (notificationId, recipients) => {
  if (!Array.isArray(recipients) || recipients.length === 0) return [];
  return NotificationRecipient.insertMany(
    recipients.map((recipient) => ({
      notificationId,
      userId: recipient._id || recipient,
      roleSnapshot: recipient.role || recipient.roleSnapshot || "Student",
      isRead: false,
      readAt: null,
    })),
    { ordered: false },
  );
};

const findFeedForUser = async (userId, { limit, before } = {}) => {
  const query = { userId };
  if (before) {
    const beforeDate = new Date(before);
    if (!Number.isNaN(beforeDate.getTime())) {
      query.createdAt = { $lt: beforeDate };
    }
  }
  let cursor = NotificationRecipient.find(query).sort({ createdAt: -1 });
  if (Number.isFinite(limit) && limit > 0) {
    cursor = cursor.limit(limit);
  }
  return cursor.populate({
    path: "notificationId",
    populate: { path: "createdBy", select: "fullName username role" },
  });
};

const countUnreadForUser = (userId) =>
  NotificationRecipient.countDocuments({ userId, isRead: false });

const findLatestUnreadForUser = (userId) =>
  NotificationRecipient.findOne({ userId, isRead: false })
    .sort({ createdAt: -1 })
    .lean();

const findRecipient = (userId, notificationId) =>
  NotificationRecipient.findOne({ userId, notificationId }).populate({
    path: "notificationId",
    populate: { path: "createdBy", select: "fullName username role" },
  });

const findRecipientPlain = (userId, notificationId) =>
  NotificationRecipient.findOne({ userId, notificationId });

const findNotificationById = (notificationId) =>
  Notification.findById(notificationId).populate(
    "createdBy",
    "fullName username role",
  );

const updateRecipientReadState = async (userId, notificationId, isRead) => {
  const update = {
    isRead: Boolean(isRead),
    readAt: isRead ? new Date() : null,
  };
  return NotificationRecipient.findOneAndUpdate(
    { userId, notificationId },
    update,
    { new: true },
  );
};

const markAllReadForUser = (userId) =>
  NotificationRecipient.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } },
  );

module.exports = {
  createNotificationDoc,
  insertRecipients,
  findFeedForUser,
  countUnreadForUser,
  findLatestUnreadForUser,
  findRecipient,
  findRecipientPlain,
  findNotificationById,
  updateRecipientReadState,
  markAllReadForUser,
};
