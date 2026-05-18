import React, { Suspense, memo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SkeletonChart } from "../cards/Skeleton";
import { cn } from "../utils/classNames";

/**
 * ChartFrame wraps a (lazily loaded) chart component with a fixed responsive
 * height, animated mount transition, and skeleton placeholder.
 *
 * Why the ResizeObserver gate?
 * ----------------------------
 * Recharts' <ResponsiveContainer width="100%" height="100%"> measures its
 * parent synchronously on mount. When the chart is rendered inside a CSS
 * Grid cell that hasn't been laid out yet (e.g. dashboards with lazy chunks
 * loading + Suspense boundaries), the parent reports width 0 on the first
 * frame and recharts logs "The width(-1) and height(-1) of chart should be
 * greater than 0".
 *
 * We avoid that entirely by waiting until the container has a positive
 * width before rendering the chart, falling back to <SkeletonChart> in the
 * meantime. The transition is invisible to the user because the skeleton
 * keeps the same height as the chart.
 */
const ChartFrame = memo(function ChartFrame({
  height = 280,
  loading = false,
  empty = false,
  emptyState,
  className,
  children,
}) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;
    if (typeof ResizeObserver === "undefined") {
      setReady(true);
      return undefined;
    }
    const initialWidth = node.getBoundingClientRect().width;
    if (initialWidth > 0) setReady(true);
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width || 0;
      if (width > 0) setReady(true);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (loading) {
    return <SkeletonChart height={height} />;
  }

  if (empty) {
    return (
      <div
        className={cn(
          "flex w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground",
          className,
        )}
        style={{ height }}
      >
        {emptyState ?? "Chưa có dữ liệu"}
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={cn("w-full min-w-0", className)}
      style={{ height, minHeight: height }}
    >
      {ready ? (
        <Suspense fallback={<SkeletonChart height={height} />}>
          {children}
        </Suspense>
      ) : (
        <SkeletonChart height={height} />
      )}
    </motion.div>
  );
});

export default ChartFrame;
