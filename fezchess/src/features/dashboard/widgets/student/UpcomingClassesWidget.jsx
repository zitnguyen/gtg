import React, { memo } from "react";
import { CalendarDays, MoreHorizontal } from "lucide-react";
import SectionCard from "../../cards/SectionCard";
import EmptyState from "../../cards/EmptyState";
import { SkeletonText } from "../../cards/Skeleton";
import { cn } from "../../utils/classNames";

const UpcomingClassesWidget = memo(function UpcomingClassesWidget({
  items,
  loading,
}) {
  return (
    <SectionCard
      title="Lớp học của bạn"
      description="Các buổi học sắp tới"
      actions={
        <MoreHorizontal size={18} className="text-muted-foreground" />
      }
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonText key={i} lines={2} />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Chưa có lớp"
          description="Bạn chưa đăng ký lớp nào."
        />
      ) : (
        <ol className="relative space-y-5">
          {items.map((cls, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${cls.id}-${index}`} className="relative flex gap-4">
                {!isLast ? (
                  <span className="absolute left-5 top-10 bottom-[-20px] w-px bg-border" />
                ) : null}
                <div
                  className={cn(
                    "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                    cls.isHighlight
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
                    <span
                      className={
                        cls.isHighlight
                          ? "text-blue-600"
                          : "text-muted-foreground"
                      }
                    >
                      {cls.date} · {cls.time}
                    </span>
                    <span
                      className={
                        cls.status === "online"
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground"
                      }
                    >
                      {cls.status === "online" ? "Online" : "Offline"}
                    </span>
                  </div>
                  <div className="mt-1 font-semibold text-foreground">
                    {cls.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {cls.teacher} · {cls.platform}
                  </div>
                  {cls.isHighlight ? (
                    <button
                      type="button"
                      className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      Vào lớp học
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
  );
});

export default UpcomingClassesWidget;
