import React, { memo } from "react";
import { motion } from "framer-motion";
import { formatRelativeTime } from "../utils/groupNotifications";

const TYPE_ACCENT = {
  ORDER_PENDING_CREATED: "bg-amber-500/10 text-amber-600",
  ORDER_APPROVED: "bg-emerald-500/10 text-emerald-600",
  INQUIRY_CREATED: "bg-sky-500/10 text-sky-600",
  LEAD_CREATED: "bg-sky-500/10 text-sky-600",
  MANUAL_NOTIFICATION: "bg-primary/10 text-primary",
};

const resolveAccent = (type) => TYPE_ACCENT[type] || "bg-primary/10 text-primary";

const NotificationItem = ({ item, onSelect, onToggleRead, dense = false }) => {
  if (!item) return null;
  const isRead = Boolean(item.isRead);
  const accent = resolveAccent(item.type);

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
      onClick={() => onSelect?.(item)}
      className={`w-full text-left px-4 ${
        dense ? "py-2.5" : "py-3.5"
      } hover:bg-muted/60 transition-colors flex gap-3 items-start`}
    >
      <span
        className={`mt-1 inline-flex w-2.5 h-2.5 rounded-full ${
          isRead ? "bg-transparent" : "bg-primary"
        }`}
        aria-hidden
      />
      <span
        className={`hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold ${accent}`}
        aria-hidden
      >
        {(item?.title || "?").slice(0, 1).toUpperCase()}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center justify-between gap-2">
          <span
            className={`text-sm line-clamp-1 ${
              isRead ? "text-foreground/80" : "text-foreground font-semibold"
            }`}
          >
            {item.title || "Thông báo mới"}
          </span>
          <span className="text-[11px] text-muted-foreground flex-shrink-0">
            {formatRelativeTime(item.createdAt)}
          </span>
        </span>
        <span className="block text-xs text-muted-foreground mt-1 line-clamp-2">
          {item.content || item.message || "Nhấn để xem chi tiết"}
        </span>
        {onToggleRead && (
          <span className="inline-flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleRead(item);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggleRead(item);
                }
              }}
              className="px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 cursor-pointer"
            >
              {isRead ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
            </span>
          </span>
        )}
      </span>
    </motion.button>
  );
};

export default memo(NotificationItem);
