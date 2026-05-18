import React from "react";
import { cn } from "../utils/classNames";

export const SkeletonBlock = ({ className, style }) => (
  <div
    className={cn(
      "animate-pulse rounded-md bg-muted/70 dark:bg-muted/40",
      className,
    )}
    style={style}
  />
);

export const SkeletonText = ({ lines = 1, className }) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBlock key={i} className={cn("h-3 w-full", i === lines - 1 && "w-2/3")} />
    ))}
  </div>
);

export const SkeletonKpiCard = () => (
  <div className="rounded-2xl border border-border bg-background p-6 shadow-sm space-y-4">
    <div className="flex items-center justify-between">
      <SkeletonBlock className="h-10 w-10 rounded-xl" />
      <SkeletonBlock className="h-4 w-12 rounded-full" />
    </div>
    <SkeletonBlock className="h-8 w-24" />
    <SkeletonBlock className="h-3 w-32" />
  </div>
);

export const SkeletonChart = ({ height = 300 }) => (
  <div
    className="w-full rounded-xl bg-muted/40 dark:bg-muted/20 animate-pulse"
    style={{ height }}
  />
);

export const SkeletonTableRow = ({ columns = 4 }) => (
  <div className="flex gap-3 py-3">
    {Array.from({ length: columns }).map((_, i) => (
      <SkeletonBlock key={i} className={cn("h-4 flex-1", i === 0 && "max-w-[40%]")} />
    ))}
  </div>
);

export default SkeletonBlock;
