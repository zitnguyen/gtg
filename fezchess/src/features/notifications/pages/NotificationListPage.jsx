import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { CheckCheck, Megaphone, RefreshCcw, Inbox } from "lucide-react";
import authService from "../../../services/authService";
import courseService from "../../../services/courseService";
import { useNotificationFeed } from "../hooks/useNotificationFeed";
import { groupNotificationsByDate } from "../utils/groupNotifications";
import {
  resolveNotificationTarget,
} from "../utils/resolveNotificationTarget";
import NotificationGroup from "../components/NotificationGroup";
import NotificationListSkeleton from "../components/NotificationListSkeleton";
import NotificationEmptyState from "../components/NotificationEmptyState";

const NotificationListPage = ({ basePath = "/notifications" }) => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [courseSlugByTitle, setCourseSlugByTitle] = useState({});

  const {
    items,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    error,
    loaded,
    sentinelRef,
    onMarkRead,
    onMarkAllRead,
    onLoadMore,
  } = useNotificationFeed({ pageSize: 20 });

  useEffect(() => {
    let mounted = true;
    const loadSlugs = async () => {
      try {
        const list = await courseService.getPublishedCourses({});
        const courses = Array.isArray(list) ? list : [];
        const map = {};
        for (const course of courses) {
          const titleKey = String(course?.title || "").trim().toLowerCase();
          const slugValue = String(course?.slug || "").trim();
          if (titleKey && slugValue) map[titleKey] = slugValue;
        }
        if (mounted) setCourseSlugByTitle(map);
      } catch {
        if (mounted) setCourseSlugByTitle({});
      }
    };
    loadSlugs();
    return () => {
      mounted = false;
    };
  }, []);

  const groups = useMemo(() => groupNotificationsByDate(items), [items]);
  const isAdminBroadcastHub = basePath === "/admin/notifications";

  const handleSelect = async (item) => {
    const targetPath = resolveNotificationTarget(item, {
      role: currentUser?.role,
      basePath,
      courseSlugByTitle,
    });
    if (!item?.isRead && item?.id) {
      onMarkRead(item.id);
    }
    navigate(targetPath);
  };

  const handleToggleRead = (item) => {
    if (!item?.id) return;
    onMarkRead(item.id);
  };

  const errorMessage = useMemo(() => {
    if (!error) return "";
    const status = error?.response?.status;
    if (status === 429) {
      return "Hệ thống đang giới hạn tần suất tải, vui lòng thử lại sau vài giây.";
    }
    return "Không thể tải notification.";
  }, [error]);

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Inbox size={22} className="text-primary" />
            Trung tâm thông báo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng hợp tất cả thông báo dành cho tài khoản của bạn theo thời gian thực.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdminBroadcastHub && (
            <Link
              to="/admin/notifications/new"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
            >
              <Megaphone size={14} />
              Gửi thông báo
            </Link>
          )}
          <span className="text-xs text-muted-foreground">
            Chưa đọc:{" "}
            <strong className="text-foreground">{unreadCount}</strong>
          </span>
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            <CheckCheck size={14} />
            Đánh dấu tất cả
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 rounded-xl px-4 py-2 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
        {!loaded && loading ? (
          <NotificationListSkeleton rows={6} />
        ) : groups.length === 0 ? (
          <NotificationEmptyState
            title="Chưa có thông báo"
            description="Khi có cập nhật mới, bạn sẽ nhận được ngay tại đây."
          />
        ) : (
          <div>
            {groups.map((group) => (
              <NotificationGroup
                key={group.key}
                label={group.label}
                items={group.items}
                onSelect={handleSelect}
                onToggleRead={handleToggleRead}
              />
            ))}
            <div ref={sentinelRef} className="h-8" aria-hidden />
            {loadingMore && (
              <div className="px-4 py-3 text-center text-xs text-muted-foreground inline-flex items-center justify-center gap-2 w-full">
                <RefreshCcw size={14} className="animate-spin" />
                Đang tải thêm...
              </div>
            )}
            {!hasMore && items.length > 0 && (
              <div className="px-4 py-3 text-center text-[11px] text-muted-foreground">
                Bạn đã xem hết tất cả thông báo.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationListPage;
