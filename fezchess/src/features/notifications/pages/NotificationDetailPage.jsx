import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { useNotificationDetail } from "../hooks/useNotificationDetail";

const NotificationDetailPage = ({ basePath = "/notifications" }) => {
  const { id } = useParams();
  const { notification, loading, toggling, error, toggleReadState } =
    useNotificationDetail(id);

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-3xl mx-auto">
      <Link
        to={basePath}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Quay lại danh sách
      </Link>

      {loading ? (
        <div className="bg-background border border-border rounded-2xl p-6 text-muted-foreground text-sm inline-flex items-center gap-2">
          <RefreshCcw size={14} className="animate-spin" />
          Đang tải chi tiết...
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 rounded-xl px-4 py-2 text-sm">
          {error}
        </div>
      ) : notification ? (
        <article className="bg-background border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {notification.title}
            </h1>
            <button
              type="button"
              onClick={toggleReadState}
              disabled={toggling}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              {toggling
                ? "Đang cập nhật..."
                : notification.isRead
                  ? "Đánh dấu chưa đọc"
                  : "Đánh dấu đã đọc"}
            </button>
          </header>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>
              Gửi lúc:{" "}
              {notification.createdAt
                ? new Date(notification.createdAt).toLocaleString("vi-VN")
                : "--"}
            </div>
            <div>
              Người gửi:{" "}
              {notification.createdBy?.fullName ||
                notification.createdBy?.username ||
                "System"}
            </div>
          </div>
          <div className="prose max-w-none text-foreground whitespace-pre-wrap">
            {notification.content}
          </div>
        </article>
      ) : (
        <div className="bg-background border border-border rounded-2xl p-6 text-muted-foreground text-sm">
          Notification không tồn tại.
        </div>
      )}
    </div>
  );
};

export default NotificationDetailPage;
