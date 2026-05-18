// Centralised chart palette and tooltip styling so every analytics chart
// in the dashboard system has consistent theming and respects dark mode
// through CSS variables exposed by the global theme system.

export const CHART_PALETTE = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#22c55e",
  "#eab308",
  "#ef4444",
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
];

export const CHART_TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid rgba(148, 163, 184, 0.2)",
  background: "var(--popover, #ffffff)",
  color: "var(--popover-foreground, #0f172a)",
  boxShadow: "0 8px 24px -8px rgba(15, 23, 42, 0.18)",
  fontSize: 12,
  padding: "8px 12px",
};

export const CHART_AXIS_STYLE = {
  axisLine: false,
  tickLine: false,
  tick: { fill: "currentColor", fontSize: 12, opacity: 0.6 },
};

export const pickColor = (index) =>
  CHART_PALETTE[index % CHART_PALETTE.length];
