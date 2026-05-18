import { useCallback, useEffect, useRef, useState } from "react";
import chatApiService from "../services/chatApiService";
import {
  CHAT_EVENTS,
  subscribeChatEvent,
  subscribeSocketLifecycle,
} from "../services/chatSocketClient";

const ACTIVITY_REFRESH_INTERVAL_MS = 60 * 1000;

const upsertActivityUser = (users, payload) => {
  if (!payload?.userId) return users;
  const idStr = String(payload.userId);
  const isActive = Boolean(payload.isOnline);
  const next = [...users];
  const idx = next.findIndex((user) => String(user._id) === idStr);

  if (idx >= 0) {
    next[idx] = {
      ...next[idx],
      isActive,
      lastSeenAt: isActive ? new Date().toISOString() : next[idx].lastSeenAt,
    };
    return next;
  }

  next.push({
    _id: idStr,
    isActive,
    lastSeenAt: isActive ? new Date().toISOString() : null,
  });
  return next;
};

export const useActivityStatus = ({ enabled }) => {
  const [activityUsers, setActivityUsers] = useState([]);
  const isMountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setActivityUsers([]);
      return;
    }
    try {
      const data = await chatApiService.fetchActivityStatuses();
      if (!isMountedRef.current) return;
      const users = Array.isArray(data?.users) ? data.users : [];
      setActivityUsers(users);
    } catch {
      if (isMountedRef.current) {
        setActivityUsers([]);
      }
    }
  }, [enabled]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    refresh();
    const intervalId = window.setInterval(refresh, ACTIVITY_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return undefined;

    const handleStatus = (payload) => {
      setActivityUsers((prev) => upsertActivityUser(prev, payload));
    };

    const offOnline = subscribeChatEvent(CHAT_EVENTS.USER_ONLINE, handleStatus);
    const offOffline = subscribeChatEvent(
      CHAT_EVENTS.USER_OFFLINE,
      handleStatus,
    );
    const offStatus = subscribeChatEvent(CHAT_EVENTS.USER_STATUS, handleStatus);
    const offLifecycle = subscribeSocketLifecycle({
      onReconnect: () => {
        refresh();
      },
    });

    return () => {
      offOnline();
      offOffline();
      offStatus();
      offLifecycle();
    };
  }, [enabled, refresh]);

  return {
    activityUsers,
    refreshActivity: refresh,
  };
};
