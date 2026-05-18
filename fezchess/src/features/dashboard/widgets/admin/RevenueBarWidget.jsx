import React, { memo } from "react";
import SectionCard from "../../cards/SectionCard";
import ChartFrame from "../../charts/ChartFrame";
import { LazyBarChart } from "../../charts";

const tooltipFormatter = (value) => [
  `${(Number(value || 0) / 1_000_000).toFixed(1)}M`,
  "Doanh thu",
];
const yTickFormatter = (value) => `${(Number(value || 0) / 1_000_000)}M`;

const RevenueBarWidget = memo(function RevenueBarWidget({ data, loading }) {
  const empty = !loading && (!data || data.length === 0);

  return (
    <SectionCard
      title="Doanh thu 6 tháng gần nhất"
      description="Theo dõi sự tăng trưởng doanh thu theo tháng"
      actions={
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          6 tháng qua
        </span>
      }
    >
      <ChartFrame height={300} loading={loading} empty={empty}>
        <LazyBarChart
          data={data || []}
          tooltipFormatter={tooltipFormatter}
          yTickFormatter={yTickFormatter}
        />
      </ChartFrame>
    </SectionCard>
  );
});

export default RevenueBarWidget;
