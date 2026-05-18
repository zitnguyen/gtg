import { memo, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { useResolvedMenu } from "../hooks/useResolvedMenu";
import { useSidebarActions } from "../hooks/useSidebarStore";
import { cn } from "../../../lib/utils";

/**
 * MobileBottomNav — chỉ hiển thị trên mobile (`md:hidden`).
 *
 * Lấy 4 mục đầu tiên từ menu role (priority items) + 1 nút "Menu" mở drawer
 * để vào sidebar đầy đủ. Tôn trọng safe-area inset bottom cho iOS.
 */
const PRIORITY_KEYS_BY_ROLE = {
  admin: ["admin-dashboard", "students", "classes", "attendance"],
  teacher: [
    "teacher-dashboard",
    "teacher-classes",
    "teacher-attendance",
    "teacher-schedule",
  ],
  parent: [
    "parent-dashboard",
    "parent-schedule",
    "parent-progress",
    "parent-courses",
  ],
  student: [
    "student-dashboard",
    "student-schedule",
    "student-courses",
    "student-daily",
  ],
};

const MobileBottomNav = ({ role }) => {
  const { flatItems } = useResolvedMenu(role);
  const { openMobileDrawer } = useSidebarActions();

  const navItems = useMemo(() => {
    if (!Array.isArray(flatItems) || flatItems.length === 0) return [];
    const priority =
      PRIORITY_KEYS_BY_ROLE[String(role || "").toLowerCase()] || [];
    if (priority.length === 0) return flatItems.slice(0, 4);
    const byKey = new Map(flatItems.map((it) => [it.key, it]));
    const picked = priority
      .map((key) => byKey.get(key))
      .filter(Boolean);
    if (picked.length >= 4) return picked.slice(0, 4);
    // fill thêm từ flat list nếu chưa đủ 4
    const remain = flatItems.filter((it) => !picked.find((p) => p.key === it.key));
    return [...picked, ...remain].slice(0, 4);
  }, [flatItems, role]);

  if (navItems.length === 0) return null;

  return (
    <nav
      aria-label="Điều hướng dưới (mobile)"
      className={cn(
        "md:hidden fixed bottom-0 inset-x-0 z-30",
        "bg-card/95 backdrop-blur-sm border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.06)]",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="grid grid-cols-5 gap-1 px-2 pt-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const badge = item.badge;
          return (
            <li key={item.key}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "relative flex flex-col items-center justify-center gap-0.5",
                    "min-h-[56px] py-1.5 rounded-xl text-[11px] font-medium",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground active:bg-muted/40",
                  )
                }
              >
                {Icon ? (
                  <Icon className="w-[22px] h-[22px]" aria-hidden="true" />
                ) : null}
                <span className="leading-none truncate max-w-[72px]">
                  {item.label}
                </span>
                {badge > 0 ? (
                  <span
                    className="absolute top-1 right-3 min-w-[16px] h-4 px-1 inline-flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-semibold"
                    aria-label={`${badge} chưa đọc`}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </NavLink>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={openMobileDrawer}
            className={cn(
              "w-full flex flex-col items-center justify-center gap-0.5",
              "min-h-[56px] py-1.5 rounded-xl text-[11px] font-medium",
              "text-muted-foreground hover:text-foreground active:bg-muted/40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            )}
            aria-label="Mở menu"
          >
            <Menu className="w-[22px] h-[22px]" aria-hidden="true" />
            <span className="leading-none">Khác</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default memo(MobileBottomNav);
