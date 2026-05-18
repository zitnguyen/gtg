import React, { memo } from "react";

const NotificationListSkeleton = ({ rows = 4 }) => (
  <div className="divide-y divide-border" aria-hidden>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="px-4 py-3 animate-pulse">
        <div className="h-3 w-2/3 bg-muted rounded" />
        <div className="h-3 w-1/2 bg-muted rounded mt-2" />
        <div className="h-2 w-1/3 bg-muted/70 rounded mt-3" />
      </div>
    ))}
  </div>
);

export default memo(NotificationListSkeleton);
