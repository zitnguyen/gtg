import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import authService from "../../../services/authService";
import {
  subscribe,
  getSnapshot,
  acquire,
} from "../stores/chatUnreadStore";

export const useChatUnreadBadge = () => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!currentUser?._id && !currentUser?.userId) return undefined;
    return acquire();
  }, [currentUser?._id, currentUser?.userId]);

  return {
    totalUnread: snapshot.totalUnread,
    bySender: snapshot.bySender,
    loaded: snapshot.loaded,
  };
};
