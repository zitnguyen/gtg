import { useCallback, useEffect, useRef } from "react";
import authService from "../../../services/authService";
import { useNotificationSocket } from "./useNotificationSocket";
import { useNotificationStore } from "./useNotificationStore";
import {
  hydrate,
  loadMore,
  markAllRead,
  markRead,
} from "../stores/notificationStore";

const PAGE_SIZE = 20;

export const useNotificationFeed = ({ pageSize = PAGE_SIZE } = {}) => {
  const currentUser = authService.getCurrentUser();
  useNotificationSocket();

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const {
    items,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    error,
    loaded,
  } = useNotificationStore((state) => ({
    items: state.items,
    unreadCount: state.unreadCount,
    loading: state.loading,
    loadingMore: state.loadingMore,
    hasMore: state.hasMore,
    error: state.error,
    loaded: state.loaded,
  }));

  useEffect(() => {
    if (!currentUser?._id && !currentUser?.userId) return;
    hydrate({ force: true, limit: pageSize }).catch(() => {});
  }, [currentUser?._id, currentUser?.userId, pageSize]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    loadMore({ limit: pageSize });
  }, [hasMore, loadingMore, pageSize]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;
    if (typeof IntersectionObserver === "undefined") return undefined;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            handleLoadMore();
            break;
          }
        }
      },
      { rootMargin: "120px" },
    );
    observerRef.current.observe(sentinel);
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [handleLoadMore]);

  return {
    items,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    error,
    loaded,
    sentinelRef,
    onMarkRead: (id) => markRead(id, true).catch(() => {}),
    onMarkUnread: (id) => markRead(id, false).catch(() => {}),
    onMarkAllRead: () => markAllRead().catch(() => {}),
    onLoadMore: handleLoadMore,
  };
};
