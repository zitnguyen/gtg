import { memo } from "react";

const OnlineUsersPanel = ({
  onlineContacts,
  selectedContactId,
  onSelect,
}) => {
  return (
    <div className="mb-3 px-2">
      <div className="text-xs font-semibold text-foreground mb-2">
        Đang online ({onlineContacts.length})
      </div>
      {onlineContacts.length === 0 ? (
        <div className="text-xs text-muted-foreground mb-2">
          Chưa có user online.
        </div>
      ) : (
        <div className="space-y-1 mb-2">
          {onlineContacts.slice(0, 8).map((user) => (
            <button
              key={`online-${user._id}`}
              type="button"
              onClick={() => onSelect(user._id)}
              className={`w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                String(user._id) === String(selectedContactId)
                  ? "bg-background border border-foreground text-foreground"
                  : "border border-transparent hover:bg-muted text-foreground"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span className="text-xs font-medium truncate">
                  {user.fullName || user.username}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="h-px bg-border" />
    </div>
  );
};

export default memo(OnlineUsersPanel);
