import React, { memo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART_AXIS_STYLE,
  CHART_TOOLTIP_STYLE,
  pickColor,
} from "./chartTheme";

const defaultFormatter = (v) => v;

const BarChartView = memo(function BarChartView({
  data = [],
  dataKey = "value",
  xKey = "name",
  highlightLastIndex = true,
  yTickFormatter = defaultFormatter,
  tooltipFormatter,
  baseColor = "#3b82f6",
  mutedColor = "#e5e7eb",
  barSize = 36,
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barSize={barSize}>
        <XAxis dataKey={xKey} dy={8} {...CHART_AXIS_STYLE} />
        <YAxis tickFormatter={yTickFormatter} {...CHART_AXIS_STYLE} />
        <Tooltip
          cursor={{ fill: "rgba(148,163,184,0.08)" }}
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={tooltipFormatter}
        />
        <Bar dataKey={dataKey} radius={[6, 6, 6, 6]}>
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                highlightLastIndex && index === data.length - 1
                  ? baseColor
                  : mutedColor
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

export const BarChartViewMulti = memo(function BarChartViewMulti({
  data = [],
  dataKey = "value",
  xKey = "name",
  yTickFormatter = defaultFormatter,
  tooltipFormatter,
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barSize={28}>
        <XAxis dataKey={xKey} dy={8} {...CHART_AXIS_STYLE} />
        <YAxis tickFormatter={yTickFormatter} {...CHART_AXIS_STYLE} />
        <Tooltip
          cursor={{ fill: "rgba(148,163,184,0.08)" }}
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={tooltipFormatter}
        />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={pickColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

export default BarChartView;
