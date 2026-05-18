import React, { memo } from "react";
import { cn } from "../utils/classNames";

// Common label + hint + dirty-indicator wrapper for every field.
const FieldShell = memo(function FieldShell({
  label,
  hint,
  dirty,
  htmlFor,
  className,
  children,
  inline = false,
}) {
  return (
    <div className={cn("flex", inline ? "flex-row items-center gap-3" : "flex-col gap-1.5", className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
        >
          {label}
          {dirty ? (
            <span
              aria-label="Chưa lưu"
              className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"
            />
          ) : null}
        </label>
      ) : null}
      <div className={inline ? "flex-1 min-w-0" : ""}>{children}</div>
      {hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
});

export default FieldShell;
