import React, { memo } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../../../services/authService";
import { useGlobalActivity } from "../hooks/useGlobalActivity";

const SidebarFooter = ({ collapsed = false }) => {
  const navigate = useNavigate();
  const { busy, count } = useGlobalActivity();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <div
      className={`p-3 border-t border-border space-y-2 ${
        collapsed ? "" : ""
      }`}
    >
      {!collapsed && busy && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/40 text-[11px] text-muted-foreground">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Đang đồng bộ ({count})</span>
        </div>
      )}
      <button
        type="button"
        onClick={handleLogout}
        title={collapsed ? "Đăng xuất" : undefined}
        className={`group flex items-center w-full rounded-xl text-sm font-medium transition-colors text-muted-foreground hover:bg-red-500/10 hover:text-red-500 ${
          collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
        }`}
      >
        <LogOut size={18} className="group-hover:text-red-500" />
        {!collapsed && <span>Đăng xuất</span>}
      </button>
    </div>
  );
};

export default memo(SidebarFooter);
