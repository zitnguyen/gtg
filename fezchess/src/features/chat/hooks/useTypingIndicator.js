import { useCallback, useEffect, useRef, useState } from "react";
import {
  CHAT_EVENTS,
  emitChatEvent,
  subscribeChatEvent,
} from "../services/chatSocketClient";

const TYPING_EMIT_THROTTLE_MS = 1500;
const TYPING_STOP_AFTER_MS = 2000;
const TYPING_REMOTE_TTL_MS = 4000;
const REMOTE_CLEANUP_INTERVAL_MS = 1500;

export const useTypingIndicator = ({ recipientId }) => {
  const [typingPartners, setTypingPartners] = useState({});
  const lastEmitRef = useRef(0);
  const stopTimerRef = useRef(null);

  const stopRemoteTracking = useCallback((userId) => {
    if (!userId) return;
    setTypingPartners((prev) => {
      const key = String(userId);
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  useEffect(() => {
    const handleTyping = (payload) => {
      if (!payload?.userId) return;
      setTypingPartners((prev) => ({
        ...prev,
        [String(payload.userId)]: Date.now(),
      }));
    };

    const handleStopTyping = (payload) => {
      if (!payload?.userId) return;
      stopRemoteTracking(payload.userId);
    };

    const offTyping = subscribeChatEvent(
      CHAT_EVENTS.MESSAGE_TYPING,
      handleTyping,
    );
    const offStopTyping = subscribeChatEvent(
      CHAT_EVENTS.MESSAGE_STOP_TYPING,
      handleStopTyping,
    );

    const cleanupInterval = window.setInterval(() => {
      setTypingPartners((prev) => {
        const now = Date.now();
        let mutated = false;
        const next = {};
        Object.entries(prev).forEach(([key, value]) => {
          if (now - value < TYPING_REMOTE_TTL_MS) {
            next[key] = value;
          } else {
            mutated = true;
          }
        });
        return mutated ? next : prev;
      });
    }, REMOTE_CLEANUP_INTERVAL_MS);

    return () => {
      offTyping();
      offStopTyping();
      window.clearInterval(cleanupInterval);
    };
  }, [stopRemoteTracking]);

  const sendStopTypingNow = useCallback(() => {
    if (!recipientId) return;
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (lastEmitRef.current === 0) return;
    emitChatEvent(CHAT_EVENTS.MESSAGE_STOP_TYPING, { recipientId });
    lastEmitRef.current = 0;
  }, [recipientId]);

  const onUserTyping = useCallback(() => {
    if (!recipientId) return;
    const now = Date.now();
    if (now - lastEmitRef.current > TYPING_EMIT_THROTTLE_MS) {
      emitChatEvent(CHAT_EVENTS.MESSAGE_TYPING, { recipientId });
      lastEmitRef.current = now;
    }
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
    }
    stopTimerRef.current = window.setTimeout(
      sendStopTypingNow,
      TYPING_STOP_AFTER_MS,
    );
  }, [recipientId, sendStopTypingNow]);

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) {
        window.clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    sendStopTypingNow();
  }, [recipientId, sendStopTypingNow]);

  const isPartnerTyping = recipientId
    ? Boolean(typingPartners[String(recipientId)])
    : false;

  return {
    onUserTyping,
    sendStopTypingNow,
    isPartnerTyping,
  };
};
