import React, { memo } from "react";
import SectionCard from "../../cards/SectionCard";
import ChartFrame from "../../charts/ChartFrame";
import { LazyAreaChart } from "../../charts";

const tooltipFormatter = (value) => [`${value} Elo`, "Elo"];

const EloLineWidget = memo(function EloLineWidget({ data, loading }) {
  const empty = !loading && (!data || data.length === 0);
  return (
    <SectionCard
      title="Biểu đồ phát triển Elo"
      description="Theo dõi sự tiến bộ trong 6 tháng qua"
      actions={
        <span className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground">
          6 tháng qua
        </span>
      }
    >
      <ChartFrame height={300} loading={loading} empty={empty}>
        <LazyAreaChart
          data={data || []}
          dataKey="elo"
          xKey="month"
          color="#2563eb"
          hideY
          tooltipFormatter={tooltipFormatter}
        />
      </ChartFrame>
    </SectionCard>
  );
});

export default EloLineWidget;
