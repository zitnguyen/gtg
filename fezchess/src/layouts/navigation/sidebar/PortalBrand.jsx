import { memo } from "react";
import { Link } from "react-router-dom";
import { useSystemSettings } from "../../../context/SystemSettingsContext";

const PORTAL_LABELS = {
  admin: "Admin",
  teacher: "Giáo viên",
  parent: "Phụ huynh",
  student: "Học viên",
};

/** Logo + tên trung tâm — header portal (cạnh menu giữa) */
function PortalBrand({ role = "admin", compact = false, className = "" }) {
  const { settings } = useSystemSettings();
  const centerName = settings?.centerName || "Z Chess";
  const portalLabel = PORTAL_LABELS[role] || "";

  return (
    <Link
      to="/"
      className={`flex items-center gap-3 min-w-0 max-w-full hover:opacity-90 transition-opacity ${
        compact ? "justify-center w-full" : ""
      } ${className}`}
      title="Về trang chủ"
    >
      {settings?.logoUrl ? (
        <img
          src={settings.logoUrl}
          alt="Logo"
          className="w-8 h-8 rounded-lg object-cover border border-border shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
          ♟
        </div>
      )}
      {!compact ? (
        <div className="min-w-0 hidden sm:flex flex-col justify-center gap-1.5">
          <p className="font-display text-sm font-bold truncate leading-snug">
            {centerName}
          </p>
          {portalLabel ? (
            <p className="font-display text-sm font-normal uppercase tracking-wide text-muted-foreground truncate leading-snug">
              {portalLabel}
            </p>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}

export default memo(PortalBrand);
