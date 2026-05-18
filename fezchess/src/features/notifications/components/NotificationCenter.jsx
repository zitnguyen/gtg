import React, { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NotificationItem from "./NotificationItem";
import NotificationListSkeleton from "./NotificationListSkeleton";
import NotificationEmptyState from "./NotificationEmptyState";

const NotificationCenter = ({
  open,
  items = [],
  loading,
  unreadCount,
  onClose,
  onSelect,
  onMarkAllRead,
  onViewAll,
  emptyDescription,
  containerRef,
}) => (
  <div className="relative" ref={containerRef}>
    <AnimatePresence>
      {open && (
        <motion.div
          key="notification-center"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="absolute right-0 mt-2 w-[360px] max-w-[90vw] bg-background border border-border rounded-2xl shadow-2xl z-[200] overflow-hidden"
          role="dialog"
          aria-label="Trung tâm thông báo"
        >
          <header className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Thông báo
              </span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onMarkAllRead}
                disabled={!unreadCount || unreadCount === 0}
                className="text-[11px] font-medium text-muted-foreground hover:text-primary disabled:opacity-40"
              >
                Đánh dấu tất cả
              </button>
              <button
                type="button"
                onClick={onViewAll}
                className="text-[11px] font-medium text-primary"
              >
                Xem tất cả
              </button>
            </div>
          </header>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && items.length === 0 ? (
              <NotificationListSkeleton rows={4} />
            ) : items.length === 0 ? (
              <NotificationEmptyState description={emptyDescription} />
            ) : (
              <NotificationItemList items={items} onSelect={onSelect} />
            )}
          </div>

          <footer className="px-4 py-2 border-t border-border bg-muted/30 text-[11px] text-muted-foreground text-center">
            {loading
              ? "Đang đồng bộ thông báo..."
              : "Cập nhật theo realtime"}
            <button
              type="button"
              onClick={onClose}
              className="ml-2 text-primary hover:underline"
            >
              Đóng
            </button>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const NotificationItemList = memo(({ items, onSelect }) => {
  const memoizedItems = useMemo(() => items.slice(0, 8), [items]);
  return (
    <div className="divide-y divide-border/60">
      {memoizedItems.map((item) => (
        <NotificationItem
          key={`${item.id}-${item.recipientId || item.id}`}
          item={item}
          onSelect={onSelect}
          dense
        />
      ))}
    </div>
  );
});
NotificationItemList.displayName = "NotificationItemList";

export default memo(NotificationCenter);
