import React, { memo } from "react";
import SectionCard from "../../cards/SectionCard";
import ChartFrame from "../../charts/ChartFrame";
import { LazyDonutChart } from "../../charts";

const StudentLevelDonutWidget = memo(function StudentLevelDonutWidget({
  data,
  totalStudents,
  loading,
}) {
  const items = data || [];
  const empty = !loading && items.length === 0;

  return (
    <SectionCard
      title="Phân bổ trình độ"
      description={`${totalStudents || 0} học viên đang hoạt động`}
    >
      <ChartFrame height={240} loading={loading} empty={empty}>
        <LazyDonutChart
          data={items}
          centerLabel="Học viên"
          centerValue={totalStudents || 0}
        />
      </ChartFrame>

      {items.length > 0 ? (
        <ul className="mt-5 space-y-2.5">
          {items.slice(0, 4).map((item) => (
            <li
              key={item.rawName}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: item.fill }}
                />
                <span className="font-medium">{item.rawName}</span>
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                {item.value}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </SectionCard>
  );
});

export default StudentLevelDonutWidget;
