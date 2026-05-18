import React, { memo } from "react";
import { cn } from "../../utils/classNames";

const ChildSwitcher = memo(function ChildSwitcher({
  children,
  selectedChildId,
  onSelect,
}) {
  if (!children || children.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {children.map((child) => {
        const active = String(child._id) === String(selectedChildId);
        return (
          <button
            key={child._id}
            type="button"
            onClick={() => onSelect?.(child._id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-foreground border-border hover:bg-muted",
            )}
          >
            {child.fullName}
          </button>
        );
      })}
    </div>
  );
});

export default ChildSwitcher;
