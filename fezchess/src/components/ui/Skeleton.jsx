import { cn } from "../../lib/utils";

const shimmer =
  "bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("rounded-md", shimmer, className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm",
        className,
      )}
    >
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

export function SkeletonList({ count = 4, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

export default Skeleton;
