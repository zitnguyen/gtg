import React, { memo } from "react";
import { NavLink, useLocation } from "react-router-dom";

const formatBadge = (badge) => {
  if (!badge) return null;
  const value = Number(badge);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value > 99 ? "99+" : String(value);
};

const SidebarItem = ({ item, collapsed = false, onNavigate }) => {
  const location = useLocation();
  const Icon = item.icon;
  const badgeText = formatBadge(item.badge);
  const isActive = item.end
    ? location.pathname === item.to
    : location.pathname === item.to ||
      location.pathname.startsWith(`${item.to}/`);

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      className={({ isActive: routerActive }) =>
        `relative group flex items-center ${
          collapsed ? "justify-center" : "gap-3"
        } px-3 py-2.5 min-h-10 rounded-lg text-[13px] font-medium transition-colors duration-150 border-l-2 ${
          routerActive
            ? "border-primary bg-primary/10 text-primary"
            : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
        }`
      }
    >
      <span
        className={`relative z-[1] inline-flex items-center justify-center w-5 h-5 shrink-0 ${
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        }`}
      >
        {Icon ? <Icon size={18} /> : null}
      </span>
      {!collapsed && (
        <span className="relative z-[1] truncate flex-1">{item.label}</span>
      )}
      {badgeText && !collapsed && (
        <span
          className={`relative z-[1] ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold font-mono ${
            item.indicator === "chat-unread"
              ? "bg-emerald-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {badgeText}
        </span>
      )}
      {badgeText && collapsed && (
        <span
          className={`absolute top-1 right-1 z-[2] w-2 h-2 rounded-full ${
            item.indicator === "chat-unread" ? "bg-emerald-500" : "bg-red-500"
          }`}
          aria-hidden
        />
      )}
    </NavLink>
  );
};

export default memo(SidebarItem);
