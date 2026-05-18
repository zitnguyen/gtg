import React, { memo } from "react";
import SidebarItem from "./SidebarItem";

const SidebarSection = ({ section, collapsed, onNavigate }) => {
  if (!section?.items?.length) return null;

  return (
    <div className="mb-4 last:mb-0">
      {section.label && !collapsed && (
        <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {section.label}
        </div>
      )}
      {collapsed && section.label && (
        <div
          className="mx-3 my-2 h-px bg-border/70"
          aria-hidden
        />
      )}
      <div className="space-y-0.5">
        {section.items.map((item) => (
          <SidebarItem
            key={item.key}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(SidebarSection);
