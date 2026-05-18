import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import authService from "../../../services/authService";
import { useNotificationSocket } from "./useNotificationSocket";
import { useNotificationStore } from "./useNotificationStore";
import {
  hydrate,
  markAllRead,
  markRead,
} from "../stores/notificationStore";

const PREVIEW_LIMIT = 8;

export const useNotificationCenter = ({ autoOpenLimit = PREVIEW_LIMIT } = {}) => {
  const currentUser = authService.getCurrentUser();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useNotificationSocket();

  const { items, unreadCount, latestUnreadCreatedAt, loading, loaded, error } =
    useNotificationStore((state) => ({
      items: state.items,
      unreadCount: state.unreadCount,
      latestUnreadCreatedAt: state.latestUnreadCreatedAt,
      loading: state.loading,
      loaded: state.loaded,
      error: state.error,
    }));

  useEffect(() => {
    if (!currentUser?._id && !currentUser?.userId) return;
    hydrate({ limit: autoOpenLimit }).catch(() => {
      // Silent: surfaced through error in store.
    });
  }, [currentUser?._id, currentUser?.userId, autoOpenLimit]);

  const refresh = useCallback(
    () =>
      hydrate({ force: true, limit: autoOpenLimit }).catch(() => {
        // Silent.
      }),
    [autoOpenLimit],
  );

  const previewItems = useMemo(
    () => items.slice(0, autoOpenLimit),
    [items, autoOpenLimit],
  );

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        refresh();
      }
      return next;
    });
  }, [refresh]);

  const handleClose = useCallback(() => setOpen(false), []);

  const handleMarkRead = useCallback(
    (id) => markRead(id, true).catch(() => {}),
    [],
  );

  const handleMarkAllRead = useCallback(
    () => markAllRead().catch(() => {}),
    [],
  );

  return {
    open,
    setOpen,
    containerRef,
    items: previewItems,
    unreadCount,
    latestUnreadCreatedAt,
    loading,
    loaded,
    error,
    onToggle: handleToggle,
    onClose: handleClose,
    onMarkRead: handleMarkRead,
    onMarkAllRead: handleMarkAllRead,
    refresh,
  };
};
