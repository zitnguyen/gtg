import React, { memo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../utils/classNames";
import { SkeletonKpiCard } from "./Skeleton";

const TONE_STYLES = {
  increase: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  decrease: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
  neutral: "bg-muted text-muted-foreground",
};

const ICON_MAP = {
  increase: TrendingUp,
  decrease: TrendingDown,
  neutral: Minus,
};

/**
 * Reusable KPI card with optional trend, sub label, accent color and skeleton.
 *
 * Pure presentational component, memoized to avoid re-renders when parent
 * dashboards re-render but the card props are stable.
 */
const KpiCard = memo(function KpiCard({
  label,
  value,
  sub,
  trend,
  icon: Icon,
  accent = "default",
  loading = false,
  href,
  onClick,
  className,
}) {
  if (loading) return <SkeletonKpiCard />;

  const TrendIcon = trend?.tone ? ICON_MAP[trend.tone] : null;
  const interactive = Boolean(href || onClick);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={interactive ? { y: -2 } : undefined}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-background p-5 md:p-6 shadow-sm transition-shadow",
        "hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        interactive && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {Icon ? (
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl",
              accent === "primary" && "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
              accent === "violet" && "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
              accent === "emerald" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
              accent === "amber" && "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
              accent === "rose" && "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
              accent === "default" && "bg-muted text-foreground",
            )}
          >
            <Icon size={20} strokeWidth={2} />
          </div>
        ) : null}

        {trend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              TONE_STYLES[trend.tone] || TONE_STYLES.neutral,
            )}
          >
            {TrendIcon ? <TrendIcon size={12} /> : null}
            {trend.label}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        {sub ? (
          <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        ) : null}
      </div>
    </motion.div>
  );
});

export default KpiCard;
