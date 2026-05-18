import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Bell, Home } from "lucide-react";
import { useSystemSettings } from "../../context/SystemSettingsContext";
import ThemeToggle from "../common/ThemeToggle";
import authService from "../../services/authService";
import courseService from "../../services/courseService";
import { getDashboardPathByRole } from "../../constants/roleRoutes";
import AnnouncementBar from "../common/AnnouncementBar";
import NotificationBell from "../../features/notifications/components/NotificationBell";
import NotificationCenter from "../../features/notifications/components/NotificationCenter";
import { useNotificationCenter } from "../../features/notifications/hooks/useNotificationCenter";
import {
  resolveNotificationTarget,
  getRoleNotificationPath,
} from "../../features/notifications/utils/resolveNotificationTarget";
import PublicMainNav from "../navigation/PublicMainNav";
import LoginLink from "../auth/LoginLink";
import UserAccountMenu from "../account/UserAccountMenu";
import PortalBrand from "../../layouts/navigation/sidebar/PortalBrand";
import { AdminHeaderActions } from "./AdminHeader";
import { cn } from "../../lib/utils";

function SiteHeaderBrand({ onNavigateHome }) {
  const { settings } = useSystemSettings();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
      return;
    }
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={handleGoHome}
      className="flex items-center gap-3 min-w-0 text-left max-w-full"
    >
      {settings?.logoUrl ? (
        <motion.img
          whileHover={{ rotate: 8 }}
          transition={{ duration: 0.3 }}
          src={settings.logoUrl}
          alt="Logo"
          className="w-8 h-8 rounded-lg object-cover border border-border shrink-0"
        />
      ) : (
        <motion.div
          whileHover={{ rotate: 15 }}
          transition={{ duration: 0.3 }}
          className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center shrink-0"
        >
          <span className="text-sm leading-none">♔</span>
        </motion.div>
      )}
      <span className="font-display text-sm font-bold truncate h-8 flex items-center leading-none">
        {settings?.centerName || "Z Chess"}
      </span>
    </button>
  );
}

function SiteHeaderPublicActions({ onNavigate }) {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [courseSlugByTitle, setCourseSlugByTitle] = useState({});

  const notificationCenter = useNotificationCenter({ autoOpenLimit: 8 });
  const notificationsPath = getRoleNotificationPath(currentUser?.role);

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
    onNavigate?.();
  };

  return (
    <>
      <ThemeToggle />
      {currentUser ? (
        <>
          <Link
            to={getDashboardPathByRole(currentUser.role)}
            className="p-2 rounded-lg"
            title="Vào dashboard"
            aria-label="Vào dashboard"
            onClick={onNavigate}
          >
            <Home size={20} />
          </Link>
          <div className="relative" ref={notificationCenter.containerRef}>
            <NotificationBell
              unreadCount={notificationCenter.unreadCount}
              onClick={notificationCenter.onToggle}
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
                onNavigate?.();
              }}
            />
          </div>
          <span className="hidden sm:block h-8 w-px bg-border shrink-0" aria-hidden />
          <UserAccountMenu className="hidden sm:block" />
        </>
      ) : (
        <>
          <LoginLink className="text-sm font-medium" onClick={onNavigate}>
            Đăng nhập
          </LoginLink>
          <Link to="/signup" onClick={onNavigate}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-foreground text-background px-3 py-1.5 rounded-md text-sm"
            >
              Đăng ký
            </motion.button>
          </Link>
        </>
      )}
    </>
  );
}

/**
 * Header dùng chung: trang công khai (fixed) và portal (sticky, md+).
 * Menu luôn căn giữa viewport/khung header; logo & tiện ích ở hai bên.
 */
