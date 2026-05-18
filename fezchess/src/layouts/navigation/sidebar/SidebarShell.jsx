import React, { memo, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SidebarSection from "./SidebarSection";
import SidebarFooter from "./SidebarFooter";
import SidebarCollapseToggle from "./SidebarCollapseToggle";
import SidebarSearchTrigger from "./SidebarSearchTrigger";
import { useSidebarStore, useSidebarActions } from "../hooks/useSidebarStore";
import { useResolvedMenu } from "../hooks/useResolvedMenu";

const SidebarShell = ({ role }) => {
  const { sections } = useResolvedMenu(role);
  const collapsed = useSidebarStore((state) => state.collapsed);
  const mobileOpen = useSidebarStore((state) => state.mobileOpen);
  const { toggleCollapsed, closeMobileDrawer, openPalette } =
    useSidebarActions();
  const location = useLocation();

  useEffect(() => {
    if (mobileOpen) closeMobileDrawer();
  }, [location.pathname]);

  const handleNavigate = useCallback(() => {
    closeMobileDrawer();
  }, [closeMobileDrawer]);

  const widthClass = collapsed ? "md:w-[68px]" : "md:w-64";

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMobileDrawer}
        aria-hidden
      />
      <aside
        className={`fixed left-0 bottom-0 top-0 md:top-14 w-[82vw] max-w-72 ${widthClass} bg-card border-r border-border z-40 transform transition-all duration-200 ease-out md:translate-x-0 flex flex-col shadow-sm h-screen md:h-[calc(100vh-3.5rem)] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Primary navigation"
      >
        <div
          className={`flex items-center gap-2 ${collapsed ? "px-2" : "px-3"} pt-3 md:pt-3`}
        >
          <SidebarSearchTrigger collapsed={collapsed} onClick={openPalette} />
          <SidebarCollapseToggle
            collapsed={collapsed}
            onToggle={toggleCollapsed}
          />
        </div>

        <nav
          className={`flex-1 min-h-0 overflow-y-auto py-3 z-scrollbar ${
            collapsed ? "px-2" : "px-3"
          }`}
        >
          {sections.map((section) => (
            <SidebarSection
              key={section.key}
              section={section}
              collapsed={collapsed}
              onNavigate={handleNavigate}
            />
          ))}
        </nav>

        <SidebarFooter collapsed={collapsed} />
      </aside>
    </>
  );
};

export default memo(SidebarShell);
