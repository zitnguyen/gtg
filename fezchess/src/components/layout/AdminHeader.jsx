import React, { useEffect, useState } from "react";
import { Home } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import { getDashboardPathByRole } from "../../constants/roleRoutes";
import ThemeToggle from "../common/ThemeToggle";
import NotificationBell from "../../features/notifications/components/NotificationBell";
import NotificationCenter from "../../features/notifications/components/NotificationCenter";
import { useNotificationCenter } from "../../features/notifications/hooks/useNotificationCenter";
import { useNotificationSound } from "../../features/notifications/hooks/useNotificationSound";
import {
  getRoleNotificationPath,
  resolveNotificationTarget,
} from "../../features/notifications/utils/resolveNotificationTarget";
import { debugPlayNotificationSound } from "../../utils/notificationSound";
import courseService from "../../services/courseService";
import UserAccountMenu from "../account/UserAccountMenu";

/** Tiện ích header portal — theme, home, TB + menu tài khoản */
export function AdminHeaderActions() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [courseSlugByTitle, setCourseSlugByTitle] = useState({});
  const notificationCenter = useNotificationCenter({ autoOpenLimit: 8 });
  useNotificationSound();

  const notificationsPath = getRoleNotificationPath(currentUser?.role);
  const dashboardPath = getDashboardPathByRole(currentUser?.role) || "/";

  useEffect(() => {
    if (!currentUser?._id && !currentUser?.userId) return undefined;
    let mounted = true;
    const loadCourseSlugs = async () => {
      try {
        const list = await courseService.getPublishedCourses({});
        const courses = Array.isArray(list) ? list : [];
        const map = {};
        courses.forEach((course) => {
          const titleKey = String(course?.title || "")
            .trim()
            .toLowerCase();
          const slugValue = String(course?.slug || "").trim();
          if (titleKey && slugValue) map[titleKey] = slugValue;
        });
        if (mounted) setCourseSlugByTitle(map);
      } catch {
        if (mounted) setCourseSlugByTitle({});
      }
    };
    loadCourseSlugs();
    return () => {
      mounted = false;
    };
  }, [currentUser?._id, currentUser?.userId]);

  const handleOpenNotificationItem = (item) => {
    const targetPath = resolveNotificationTarget(item, {
      role: currentUser?.role,
      basePath: notificationsPath,
      courseSlugByTitle,
    });
    notificationCenter.onClose();
    if (item?.id && !item.isRead) notificationCenter.onMarkRead(item.id);
    navigate(targetPath);
  };

  const handleBellDoubleClick = () => {
    debugPlayNotificationSound().then((ok) => {
      if (!ok) {
        alert(
          "Trình duyệt đang chặn âm thanh. Hãy click bất kỳ vào trang rồi thử lại.",
        );
      }
    });
  };

  return (
    <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 h-9 max-w-[min(52vw,22rem)]">
      <ThemeToggle />
      <Link
        to={dashboardPath}
        className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
        title="Về dashboard"
        aria-label="Về dashboard"
      >
        <Home size={20} />
      </Link>
      <span onDoubleClick={handleBellDoubleClick} className="inline-flex">
        <div className="relative" ref={notificationCenter.containerRef}>
          <NotificationBell
            unreadCount={notificationCenter.unreadCount}
            onClick={notificationCenter.onToggle}
            title="Thông báo (double-click để test âm thanh)"
          />
          <NotificationCenter
            open={notificationCenter.open}
            items={notificationCenter.items}
            loading={notificationCenter.loading}
            unreadCount={notificationCenter.unreadCount}
            onClose={notificationCenter.onClose}
            onSelect={handleOpenNotificationItem}
            onMarkAllRead={notificationCenter.onMarkAllRead}
            onViewAll={() => {
              notificationCenter.onClose();
              navigate(notificationsPath);
            }}
          />
        </div>
      </span>

      <div className="h-8 w-px bg-border mx-0.5 hidden sm:block shrink-0" />
      <UserAccountMenu />
    </div>
  );
}

export default AdminHeaderActions;
