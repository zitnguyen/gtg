import React, { memo } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NotificationBell = ({
  unreadCount = 0,
  onClick,
  size = 20,
  className = "",
  title = "Thông báo",
}) => {
  const safeCount = Number.isFinite(unreadCount) ? Math.max(0, unreadCount) : 0;
  const showBadge = safeCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center justify-center p-2 rounded-full hover:bg-muted transition-colors ${className}`}
      title={title}
      aria-label={title}
    >
      <motion.span
        animate={showBadge ? { rotate: [0, -10, 10, -8, 0] } : { rotate: 0 }}
        transition={{ duration: 0.6, repeat: showBadge ? Infinity : 0, repeatDelay: 4 }}
        className="inline-flex"
      >
        <Bell size={size} />
      </motion.span>
      <AnimatePresence>
        {showBadge && (
          <motion.span
            key="badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold border border-background flex items-center justify-center"
          >
            {safeCount > 99 ? "99+" : safeCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default memo(NotificationBell);
