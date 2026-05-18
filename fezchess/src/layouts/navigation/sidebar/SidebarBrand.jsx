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
  const centerName = settings?.centerName || "Z CHESS";
  const portalLabel = PORTAL_LABELS[role] || "";

  return (
    <div
      className={`h-14 shrink-0 flex items-center border-b border-border bg-card ${
        collapsed ? "justify-center px-2" : "px-4"
      }`}
    >
      {settings?.logoUrl ? (
        <img
          src={settings.logoUrl}
          alt="Logo"
          className={`rounded-lg object-cover border border-border ${
            collapsed ? "w-9 h-9" : "w-9 h-9 mr-3"
          }`}
        />
      ) : (
        <div
          className={`rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-base font-bold shadow-sm ${
            collapsed ? "w-9 h-9" : "w-9 h-9 mr-3"
          }`}
        >
          ♟
        </div>
      )}
      {!collapsed && (
        <div className="min-w-0 flex-1 flex flex-col gap-1.5">
          <div className="font-display text-sm font-bold text-foreground leading-snug truncate">
            {centerName}
          </div>
          {portalLabel ? (
            <p className="font-display text-sm font-normal uppercase tracking-wide text-muted-foreground truncate leading-snug">
              {portalLabel}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default memo(SidebarBrand);
