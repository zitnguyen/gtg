import React from "react";
import { cn } from "../utils/classNames";

const COLS = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  12: "grid-cols-12",
};

const GAP = {
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-5 md:gap-6",
};

const SPAN = {
  1: "col-span-1",
  2: "col-span-2 sm:col-span-2",
  3: "col-span-1 sm:col-span-2 lg:col-span-3",
  4: "col-span-1 sm:col-span-2 lg:col-span-4",
  6: "col-span-2 lg:col-span-6",
  full: "col-span-full",
};

/**
 * Responsive widget grid.
 * Supports preset column counts; custom layouts can use `columns="12"`
 * + `<WidgetGrid.Item span={6}>` to compose 12-column dashboard layouts.
 */
const WidgetGrid = ({
  columns = 4,
  gap = "lg",
  className,
  children,
}) => (
  <div
    className={cn(
      "grid",
      COLS[columns] || COLS[4],
      GAP[gap] || GAP.lg,
      className,
    )}
  >
    {children}
  </div>
);

WidgetGrid.Item = function WidgetGridItem({ span = 1, className, children }) {
  return (
    <div className={cn(SPAN[span] || SPAN[1], "min-w-0", className)}>
      {children}
    </div>
  );
};

export default WidgetGrid;
