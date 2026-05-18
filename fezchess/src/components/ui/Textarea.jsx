import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const BASE =
  "block w-full rounded-lg border bg-card text-foreground text-sm px-3 py-2.5 " +
  "transition-colors " +
  "placeholder:text-muted-foreground/70 " +
  "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/60 " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "resize-y min-h-[88px]";

const Textarea = forwardRef(function Textarea(
  { className, error, rows = 4, ...props },
  ref,
) {
  const borderClass = error ? "border-destructive/60" : "border-input";
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={error ? "true" : undefined}
      className={cn(BASE, borderClass, className)}
      {...props}
    />
  );
});

export { Textarea };
export default Textarea;
