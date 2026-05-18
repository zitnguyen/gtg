import { useCallback, useEffect, useState } from "react";
import notificationApiService from "../services/notificationApiService";
import { markRead } from "../stores/notificationStore";

export const useNotificationDetail = (id) => {
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return undefined;
    let mounted = true;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await notificationApiService.getById(id);
        if (!mounted) return;
        setNotification(data || null);

        if (data && data.isRead === false) {
          markRead(id, true).catch(() => {});
          setNotification((prev) => (prev ? { ...prev, isRead: true } : prev));
        }
      } catch (err) {
        if (!mounted) return;
        setError(
          err?.response?.data?.message || "Không thể tải chi tiết notification.",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchDetail();
    return () => {
      mounted = false;
    };
  }, [id]);

  const toggleReadState = useCallback(async () => {
    if (!notification || !id) return;
    try {
      setToggling(true);
      const nextRead = !notification.isRead;
      await markRead(id, nextRead);
      setNotification((prev) =>
        prev
          ? { ...prev, isRead: nextRead, readAt: nextRead ? new Date() : null }
          : prev,
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Cập nhật trạng thái đọc thất bại.");
    } finally {
      setToggling(false);
    }
  }, [id, notification]);

  return {
    notification,
    loading,
    toggling,
    error,
    toggleReadState,
  };
};
