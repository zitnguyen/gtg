import React from "react";
import { cn } from "../utils/classNames";

const PeriodSwitcher = ({
  value,
  options = [
    { id: "today", label: "Hôm nay" },
    { id: "month", label: "Tháng này" },
    { id: "year", label: "Năm nay" },
  ],
  onChange,
  className,
}) => (
  <div
    className={cn(
      "inline-flex rounded-lg bg-muted/60 p-1 text-sm font-medium",
      className,
    )}
  >
    {options.map((opt) => {
      const active = opt.id === value;
      return (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange?.(opt.id)}
          className={cn(
            "rounded-md px-3 py-1.5 transition-all",
            active
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

export default PeriodSwitcher;
