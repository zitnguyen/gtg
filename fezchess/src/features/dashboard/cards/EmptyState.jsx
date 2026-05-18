import React from "react";
import { cn } from "../utils/classNames";

const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3 py-10 text-center",
      className,
    )}
  >
    {Icon ? (
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon size={20} />
      </div>
    ) : null}
    {title ? (
      <p className="text-sm font-semibold text-foreground">{title}</p>
    ) : null}
    {description ? (
      <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
    ) : null}
    {action ? <div className="mt-1">{action}</div> : null}
  </div>
);

export default EmptyState;
