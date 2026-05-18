import { memo } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../../../services/authService";
import { getRoleLabel } from "../../../constants/roleLabel";
import Avatar from "../../../components/ui/Avatar";

/** Hồ sơ + đăng xuất — đầu sidebar portal (thay chỗ brand cũ) */
function SidebarUserPanel({ collapsed = false }) {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const displayName =
    currentUser?.fullName || currentUser?.username || "User";

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  if (!currentUser) return null;

  return (
    <div
      className={`h-14 shrink-0 flex items-center border-b border-border bg-card ${
        collapsed ? "justify-center px-2 gap-1" : "px-3 gap-2"
      }`}
    >
      {!collapsed ? (
        <>
          <div className="h-8 w-px bg-border shrink-0" aria-hidden />
          <div className="min-w-0 flex-1 text-right">
            <p className="text-sm font-medium text-foreground truncate">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {getRoleLabel(currentUser?.role)}
            </p>
          </div>
        </>
      ) : null}
      <Avatar name={displayName} size="sm" className="shrink-0" />
      <button
        type="button"
        onClick={handleLogout}
        className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors shrink-0"
        title="Đăng xuất"
        aria-label="Đăng xuất"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}

export default memo(SidebarUserPanel);
