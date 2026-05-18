import React, { memo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_AXIS_STYLE, CHART_TOOLTIP_STYLE } from "./chartTheme";

const LineChartView = memo(function LineChartView({
  data = [],
  dataKey = "value",
  xKey = "name",
  color = "#2563eb",
  showGrid = true,
  hideY = false,
  tooltipFormatter,
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        {showGrid ? (
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(148,163,184,0.18)"
          />
        ) : null}
        <XAxis dataKey={xKey} dy={8} {...CHART_AXIS_STYLE} />
        <YAxis hide={hideY} {...CHART_AXIS_STYLE} />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={tooltipFormatter}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={3}
          dot={{ r: 4, fill: "white", strokeWidth: 2, stroke: color }}
          activeDot={{ r: 6 }}
          isAnimationActive
          animationDuration={600}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

export const AreaChartView = memo(function AreaChartView({
  data = [],
  dataKey = "value",
  xKey = "name",
  color = "#2563eb",
  hideY = false,
  tooltipFormatter,
}) {
  const gradientId = `area-gradient-${dataKey}`;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.32} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="rgba(148,163,184,0.18)"
        />
        <XAxis dataKey={xKey} dy={8} {...CHART_AXIS_STYLE} />
        <YAxis hide={hideY} {...CHART_AXIS_STYLE} />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={tooltipFormatter}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          isAnimationActive
          animationDuration={700}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

export default LineChartView;
