import { cn } from "../../lib/utils";

/** Lề ngang header */
export const HEADER_PAD_X = "px-4 sm:px-6 lg:px-8";
export const HEADER_PAD_L = "pl-4 sm:pl-6 lg:pl-8";
export const HEADER_PAD_R = "pr-4 sm:pr-6 lg:pr-8";

/** Kích thước icon & nút toolbar header — dùng chung theme / home / thông báo */
export const HEADER_TOOLBAR_ICON_SIZE = 18;

export const HEADER_TOOLBAR_HEIGHT_CLASS = "h-9 min-h-9 max-h-9";

export const headerToolbarButtonClass =
  "inline-flex h-9 w-9 min-h-9 max-h-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card p-0 text-foreground shadow-sm hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export const headerToolbarGroupClass =
  "flex flex-nowrap items-center gap-2 h-9 min-h-9 shrink-0 overflow-visible";

export const headerToolbarSeparatorClass = "h-9 w-px shrink-0 bg-border self-center";

export function headerToolbarButtonClassName(className) {
  return cn(headerToolbarButtonClass, className);
}

/** Nút menu tài khoản header — cùng chiều cao toolbar (h-9) */
export const headerAccountTriggerClass =
  "inline-flex h-9 min-h-9 max-h-9 shrink-0 items-center gap-2 min-w-0 rounded-lg border border-border bg-card box-border py-0 pl-1.5 pr-1.5 text-foreground shadow-sm hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
