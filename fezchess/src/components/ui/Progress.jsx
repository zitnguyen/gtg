import { cn } from "../../lib/utils";

const FILLS = {
  gold: "bg-z-gold",
  teal: "bg-z-teal",
  purple: "bg-z-purple",
  green: "bg-z-green",
  red: "bg-z-red",
};

export default function Progress({
  value = 0,
  max = 100,
  variant = "gold",
  className,
  showLabel = false,
}) {
  const pct = Math.min(100, Math.max(0, (Number(value) / Number(max)) * 100));

  return (
    <div className={cn("w-full", className)}>
      {showLabel ? (
        <div className="flex justify-between text-[10px] text-z-t3 mb-1 font-mono">
          <span>{Math.round(pct)}%</span>
        </div>
      ) : null}
      <div className="h-1.5 w-full rounded-full bg-z-s3 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            FILLS[variant] || FILLS.gold,
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
