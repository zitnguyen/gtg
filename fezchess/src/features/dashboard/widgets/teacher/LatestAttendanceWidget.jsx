import React, { memo } from "react";
import { ClipboardCheck } from "lucide-react";
import SectionCard from "../../cards/SectionCard";
import EmptyState from "../../cards/EmptyState";
import { SkeletonTableRow } from "../../cards/Skeleton";
import { formatDateShort } from "../../utils/formatters";

const LatestAttendanceWidget = memo(function LatestAttendanceWidget({
  attendance,
  loading,
}) {
  return (
    <SectionCard
      title="Điểm danh gần nhất"
      description="8 lượt điểm danh mới nhất"
      bodyClassName="p-0 md:p-0"
    >
      {loading ? (
        <div className="px-5 md:px-6 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonTableRow key={i} columns={4} />
          ))}
        </div>
      ) : !attendance || attendance.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Chưa có điểm danh"
          description="Hệ thống sẽ hiển thị các lượt điểm danh gần nhất tại đây."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 md:px-6 py-2.5 text-left font-semibold">Học viên</th>
                <th className="px-3 py-2.5 text-left font-semibold">Lớp</th>
                <th className="px-3 py-2.5 text-left font-semibold">Ngày</th>
                <th className="px-3 py-2.5 text-right font-semibold">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attendance.map((item) => (
                <tr
                  key={item._id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-5 md:px-6 py-3 font-medium text-foreground">
                    {item.studentId?.fullName || "--"}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {item.classId?.className || "--"}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground tabular-nums">
                    {formatDateShort(item.date)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span
                      className={
                        item.status === "present"
                          ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "inline-flex rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                      }
                    >
                      {item.status === "present" ? "Có mặt" : "Vắng"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
});

export default LatestAttendanceWidget;
