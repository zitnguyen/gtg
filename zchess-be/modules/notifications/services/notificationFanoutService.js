const notificationRepository = require("../repositories/notificationRepository");
const userTargetRepository = require("../repositories/userTargetRepository");
const dedupeService = require("./notificationDedupeService");
const deliveryJob = require("../jobs/notificationDeliveryJob");

const buildSocketPayload = ({ type, notification, recipientIds }) => ({
  type: String(type || "GENERAL_NOTIFICATION"),
  notificationId: notification._id,
  notification: {
    id: notification._id,
    title: notification.title,
    content: notification.content,
    targetPath: notification.targetPath || "",
    createdAt: notification.createdAt,
  },
  recipientCount: recipientIds.length,
});

const fanoutToUsers = async ({
  title,
  content,
  targetPath,
  createdBy,
  recipients,
  type = "GENERAL_NOTIFICATION",
  dedupe = true,
}) => {
  const cleanRecipients = Array.isArray(recipients)
    ? recipients.filter(Boolean)
    : [];
  if (cleanRecipients.length === 0) {
    return { notification: null, recipientsCount: 0, skipped: false };
  }

  const recipientIds = cleanRecipients.map((recipient) =>
    String(recipient._id || recipient),
  );

  if (dedupe) {
    const dedupeKey = dedupeService.buildDedupeKey({
      title,
      content,
      targetPath,
      recipientIds,
      type,
    });
    if (dedupeService.shouldSkip(dedupeKey)) {
      return { notification: null, recipientsCount: 0, skipped: true };
    }
  }

  const notification = await notificationRepository.createNotificationDoc({
    title,
    content,
    targetPath,
    createdBy,
  });

  await notificationRepository.insertRecipients(notification._id, cleanRecipients);

  const payload = buildSocketPayload({
    type,
    notification,
    recipientIds,
  });

  deliveryJob.enqueueUserBroadcast({
    type,
    recipientIds,
    payload,
  });

  return {
    notification,
    recipientsCount: cleanRecipients.length,
    skipped: false,
  };
};

const fanoutToRoles = async ({
  title,
  content,
  targetPath,
  createdBy,
  roles,
  userIds = [],
  type = "MANUAL_NOTIFICATION",
  dedupe = true,
}) => {
  const filter = { role: { $in: roles } };
  if (Array.isArray(userIds) && userIds.length > 0) {
    filter._id = { $in: userIds };
  }
  const recipients = await userTargetRepository.findUsersByFilter(filter);
  return fanoutToUsers({
    title,
    content,
    targetPath,
    createdBy,
    recipients,
    type,
    dedupe,
  });
};

module.exports = {
  fanoutToUsers,
  fanoutToRoles,
};
