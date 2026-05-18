import React, { useEffect, useState } from "react";
import { Home } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import {
  getHomeToggleLabel,
  getHomeTogglePath,
} from "../../utils/homeToggle";
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
import HeaderToolbarButton from "./HeaderToolbarButton";
import HeaderToolbarGroup from "./HeaderToolbarGroup";
import {
  HEADER_TOOLBAR_ICON_SIZE,
  headerToolbarSeparatorClass,
} from "./headerToolbarStyles";
import { cn } from "../../lib/utils";

/** Tiện ích header portal — theme, home, TB + menu tài khoản */
export function AdminHeaderActions() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();
  const [courseSlugByTitle, setCourseSlugByTitle] = useState({});
  const notificationCenter = useNotificationCenter({ autoOpenLimit: 8 });
  useNotificationSound();

  const notificationsPath = getRoleNotificationPath(currentUser?.role);
  const homeTogglePath = getHomeTogglePath(location.pathname, currentUser?.role);
  const homeToggleLabel = getHomeToggleLabel(location.pathname, currentUser?.role);

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
    <HeaderToolbarGroup>
      <ThemeToggle />
      <HeaderToolbarButton
        onClick={() => navigate(homeTogglePath)}
        title={homeToggleLabel}
        aria-label={homeToggleLabel}
      >
        <Home size={HEADER_TOOLBAR_ICON_SIZE} aria-hidden />
      </HeaderToolbarButton>
      <span onDoubleClick={handleBellDoubleClick} className="inline-flex shrink-0">
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

      <span className={headerToolbarSeparatorClass} aria-hidden />
      <UserAccountMenu className="shrink-0" />
    </HeaderToolbarGroup>
  );
}

export default AdminHeaderActions;
