import { forwardRef, useId } from "react";
import { cn } from "../../lib/utils";

const SIZE_CLASSES = {
  sm: "h-8 text-xs px-2.5",
  md: "h-10 text-sm px-3",
  lg: "h-11 text-base px-3.5",
};

const BASE =
  "block w-full rounded-lg border bg-background text-foreground " +
  "transition-colors duration-150 " +
  "placeholder:text-muted-foreground " +
  "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const Input = forwardRef(function Input(
  {
    className,
    size = "md",
    leftIcon,
    rightIcon,
    error,
    label,
    helper,
    errorMessage,
    type = "text",
    id: idProp,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const id = idProp || autoId;
  const borderClass = error ? "border-destructive" : "border-input";
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  const control = (
    <div className={cn(leftIcon || rightIcon ? "relative w-full" : "w-full")}>
      {leftIcon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {leftIcon}
        </span>
      ) : null}
      <input
        ref={ref}
        id={id}
        type={type}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={helper || errorMessage ? `${id}-hint` : undefined}
        className={cn(
          BASE,
          borderClass,
          sizeClass,
          leftIcon && "pl-10",
          rightIcon && "pr-10",
          className,
        )}
        {...props}
      />
      {rightIcon ? (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {rightIcon}
        </span>
      ) : null}
    </div>
  );

  if (!label && !helper && !errorMessage) return control;

  return (
    <div className="w-full space-y-1">
      {label ? (
        <label
          htmlFor={id}
          className="block text-xs font-medium text-muted-foreground"
        >
          {label}
        </label>
      ) : null}
      {control}
      {(helper || errorMessage) && (
        <p
          id={`${id}-hint`}
          className={cn(
            "text-xs",
            error || errorMessage ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {errorMessage || helper}
        </p>
      )}
    </div>
  );
});

export { Input };
export default Input;
