import React, { memo } from "react";
import { BookOpen } from "lucide-react";
import SectionCard from "../../cards/SectionCard";
import EmptyState from "../../cards/EmptyState";
import { SkeletonTableRow } from "../../cards/Skeleton";

const ClassListWidget = memo(function ClassListWidget({ classes, loading }) {
  return (
    <SectionCard
      title="Danh sách lớp và học viên"
      description="Tổng quan các lớp đang được phân công"
      bodyClassName="p-0 md:p-0"
    >
      {loading ? (
        <div className="px-5 md:px-6 py-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonTableRow key={i} columns={4} />
          ))}
        </div>
      ) : !classes || classes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Chưa có lớp"
          description="Liên hệ quản trị viên để được phân công lớp."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 md:px-6 py-2.5 text-left font-semibold">Lớp</th>
                <th className="px-3 py-2.5 text-left font-semibold">Lịch học</th>
                <th className="px-3 py-2.5 text-right font-semibold">Sĩ số</th>
                <th className="px-3 py-2.5 text-left font-semibold">Học viên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {classes.map((item) => (
                <tr
                  key={item._id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-5 md:px-6 py-3 font-medium text-foreground">
                    {item.className || "--"}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {item.schedule || "Chưa có lịch"}
                  </td>
                  <td className="px-3 py-3 text-right text-muted-foreground tabular-nums">
                    {item.currentStudents || 0}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {Array.isArray(item.students) && item.students.length > 0
                      ? item.students
                          .slice(0, 3)
                          .map((s) => s?.fullName || "--")
                          .join(", ")
                      : "Chưa có học viên"}
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

export default ClassListWidget;
