import React, { memo } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CHART_TOOLTIP_STYLE, pickColor } from "./chartTheme";

const DonutChartView = memo(function DonutChartView({
  data = [],
  dataKey = "value",
  centerLabel,
  centerValue,
  innerRadius = 70,
  outerRadius = 90,
  paddingAngle = 4,
  tooltipFormatter,
}) {
  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={paddingAngle}
            dataKey={dataKey}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive
            animationDuration={700}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill || pickColor(index)}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={tooltipFormatter}
          />
        </PieChart>
      </ResponsiveContainer>

      {(centerLabel != null || centerValue != null) ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue != null ? (
            <div className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {centerValue}
            </div>
          ) : null}
          {centerLabel ? (
            <div className="text-xs font-medium text-muted-foreground mt-0.5">
              {centerLabel}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

export default DonutChartView;
