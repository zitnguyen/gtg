import React, { memo } from "react";
import NotificationItem from "./NotificationItem";

const NotificationGroup = ({ label, items, onSelect, onToggleRead }) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <section>
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur px-4 py-2 border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
        {label}
      </header>
      <div className="divide-y divide-border/60">
        {items.map((item) => (
          <NotificationItem
            key={`${item.id}-${item.recipientId || item.id}`}
            item={item}
            onSelect={onSelect}
            onToggleRead={onToggleRead}
          />
        ))}
      </div>
    </section>
  );
};

export default memo(NotificationGroup);
