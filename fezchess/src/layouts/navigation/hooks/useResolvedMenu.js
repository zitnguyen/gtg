import { useMemo } from "react";
import {
  getMenuByRole,
  flattenMenuItems,
} from "../config/menuConfig";
import { useChatUnreadBadge } from "./useChatUnreadBadge";
import { useNotificationStore } from "../../../features/notifications/hooks/useNotificationStore";

const resolveBadgeForIndicator = (indicator, ctx) => {
  switch (indicator) {
    case "chat-unread":
      return ctx.chatTotal > 0 ? ctx.chatTotal : 0;
    case "notification-unread":
      return ctx.notifTotal > 0 ? ctx.notifTotal : 0;
    default:
      return 0;
  }
};

export const useResolvedMenu = (role) => {
  const menuConfig = useMemo(() => getMenuByRole(role), [role]);
  const { totalUnread: chatTotal } = useChatUnreadBadge();
  const notifTotal = useNotificationStore((state) => state.unreadCount);

  const sections = useMemo(() => {
    if (!menuConfig?.sections) return [];
    return menuConfig.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        badge: resolveBadgeForIndicator(item.indicator, { chatTotal, notifTotal }),
      })),
    }));
  }, [menuConfig, chatTotal, notifTotal]);

  const flatItems = useMemo(
    () => flattenMenuItems({ ...menuConfig, sections }),
    [menuConfig, sections],
  );

  return { menuConfig, sections, flatItems };
};
