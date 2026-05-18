import React, { memo } from "react";
import { Search } from "lucide-react";
import { formatShortcut, SHORTCUTS } from "../config/shortcuts";

const SidebarSearchTrigger = ({ collapsed, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center w-full text-left rounded-xl border border-border/70 bg-background/60 hover:border-primary/30 hover:bg-background transition-colors ${
      collapsed ? "justify-center p-2" : "px-3 py-2 gap-2"
    }`}
    title={`Tìm kiếm nhanh (${formatShortcut(SHORTCUTS.COMMAND_PALETTE)})`}
    aria-label="Mở command palette"
  >
    <Search size={16} className="text-muted-foreground" />
    {!collapsed && (
      <>
        <span className="text-xs text-muted-foreground flex-1 truncate">
          Tìm kiếm hoặc lệnh nhanh
        </span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground bg-muted/70 border border-border/70 rounded px-1.5 py-0.5">
          {formatShortcut(SHORTCUTS.COMMAND_PALETTE)}
        </kbd>
      </>
    )}
  </button>
);

export default memo(SidebarSearchTrigger);
