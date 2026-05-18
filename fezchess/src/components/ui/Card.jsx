import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const VARIANTS = {
  default: "border-border shadow-sm",
  elevated: "border-border shadow-elevated",
  highlight: "border-t-2 border-t-primary border-border shadow-sm",
};

const Card = forwardRef(function Card(
  { className, variant = "default", interactive = false, padded = true, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl bg-card text-card-foreground border",
        VARIANTS[variant] || VARIANTS.default,
        interactive && "transition-shadow hover:shadow-elevated",
        padded && "p-5 md:p-6",
        className,
      )}
      {...props}
    />
  );
});

const CardHeader = forwardRef(function CardHeader(
  { className, title, subtitle, action, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 pb-4 mb-4 border-b border-border",
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">
        {title ? (
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        ) : null}
        {subtitle ? (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        ) : null}
        {children}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
});

const CardTitle = forwardRef(function CardTitle({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={cn("text-base font-semibold text-foreground", className)}
      {...props}
    />
  );
});

const CardDescription = forwardRef(function CardDescription(
  { className, ...props },
  ref,
) {
  return (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
});

const CardContent = forwardRef(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} className={cn("space-y-4", className)} {...props} />;
});

const CardFooter = forwardRef(function CardFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-border",
        className,
      )}
      {...props}
    />
  );
});

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
