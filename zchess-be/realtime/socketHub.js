let ioInstance = null;

const buildUserRoom = (userId) => `user:${String(userId)}`;

const setSocketIo = (io) => {
  ioInstance = io;
};

const getSocketIo = () => ioInstance;

const emitNotificationToUsers = (userIds, payload = {}) => {
  if (!ioInstance || !Array.isArray(userIds) || userIds.length === 0) return;
  const uniqueIds = [
    ...new Set(userIds.map((id) => String(id || "").trim()).filter(Boolean)),
  ];
  uniqueIds.forEach((id) => {
    ioInstance.to(buildUserRoom(id)).emit("notification:new", {
      ...payload,
      userId: id,
      ts: Date.now(),
    });
  });
};

const emitMessageToUsers = (recipientId, senderId, messageData = {}) => {
  if (!ioInstance) return;
  const senderIdStr = String(senderId || "").trim();
  const recipientIdStr = String(recipientId || "").trim();

  if (!recipientIdStr || !senderIdStr) return;

  // Send to recipient's room
  ioInstance.to(buildUserRoom(recipientIdStr)).emit("message:new", {
    ...messageData,
    senderId: senderId,
    recipientId: recipientId,
    ts: Date.now(),
  });

  // Send to sender's room (for message sent confirmation)
  ioInstance.to(buildUserRoom(senderIdStr)).emit("message:sent", {
    ...messageData,
    senderId: senderId,
    recipientId: recipientId,
    ts: Date.now(),
  });
};

const emitNotificationToAll = (payload = {}) => {
  if (!ioInstance) return;
  ioInstance.emit("notification:broadcast", {
    ...payload,
    ts: Date.now(),
  });
};

const emitUserOnlineStatus = (userId, isOnline = true) => {
  if (!ioInstance) return;
  const userIdStr = String(userId || "").trim();
  if (!userIdStr) return;

  ioInstance.emit("user:status", {
    userId: userId,
    isOnline,
    ts: Date.now(),
  });
};

/** Broadcast API mutation metadata to all connected (JWT) sockets. */
const emitApiCrud = (payload = {}) => {
  if (!ioInstance) return;
  ioInstance.emit("api:crud", {
    ...payload,
    ts: Date.now(),
  });
};

module.exports = {
  setSocketIo,
  getSocketIo,
  buildUserRoom,
  emitNotificationToUsers,
  emitMessageToUsers,
  emitNotificationToAll,
  emitUserOnlineStatus,
  emitApiCrud,
};
