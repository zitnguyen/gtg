import React, { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, UserPlus } from "lucide-react";
import SectionCard from "../../cards/SectionCard";
import EmptyState from "../../cards/EmptyState";
import { SkeletonTableRow } from "../../cards/Skeleton";
import { formatDateShort } from "../../utils/formatters";

const RecentEnrollmentsWidget = memo(function RecentEnrollmentsWidget({
  data,
  loading,
}) {
  const items = data || [];

  return (
    <SectionCard
      title="Ghi danh gần đây"
      description="Top 5 học viên ghi danh trong tháng"
      actions={
        <Link
          to="/enrollments"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Xem tất cả <ArrowRight size={12} />
        </Link>
      }
      bodyClassName="p-0 md:p-0"
    >
      {loading ? (
        <div className="px-5 md:px-6 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonTableRow key={i} columns={3} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Chưa có ghi danh mới"
          description="Học viên ghi danh trong tháng này sẽ hiển thị tại đây."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 md:px-6 py-2.5 text-left font-semibold">Học viên</th>
                <th className="px-3 py-2.5 text-left font-semibold">Lớp</th>
                <th className="px-3 py-2.5 text-right font-semibold">Ngày ghi danh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
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
                  <td className="px-3 py-3 text-right text-muted-foreground tabular-nums">
                    {formatDateShort(item.enrollmentDate)}
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

export default RecentEnrollmentsWidget;
