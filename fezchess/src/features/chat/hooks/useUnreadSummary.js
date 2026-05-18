import { useCallback, useEffect, useRef, useState } from "react";
import chatApiService from "../services/chatApiService";
import {
  CHAT_EVENTS,
  subscribeChatEvent,
  subscribeSocketLifecycle,
} from "../services/chatSocketClient";

export const useUnreadSummary = ({ currentUserId, selectedContactId }) => {
  const [unreadBySender, setUnreadBySender] = useState({});
  const isMountedRef = useRef(true);
  const selectedContactIdRef = useRef(selectedContactId);

  useEffect(() => {
    selectedContactIdRef.current = selectedContactId;
  }, [selectedContactId]);

  const refreshUnread = useCallback(async () => {
    try {
      const data = await chatApiService.fetchUnreadSummary();
      if (!isMountedRef.current) return;
      const bySender =
        data && typeof data.bySender === "object" && data.bySender !== null
          ? data.bySender
          : {};
      setUnreadBySender(bySender);
    } catch {
      if (isMountedRef.current) setUnreadBySender({});
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    refreshUnread();
    return () => {
      isMountedRef.current = false;
    };
  }, [refreshUnread]);

  const clearUnreadFor = useCallback((contactId) => {
    if (!contactId) return;
    setUnreadBySender((prev) => {
      const key = String(contactId);
      if (!prev[key]) return prev;
      const next = { ...prev };
      next[key] = 0;
      return next;
    });
  }, []);

  useEffect(() => {
    if (selectedContactId) {
      clearUnreadFor(selectedContactId);
    }
  }, [selectedContactId, clearUnreadFor]);

  useEffect(() => {
    const handleIncoming = (payload) => {
      if (!payload) return;
      if (String(payload.senderId) === String(currentUserId)) return;
      const senderKey = String(payload.senderId);
      if (
        selectedContactIdRef.current &&
        senderKey === String(selectedContactIdRef.current)
      ) {
        return;
      }
      setUnreadBySender((prev) => {
        const current = Number(prev[senderKey] || 0);
        return { ...prev, [senderKey]: current + 1 };
      });
    };

    const offNew = subscribeChatEvent(CHAT_EVENTS.MESSAGE_NEW, handleIncoming);
    const offLifecycle = subscribeSocketLifecycle({
      onConnect: refreshUnread,
      onReconnect: refreshUnread,
    });

    return () => {
      offNew();
      offLifecycle();
    };
  }, [currentUserId, refreshUnread]);

  return {
    unreadBySender,
    clearUnreadFor,
    refreshUnread,
  };
};
