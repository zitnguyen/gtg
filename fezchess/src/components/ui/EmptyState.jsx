import { cn } from "../../lib/utils";
import Button from "./Button";

const ICONS = {
  generic: "♟",
  students: "♞",
  class: "♜",
  attendance: "♚",
  puzzle: "♛",
  chat: "♝",
  notification: "♟",
};

export default function EmptyState({
  variant = "generic",
  title = "Chưa có dữ liệu",
  description,
  actionLabel,
  onAction,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4",
        className,
      )}
    >
      <span className="text-5xl opacity-30 select-none mb-4" aria-hidden="true">
        {ICONS[variant] || ICONS.generic}
      </span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground max-w-sm mt-1.5">{description}</p>
      ) : null}
      {action ||
        (actionLabel && onAction ? (
          <Button className="mt-4" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null)}
    </div>
  );
}
