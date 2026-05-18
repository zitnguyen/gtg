import React, { memo } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { formatShortcut, SHORTCUTS } from "../config/shortcuts";

const SidebarCollapseToggle = ({ collapsed, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="hidden md:inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    title={`${collapsed ? "Mở rộng" : "Thu gọn"} (${formatShortcut(SHORTCUTS.TOGGLE_SIDEBAR)})`}
    aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
  >
    {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
  </button>
);

export default memo(SidebarCollapseToggle);
