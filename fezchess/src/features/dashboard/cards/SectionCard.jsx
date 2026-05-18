import React, { memo } from "react";
import { cn } from "../utils/classNames";

/**
 * Reusable container for charts, lists, tables on dashboards.
 * Optional header (title + description + actions) and footer slots.
 */
const SectionCard = memo(function SectionCard({
  title,
  description,
  actions,
  footer,
  loading = false,
  loadingSkeleton,
  className,
  bodyClassName,
  children,
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-background shadow-sm",
        className,
      )}
    >
      {(title || description || actions) ? (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 md:px-6 md:pt-6">
          <div className="min-w-0">
            {title ? (
              <h3 className="text-base md:text-lg font-semibold text-foreground">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </header>
      ) : null}

      <div className={cn("flex-1 px-5 py-5 md:px-6 md:py-6 min-w-0", bodyClassName)}>
        {loading && loadingSkeleton ? loadingSkeleton : children}
      </div>

      {footer ? (
        <footer className="border-t border-border px-5 py-3 md:px-6">
          {footer}
        </footer>
      ) : null}
    </section>
  );
});

export default SectionCard;
