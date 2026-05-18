import { cn } from "../../lib/utils";

const VARIANTS = {
  gold: "bg-z-gold/12 text-z-gold",
  teal: "bg-z-teal/12 text-z-teal",
  red: "bg-z-red/12 text-z-red",
  purple: "bg-z-purple/12 text-z-purple",
  green: "bg-z-green/12 text-z-green",
  neutral: "bg-z-s3 text-z-t2",
};

export default function Badge({
  children,
  variant = "neutral",
  dot = false,
  className,
  ...props
}) {
  if (dot) {
    return (
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          variant === "gold" && "bg-z-gold",
          variant === "teal" && "bg-z-teal",
          variant === "red" && "bg-z-red",
          variant === "purple" && "bg-z-purple",
          variant === "green" && "bg-z-green",
          variant === "neutral" && "bg-z-t3",
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-medium",
        VARIANTS[variant] || VARIANTS.neutral,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
