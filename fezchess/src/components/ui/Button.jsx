import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import Spinner from "./Spinner";

const VARIANT_CLASSES = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/95",
  secondary:
    "bg-secondary text-secondary-foreground border border-border hover:bg-muted",
  ghost: "bg-transparent text-foreground hover:bg-muted border border-transparent",
  danger:
    "border border-destructive/40 text-destructive bg-transparent hover:bg-destructive/10",
  teal: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
  purple:
    "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30",
  outline:
    "border border-border bg-background text-foreground hover:bg-muted",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  link: "bg-transparent text-primary underline-offset-4 hover:underline px-0 h-auto py-0",
};

const SIZE_CLASSES = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-6 text-base gap-2 rounded-lg",
  icon: "h-10 w-10 p-0 rounded-lg",
  "icon-sm": "h-8 w-8 p-0 rounded-md",
};

const BASE =
  "inline-flex items-center justify-center whitespace-nowrap font-medium " +
  "transition-all duration-150 z-active-press " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:pointer-events-none disabled:opacity-60";

const Button = forwardRef(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    type = "button",
    children,
    disabled,
    ...props
  },
  ref,
) {
  const isIconOnly = size === "icon" || size === "icon-sm";

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        BASE,
        VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary,
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        className,
      )}
      {...props}
    >
      {loading ? (
        <Spinner size={size === "sm" ? 14 : 16} />
      ) : (
        leftIcon && !isIconOnly && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )
      )}
      {isIconOnly ? children : <span className="truncate">{children}</span>}
      {!loading && rightIcon && !isIconOnly && (
        <span className="inline-flex shrink-0" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
});

export { Button };
export default Button;
