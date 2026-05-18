import React, { memo, useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import SidebarShell from "../sidebar/SidebarShell";
import MobileTopBar from "../mobile/MobileTopBar";
import MobileBottomNav from "../mobile/MobileBottomNav";
import CommandPalette from "../command-palette/CommandPalette";
import AnnouncementBar from "../../../components/common/AnnouncementBar";
import { useSidebarStore, useSidebarActions } from "../hooks/useSidebarStore";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { ShellTopBarProvider } from "./ShellTopBarContext";
import PortalTopBar from "./PortalTopBar";

const AppShell = ({ role, children }) => {
  const location = useLocation();
  const contentRef = useRef(null);
  const collapsed = useSidebarStore((state) => state.collapsed);
  const paletteOpen = useSidebarStore((state) => state.paletteOpen);
  const { togglePalette, openPalette, closePalette, toggleCollapsed } =
    useSidebarActions();

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  const handleCloseOverlay = useCallback(() => {
    if (paletteOpen) closePalette();
  }, [paletteOpen, closePalette]);

  useKeyboardShortcuts({
    onOpenPalette: togglePalette,
    onToggleSidebar: toggleCollapsed,
    onCloseOverlay: handleCloseOverlay,
    onQuickSearch: openPalette,
  });

  return (
    <ShellTopBarProvider>
      <div
        data-portal={role}
        className="min-h-screen min-h-[100dvh] bg-background text-foreground w-full max-w-full min-w-0 overflow-x-hidden"
      >
        {/* Một header full-width — không lặp trên sidebar */}
        <PortalTopBar role={role} />

        <div className="flex min-h-screen min-h-[100dvh] md:pt-14">
          <SidebarShell role={role} />

          <div
            className={`flex flex-1 flex-col min-w-0 max-w-full transition-all duration-300 ${
              collapsed ? "md:pl-[68px]" : "md:pl-64"
            }`}
          >
            <MobileTopBar />
            <AnnouncementBar />
            <main
              ref={contentRef}
              className="flex-1 p-4 md:p-6 overflow-y-auto pb-24 md:pb-6"
            >
              {children}
            </main>
          </div>
        </div>

        <MobileBottomNav role={role} />
        <CommandPalette role={role} />
      </div>
    </ShellTopBarProvider>
  );
};

export default memo(AppShell);
