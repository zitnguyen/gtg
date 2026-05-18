const buildItemFromRecipient = (recipientDoc) => {
  if (!recipientDoc || !recipientDoc.notificationId) return null;
  const notification = recipientDoc.notificationId;
  return {
    id: notification._id,
    recipientId: recipientDoc._id,
    title: notification.title,
    content: notification.content,
    targetPath: notification.targetPath || "",
    createdAt: notification.createdAt,
    createdBy: notification.createdBy,
    isRead: recipientDoc.isRead,
    readAt: recipientDoc.readAt,
    roleSnapshot: recipientDoc.roleSnapshot,
  };
};

const buildItemFromNotificationDoc = (notificationDoc, roleSnapshot = "Admin") => {
  if (!notificationDoc) return null;
  return {
    id: notificationDoc._id,
    recipientId: null,
    title: notificationDoc.title,
    content: notificationDoc.content,
    targetPath: notificationDoc.targetPath || "",
    createdAt: notificationDoc.createdAt,
    createdBy: notificationDoc.createdBy,
    isRead: false,
    readAt: null,
    roleSnapshot,
  };
};

module.exports = {
  buildItemFromRecipient,
  buildItemFromNotificationDoc,
};
