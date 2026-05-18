import { useEffect } from "react";
import { subscribeAllNotificationEvents } from "../services/notificationSocketClient";
import { ingestRealtime } from "../stores/notificationStore";

let activeSubscriptions = 0;
let unsubscribe = null;

const ensureSubscription = () => {
  if (unsubscribe) return;
  unsubscribe = subscribeAllNotificationEvents((event) => {
    ingestRealtime(event?.payload || {});
  });
};

const releaseSubscription = () => {
  if (!unsubscribe) return;
  unsubscribe();
  unsubscribe = null;
};

export const useNotificationSocket = () => {
  useEffect(() => {
    activeSubscriptions += 1;
    ensureSubscription();
    return () => {
      activeSubscriptions = Math.max(0, activeSubscriptions - 1);
      if (activeSubscriptions === 0) {
        releaseSubscription();
      }
    };
  }, []);
};
