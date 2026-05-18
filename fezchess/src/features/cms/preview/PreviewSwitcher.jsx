import React, { memo } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { cn } from "../utils/classNames";

const VIEWPORTS = [
  { id: "desktop", icon: Monitor, label: "Desktop", width: "100%" },
  { id: "tablet", icon: Tablet, label: "Tablet", width: "768px" },
  { id: "mobile", icon: Smartphone, label: "Mobile", width: "390px" },
];

const PreviewSwitcher = memo(function PreviewSwitcher({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-background p-1">
      {VIEWPORTS.map((vp) => {
        const Icon = vp.icon;
        const active = vp.id === value;
        return (
          <button
            key={vp.id}
            type="button"
            onClick={() => onChange?.(vp.id)}
            title={vp.label}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={14} />
            <span className="hidden md:inline">{vp.label}</span>
          </button>
        );
      })}
    </div>
  );
});

export const VIEWPORT_WIDTH = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

export default PreviewSwitcher;
