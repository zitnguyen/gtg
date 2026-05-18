import { memo } from "react";
import { formatRelativeActivity } from "../utils/relativeTime";

const ContactListItem = ({
  contact,
  isSelected,
  unreadCount,
  activity,
  showActivity,
  onSelect,
}) => {
  const displayName = contact.fullName || contact.username || "Liên hệ";
  const initials = String(displayName)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <button
      type="button"
      onClick={() => onSelect(contact._id)}
      className={`group w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-all duration-150 flex items-center gap-3 ${
        isSelected
          ? "bg-muted border border-foreground/40 text-foreground"
          : "border border-transparent hover:bg-muted/60 text-foreground"
      }`}
    >
      <div className="relative shrink-0">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${
            isSelected
              ? "bg-foreground text-background"
              : "bg-muted text-foreground border border-border"
          }`}
        >
          {initials || "?"}
        </div>
        {showActivity && activity?.isActive && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="font-medium truncate text-sm">{displayName}</div>
          {unreadCount > 0 && (
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-foreground text-background font-semibold">
              +{unreadCount}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {contact.role}
          {showActivity && activity ? (
            <>
              <span className="mx-1">•</span>
              {formatRelativeActivity(activity.lastSeenAt, activity.isActive)}
            </>
          ) : (
            ""
          )}
        </div>
      </div>
    </button>
  );
};

export default memo(ContactListItem);