export default function SiteHeader({ mode = "public", role = "admin" }) {
  const isPublic = mode === "public";
  const [mobileOpen, setMobileOpen] = useState(false);
  const { settings } = useSystemSettings();
  const navigate = useNavigate();
  const hasAnnouncement =
    isPublic &&
    Boolean(
      settings?.announcement_enabled &&
        String(settings?.announcement_text || "").trim(),
    );

  const closeMobile = () => setMobileOpen(false);

  const handlePublicLogout = () => {
    authService.logout();
    navigate("/");
    closeMobile();
  };

  return (
    <header
      className={cn(
        "no-hover-header flex flex-col bg-card text-foreground",
        isPublic
          ? cn(
              "fixed top-0 left-0 right-0 z-[100]",
              hasAnnouncement ? "border-0" : "border-b border-border",
            )
          : "hidden md:flex fixed top-0 left-0 right-0 z-[60] h-14 shrink-0 border-b border-border bg-card shadow-sm",
      )}
    >
      <div
        className={cn(
          "relative h-14 w-full mx-auto min-w-0",
          isPublic ? "container px-3 sm:px-6 max-w-full" : "px-4 sm:px-6",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center pointer-events-none z-[1]",
            isPublic
              ? "px-[clamp(6.5rem,22vw,17.5rem)]"
              : "px-[clamp(10rem,32vw,24rem)]",
          )}
        >
          <PublicMainNav className="pointer-events-auto hidden md:flex" />
        </div>

        <div className="absolute inset-y-0 left-0 z-[2] flex items-center min-w-0 max-w-[min(42vw,17.5rem)]">
          {isPublic ? (
            <SiteHeaderBrand onNavigateHome={closeMobile} />
          ) : (
            <PortalBrand role={role} />
          )}
        </div>

        <div
          className={cn(
            "absolute inset-y-0 right-0 z-[2] flex items-center justify-end gap-2 sm:gap-3 min-w-0",
            isPublic ? "max-w-[min(42vw,17.5rem)]" : "max-w-[min(52vw,22rem)]",
          )}
        >
          <div className="hidden md:flex items-center gap-2 sm:gap-3">
            {isPublic ? (
              <SiteHeaderPublicActions />
            ) : (
              <AdminHeaderActions />
            )}
          </div>

          {isPublic ? (
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="p-2 rounded-lg"
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
              >
                {mobileOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {isPublic ? (
        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden border-t border-border"
            >
              <div className="container mx-auto px-3 sm:px-6 py-4 space-y-2">
                <PublicMainNav variant="mobile" onNavigate={closeMobile} />
                <SiteHeaderMobileAccount
                  onNavigate={closeMobile}
                  onLogout={handlePublicLogout}
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : null}

      {hasAnnouncement ? <AnnouncementBar /> : null}
    </header>
  );
}

function SiteHeaderMobileAccount({ onNavigate, onLogout }) {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const notificationsPath = getRoleNotificationPath(currentUser?.role);
  const notificationCenter = useNotificationCenter({ autoOpenLimit: 8 });

  if (!currentUser) {
    return (
      <div className="pt-2 border-t border-border space-y-2">
        <LoginLink
          onClick={onNavigate}
          className="block py-3 px-4 rounded-xl font-medium"
        >
          Đăng nhập
        </LoginLink>
        <Link
          to="/signup"
          onClick={onNavigate}
          className="block py-3 px-4 rounded-xl font-medium"
        >
          Đăng ký
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-2 border-t border-border space-y-2">
      <button
        type="button"
        onClick={() => {
          navigate(notificationsPath);
          onNavigate();
        }}
        className="w-full flex items-center gap-2 py-3 px-4 rounded-xl font-medium"
      >
        <Bell size={18} />
        <span>Thông báo</span>
        {notificationCenter.unreadCount > 0 ? (
          <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {notificationCenter.unreadCount > 99
              ? "99+"
              : notificationCenter.unreadCount}
          </span>
        ) : null}
      </button>
      <Link
        to={getDashboardPathByRole(currentUser.role)}
        onClick={onNavigate}
        className="flex items-center gap-2 py-3 px-4 rounded-xl font-medium"
      >
        <Home size={18} />
        <span>Vào dashboard</span>
      </Link>
      <button
        type="button"
        onClick={onLogout}
        className="w-full text-left py-3 px-4 rounded-xl font-medium"
      >
        Đăng xuất
      </button>
    </div>
  );
}
