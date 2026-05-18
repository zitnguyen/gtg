const subscribers = new Set();

const subscribe = (handler) => {
  if (typeof handler !== "function") return () => {};
  subscribers.add(handler);
  return () => subscribers.delete(handler);
};

const publish = (event) => {
  if (!event) return;
  for (const handler of subscribers) {
    try {
      handler(event);
    } catch (error) {
      console.error("[notificationBus] subscriber error", error);
    }
  }
};

const reset = () => subscribers.clear();

module.exports = {
  subscribe,
  publish,
  reset,
};
