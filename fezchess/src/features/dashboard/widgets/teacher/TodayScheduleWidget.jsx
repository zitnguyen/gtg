import React, { memo } from "react";
import { CalendarClock } from "lucide-react";
import SectionCard from "../../cards/SectionCard";
import EmptyState from "../../cards/EmptyState";
import { SkeletonText } from "../../cards/Skeleton";

const TodayScheduleWidget = memo(function TodayScheduleWidget({
  schedule,
  loading,
}) {
  return (
    <SectionCard
      title="Lịch dạy hôm nay"
      description="Các lớp có lịch trong ngày"
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonText key={i} lines={2} />
          ))}
        </div>
      ) : !schedule || schedule.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Không có lịch dạy"
          description="Hôm nay bạn không có buổi dạy nào trên lịch."
        />
      ) : (
        <ul className="space-y-3">
          {schedule.map((item) => (
            <li
              key={item._id}
              className="rounded-xl border border-border bg-muted/20 px-4 py-3"
            >
              <div className="font-semibold text-foreground">
                {item.className || "--"}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {item.schedule || "Chưa có lịch"} ·{" "}
                {item.currentStudents || 0} học viên
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
});

export default TodayScheduleWidget;
