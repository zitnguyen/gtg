import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Separator = forwardRef(function Separator(
  { className, orientation = "horizontal", decorative = true, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "vertical" ? "w-px h-full" : "h-px w-full",
        className,
      )}
      {...props}
    />
  );
});

export { Separator };
export default Separator;
