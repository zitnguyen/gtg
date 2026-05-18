// Lazy chart loaders. Charts are heavy (recharts ~80KB gz) so each chart
// type is wrapped in React.lazy and pre-bundled into its own chunk.
import { lazy } from "react";

export { default as ChartFrame } from "./ChartFrame";
export const LazyBarChart = lazy(() => import("./BarChartView"));
export const LazyBarChartMulti = lazy(() =>
  import("./BarChartView").then((mod) => ({ default: mod.BarChartViewMulti })),
);
export const LazyLineChart = lazy(() => import("./LineChartView"));
export const LazyAreaChart = lazy(() =>
  import("./LineChartView").then((mod) => ({ default: mod.AreaChartView })),
);
export const LazyDonutChart = lazy(() => import("./DonutChartView"));
export const LazyMountainRankChart = lazy(() => import("./MountainRankChart"));
