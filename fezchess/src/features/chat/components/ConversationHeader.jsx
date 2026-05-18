import { memo } from "react";
import { ArrowLeft } from "lucide-react";
import { formatRelativeActivity } from "../utils/relativeTime";

const ConversationHeader = ({
  contact,
  activity,
  isAdmin,
  isPartnerTyping,
  onClearSelection,
}) => {
  const displayName = contact
    ? contact.fullName || contact.username
    : "Chọn người để chat";

  const subtitle = (() => {
    if (!contact) return "";
    if (isPartnerTyping) return "Đang nhập tin nhắn...";
    if (isAdmin && activity) {
      return formatRelativeActivity(activity.lastSeenAt, activity.isActive);
    }
    return contact.role || "";
  })();

  return (
    <div className="h-14 md:h-16 shrink-0 px-3 sm:px-6 border-b border-border flex items-center gap-3 bg-background/80 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClearSelection}
        className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-md border border-border text-foreground hover:bg-muted"
        aria-label="Quay lại"
      >
        <ArrowLeft size={16} />
      </button>
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5 min-h-0 py-0.5">
        <div className="font-semibold text-sm md:text-base text-foreground truncate leading-tight">
          {displayName}
        </div>
        {subtitle ? (
          <div
            className={`text-[11px] md:text-xs truncate leading-tight ${
              isPartnerTyping
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
            }`}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default memo(ConversationHeader);
