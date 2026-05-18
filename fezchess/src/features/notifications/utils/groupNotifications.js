const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const isSameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();

export const formatGroupLabel = (date) => {
  if (!date) return "Khác";
  const targetDate = new Date(date);
  if (Number.isNaN(targetDate.getTime())) return "Khác";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(targetDate, today)) return "Hôm nay";
  if (isSameDay(targetDate, yesterday)) return "Hôm qua";

  const diffDays = Math.round(
    (startOfDay(today).getTime() - startOfDay(targetDate).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  if (diffDays > 0 && diffDays < 7) return `${diffDays} ngày trước`;

  return targetDate.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const groupNotificationsByDate = (items) => {
  if (!Array.isArray(items) || items.length === 0) return [];
  const groups = new Map();
  for (const item of items) {
    const key = item?.createdAt
      ? startOfDay(new Date(item.createdAt)).getTime()
      : 0;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.entries()]
    .sort(([keyA], [keyB]) => keyB - keyA)
    .map(([key, groupItems]) => ({
      key,
      label: key === 0 ? "Khác" : formatGroupLabel(new Date(key)),
      items: groupItems,
    }));
};

export const formatRelativeTime = (date) => {
  if (!date) return "";
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return "";
  const diffMs = Date.now() - target.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return target.toLocaleString("vi-VN");
};
