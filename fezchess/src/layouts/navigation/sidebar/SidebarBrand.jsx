import React, { memo } from "react";
import { useSystemSettings } from "../../../context/SystemSettingsContext";

const PORTAL_LABELS = {
  admin: "Admin",
  teacher: "Giáo viên",
  parent: "Phụ huynh",
  student: "Học viên",
};

const SidebarBrand = ({ collapsed = false, role = "admin" }) => {
  const { settings } = useSystemSettings();
  const centerName = settings?.centerName || "Z Chess";
  const portalLabel = PORTAL_LABELS[role] || "";

  return (
    <div
      className={`shrink-0 flex items-center border-b border-border bg-card ${
        collapsed ? "h-14 justify-center px-2" : "gap-3 px-3 py-3"
      }`}
    >
      {settings?.logoUrl ? (
        <img
          src={settings.logoUrl}
          alt="Logo"
          className="w-9 h-9 rounded-lg object-cover border border-border shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-base font-bold shadow-sm shrink-0">
          ♟
        </div>
      )}
      {!collapsed && (
        <div className="min-w-0 flex-1 flex flex-col items-center justify-center text-center gap-1 leading-tight">
          <p className="font-display text-sm font-bold text-foreground truncate max-w-full">
            {centerName}
          </p>
          {portalLabel ? (
            <p className="font-display text-sm font-normal uppercase tracking-wide text-muted-foreground truncate max-w-full">
              {portalLabel}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default memo(SidebarBrand);
