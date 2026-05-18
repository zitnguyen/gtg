const {
  emitNotificationToUsers,
  emitNotificationToAll,
  getSocketIo,
} = require("../../../realtime/socketHub");

const isSocketReady = () => Boolean(getSocketIo());

const broadcastToUsers = (recipientIds, payload) => {
  if (!isSocketReady()) return false;
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) return false;
  emitNotificationToUsers(recipientIds, payload);
  return true;
};

const broadcastToAll = (payload) => {
  if (!isSocketReady()) return false;
  emitNotificationToAll(payload);
  return true;
};

module.exports = {
  isSocketReady,
  broadcastToUsers,
  broadcastToAll,
};
