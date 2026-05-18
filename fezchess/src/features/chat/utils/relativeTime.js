export const formatRelativeActivity = (lastSeenAt, isActive) => {
  if (isActive) return "Đang hoạt động";
  if (!lastSeenAt) return "Chưa hoạt động";
  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "Chưa hoạt động";
  if (diffMs < 60 * 1000) return "Vừa hoạt động";
  const mins = Math.floor(diffMs / (60 * 1000));
  if (mins < 60) return `Hoạt động ${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hoạt động ${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `Hoạt động ${days} ngày trước`;
};

export const formatMessageTime = (value) => {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

export const formatMessageDate = (date) => {
  if (!date) return "";
  try {
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
};
