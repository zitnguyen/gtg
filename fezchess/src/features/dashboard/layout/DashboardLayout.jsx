import React, { Suspense } from "react";
import { cn } from "../utils/classNames";

/**
 * Dashboard layout engine. Provides a vertical stack with consistent spacing,
 * header slot, and a Suspense boundary so dashboards can lazy-load heavy
 * widgets (charts, leaderboards) without crashing the page.
 */
const DashboardLayout = ({
  header,
  banner,
  children,
  className,
  fallback = null,
}) => (
  <div className={cn("space-y-4 md:space-y-5", className)}>
    {header}
    {banner}
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  </div>
);

export default DashboardLayout;
