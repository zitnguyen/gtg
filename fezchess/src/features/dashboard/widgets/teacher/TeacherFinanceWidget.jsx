import React, { memo } from "react";
import SectionCard from "../../cards/SectionCard";
import { SkeletonText } from "../../cards/Skeleton";

const Row = ({ label, value, accent = "default" }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span
      className={
        accent === "emerald"
          ? "font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums"
          : accent === "primary"
            ? "font-semibold text-blue-600 dark:text-blue-400 tabular-nums"
            : "font-semibold text-foreground tabular-nums"
      }
    >
      {value}
    </span>
  </div>
);

const TeacherFinanceWidget = memo(function TeacherFinanceWidget({
  finance,
  loading,
}) {
  return (
    <SectionCard
      title="Thu nhập / buổi dạy"
      description="Tổng hợp thanh toán và xác nhận buổi"
    >
      {loading ? (
        <SkeletonText lines={4} />
      ) : (
        <div className="space-y-3">
          <Row label="Tổng buổi dạy" value={finance?.totalSessions ?? 0} />
          <Row
            label="Tổng giờ dạy"
            value={`${Number(finance?.totalHours || 0).toFixed(1)}h`}
          />
          <Row
            label="Buổi đã thanh toán"
            value={finance?.paidSessions ?? 0}
            accent="emerald"
          />
          <Row
            label="Buổi đã xác nhận"
            value={finance?.confirmedSessions ?? 0}
            accent="primary"
          />
        </div>
      )}
    </SectionCard>
  );
});

export default TeacherFinanceWidget;
