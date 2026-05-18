import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Label = forwardRef(function Label(
  { className, required, children, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium text-foreground/90 select-none",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span className="ml-0.5 text-destructive" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
});

export { Label };
export default Label;
