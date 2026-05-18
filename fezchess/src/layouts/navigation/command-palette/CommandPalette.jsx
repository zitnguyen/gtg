import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Clock } from "lucide-react";
import { useCommandPalette } from "./useCommandPalette";
import { formatShortcut, SHORTCUTS } from "../config/shortcuts";

const CommandPalette = ({ role }) => {
  const {
    open,
    query,
    setQuery,
    filteredItems,
    recentItems,
    onSelect,
    onClose,
  } = useCommandPalette({ role });
  const inputRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (open) {
      const id = window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => window.cancelAnimationFrame(id);
    }
  }, [open]);

  const visibleList = useMemo(() => {
    if (query.trim()) return filteredItems;
    return recentItems.length > 0 ? recentItems : filteredItems;
  }, [filteredItems, recentItems, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [visibleList]);

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) =>
        Math.min(prev + 1, Math.max(visibleList.length - 1, 0)),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const target = visibleList[activeIndex];
      if (target) onSelect(target);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="command-palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[120] flex items-start justify-center pt-[8vh] sm:pt-[12vh] px-4"
          onClick={onClose}
        >
          <motion.div
            key="command-palette"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search size={18} className="text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tìm trang, lệnh, dữ liệu..."
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground bg-muted/70 border border-border/70 rounded px-1.5 py-0.5">
                Esc
              </kbd>
            </div>

            <div className="max-h-[50vh] overflow-y-auto">
              {visibleList.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Không có kết quả. Hãy thử từ khóa khác.
                </div>
              ) : (
                <ul className="py-1">
                  {!query.trim() && recentItems.length > 0 && (
                    <li className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70 inline-flex items-center gap-1.5">
                      <Clock size={11} /> Gần đây
                    </li>
                  )}
                  {visibleList.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = index === activeIndex;
                    return (
                      <li key={item.key}>
                        <button
                          type="button"
                          onClick={() => onSelect(item)}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-primary/10 text-foreground"
                              : "text-foreground hover:bg-muted/60"
                          }`}
                        >
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-md ${
                              isActive
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {Icon ? <Icon size={16} /> : null}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block font-medium truncate">
                              {item.label}
                            </span>
                            <span className="block text-[11px] text-muted-foreground truncate">
                              {item.to}
                            </span>
                          </span>
                          <ArrowRight
                            size={14}
                            className={`shrink-0 transition-opacity ${
                              isActive ? "opacity-100" : "opacity-0"
                            }`}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <footer className="px-4 py-2 border-t border-border bg-muted/30 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Điều hướng nhanh tới mọi trang trong hệ thống</span>
              <span className="hidden sm:inline-flex items-center gap-1">
                Mở lại bằng
                <kbd className="font-mono bg-background border border-border/70 rounded px-1.5">
                  {formatShortcut(SHORTCUTS.COMMAND_PALETTE)}
                </kbd>
              </span>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(CommandPalette);
