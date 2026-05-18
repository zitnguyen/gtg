import { cn } from "../../lib/utils";
import { headerToolbarButtonClass } from "./headerToolbarStyles";

export default function HeaderToolbarButton({ className, children, ...props }) {
  return (
    <button
      type="button"
      className={cn(headerToolbarButtonClass, className)}
      {...props}
    >
      {children}
    </button>
  );
}
