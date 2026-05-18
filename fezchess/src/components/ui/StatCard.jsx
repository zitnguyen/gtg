import { cn } from "../../lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

const VALUE_COLORS = {
  gold: "text-amber-600 dark:text-amber-400",
  teal: "text-emerald-600 dark:text-emerald-400",
  purple: "text-indigo-600 dark:text-indigo-400",
  green: "text-green-600 dark:text-green-400",
  red: "text-red-600 dark:text-red-400",
  default: "text-foreground",
};

export default function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon,
  accent = "default",
  className,
}) {
  const trendUp = typeof trend === "number" ? trend >= 0 : String(trend).startsWith("+");

  return (
    <div
      className={cn(
        "rounded-xl bg-card border border-border shadow-sm p-4 md:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <p
        className={cn(
          "font-mono text-2xl font-bold mt-2 tabular-nums",
          VALUE_COLORS[accent] || VALUE_COLORS.default,
        )}
      >
        {value}
      </p>
      {(trend != null || trendLabel) && (
        <p
          className={cn(
            "flex items-center gap-1 text-xs mt-1.5 font-medium",
            trendUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
          )}
        >
          {trend != null &&
            (trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />)}
          {trendLabel ?? (typeof trend === "number" ? `${trend > 0 ? "+" : ""}${trend}%` : trend)}
        </p>
      )}
    </div>
  );
}
