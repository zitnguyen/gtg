import React, { memo } from "react";
import { Menu } from "lucide-react";
import { useSystemSettings } from "../../../context/SystemSettingsContext";
import { useSidebarActions } from "../hooks/useSidebarStore";
import { useShellTopBarOptional } from "../shell/ShellTopBarContext";

const MobileTopBar = () => {
  const { settings } = useSystemSettings();
  const { openMobileDrawer } = useSidebarActions();
  const shell = useShellTopBarOptional();
  const pageTitle = shell?.payload?.mobileTitle?.trim();

  return (
    <div className="md:hidden sticky top-0 z-30 h-14 shrink-0 bg-card/95 backdrop-blur-sm border-b border-border px-3 sm:px-6 flex items-center gap-2 sm:gap-3 min-w-0 max-w-full shadow-sm">
      <button
        type="button"
        onClick={openMobileDrawer}
        className="p-2 -ml-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
        aria-label="Mở menu"
      >
        <Menu size={22} />
      </button>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {pageTitle ? (
          <span className="font-semibold text-foreground truncate text-sm min-w-0">
            {pageTitle}
          </span>
        ) : (
          <>
            {settings?.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Center logo"
                className="w-8 h-8 rounded-md object-cover border border-border shrink-0"
              />
            ) : (
              <span className="text-xl shrink-0">♟️</span>
            )}
            <span className="font-bold text-foreground truncate">
              {settings?.centerName || "Z CHESS"}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default memo(MobileTopBar);
