const socketBroadcaster = require("../broadcasters/socketNotificationBroadcaster");
const notificationBus = require("../broadcasters/notificationBus");

const MAX_ATTEMPTS = Number(process.env.NOTIF_DELIVERY_MAX_ATTEMPTS || 3);
const BASE_BACKOFF_MS = Number(process.env.NOTIF_DELIVERY_BACKOFF_MS || 750);
const BATCH_WINDOW_MS = Number(process.env.NOTIF_DELIVERY_BATCH_MS || 60);

const queue = [];
let pendingTimer = null;
let processing = false;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const enqueue = (job) => {
  if (!job) return;
  queue.push({ ...job, attempts: 0 });
  scheduleProcessing();
};

const scheduleProcessing = () => {
  if (pendingTimer || processing) return;
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    processQueue().catch((error) => {
      console.error("[notificationDeliveryJob] processQueue error", error);
    });
  }, BATCH_WINDOW_MS);
};

const dispatch = async (job) => {
  const { type, recipientIds, payload, broadcast } = job;
  if (broadcast) {
    return socketBroadcaster.broadcastToAll(payload);
  }
  if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
    return true;
  }
  return socketBroadcaster.broadcastToUsers(recipientIds, payload);
};

const processQueue = async () => {
  if (processing) return;
  processing = true;
  try {
    while (queue.length > 0) {
      const job = queue.shift();
      let delivered = false;
      try {
        delivered = await dispatch(job);
      } catch (error) {
        console.error("[notificationDeliveryJob] dispatch error", error);
        delivered = false;
      }
      if (delivered) {
        notificationBus.publish({
          type: "delivered",
          jobType: job.type,
          recipientIds: job.recipientIds || [],
          notificationId: job.payload?.notificationId,
          attempts: job.attempts + 1,
        });
        continue;
      }
      job.attempts += 1;
      if (job.attempts >= MAX_ATTEMPTS) {
        notificationBus.publish({
          type: "failed",
          jobType: job.type,
          recipientIds: job.recipientIds || [],
          notificationId: job.payload?.notificationId,
          attempts: job.attempts,
        });
        continue;
      }
      const backoff = BASE_BACKOFF_MS * 2 ** (job.attempts - 1);
      // Re-enqueue after backoff but do not block the queue.
      setTimeout(() => {
        queue.push(job);
        scheduleProcessing();
      }, backoff);
    }
  } finally {
    processing = false;
    if (queue.length > 0) scheduleProcessing();
  }
  await wait(0);
};

const enqueueUserBroadcast = ({ type, recipientIds, payload }) => {
  enqueue({ type, recipientIds, payload, broadcast: false });
};

const enqueueGlobalBroadcast = ({ type, payload }) => {
  enqueue({ type, recipientIds: [], payload, broadcast: true });
};

const flushNow = async () => {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  await processQueue();
};

const reset = () => {
  queue.length = 0;
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  processing = false;
};

module.exports = {
  enqueueUserBroadcast,
  enqueueGlobalBroadcast,
  flushNow,
  reset,
};
