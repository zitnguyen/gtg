import { useCallback, useEffect, useRef, useState } from "react";

const NEAR_BOTTOM_THRESHOLD_PX = 80;

export const useAutoScroll = ({ trackedKey, currentUserId, messages }) => {
  const containerRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);
  const trackedKeyRef = useRef(trackedKey);
  const lastMessageIdRef = useRef(null);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
    setUnseenCount(0);
  }, []);

  useEffect(() => {
    trackedKeyRef.current = trackedKey;
    setUnseenCount(0);
    setIsNearBottom(true);
    const id = window.requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      container.scrollTop = container.scrollHeight;
    });
    return () => window.cancelAnimationFrame(id);
  }, [trackedKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const onScroll = () => {
      const distanceToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const nearBottom = distanceToBottom <= NEAR_BOTTOM_THRESHOLD_PX;
      setIsNearBottom(nearBottom);
      if (nearBottom) setUnseenCount(0);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!Array.isArray(messages) || messages.length === 0) {
      lastMessageIdRef.current = null;
      return;
    }
    const lastMessage = messages[messages.length - 1];
    const lastId = lastMessage?._id;
    if (lastId === lastMessageIdRef.current) return;
    const isMine = String(lastMessage?.senderId) === String(currentUserId);
    lastMessageIdRef.current = lastId;

    if (isNearBottom || isMine) {
      const id = window.requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      });
      setUnseenCount(0);
      return () => window.cancelAnimationFrame(id);
    }

    setUnseenCount((prev) => prev + 1);
    return undefined;
  }, [messages, isNearBottom, currentUserId]);

  return {
    containerRef,
    isNearBottom,
    unseenCount,
    scrollToBottom,
  };
};
