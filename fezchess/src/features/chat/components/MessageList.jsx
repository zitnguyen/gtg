import { memo, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { buildMessageGroups } from "../utils/messageUtils";
import { formatMessageDate } from "../utils/relativeTime";
import MessageBubble from "./MessageBubble";

const DateDivider = memo(({ date }) => (
  <div className="flex items-center gap-3 my-3">
    <div className="flex-1 h-px bg-border" />
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
      {formatMessageDate(date)}
    </div>
    <div className="flex-1 h-px bg-border" />
  </div>
));
DateDivider.displayName = "DateDivider";

const TypingHint = ({ visible }) => {
  if (!visible) return null;
  return (
    <div className="flex justify-start">
      <div className="px-3 py-2 rounded-2xl rounded-bl-md bg-background border border-border shadow-sm">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ hasContact }) => (
  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-2">
    <div className="text-4xl">💬</div>
    <div className="text-sm">
      {hasContact
        ? "Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện."
        : "Chọn một liên hệ để bắt đầu trò chuyện."}
    </div>
  </div>
);

const MessageListSkeleton = () => (
  <div className="space-y-3 p-4">
    {Array.from({ length: 5 }).map((_, idx) => (
      <div
        key={idx}
        className={`flex ${idx % 2 === 0 ? "justify-start" : "justify-end"}`}
      >
        <div
          className={`h-8 rounded-2xl bg-muted/60 animate-pulse ${
            idx % 2 === 0 ? "w-2/5" : "w-1/3"
          }`}
        />
      </div>
    ))}
  </div>
);

const MessageList = ({
  messages,
  loading,
  currentUserId,
  selectedContactId,
  isPartnerTyping,
  onRetryMessage,
}) => {
  const groups = useMemo(() => buildMessageGroups(messages), [messages]);
  const { containerRef, isNearBottom, unseenCount, scrollToBottom } =
    useAutoScroll({
      trackedKey: selectedContactId,
      currentUserId,
      messages,
    });

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto p-4 space-y-2 bg-gradient-to-b from-background to-muted/20"
      >
        {loading ? (
          <MessageListSkeleton />
        ) : groups.length === 0 ? (
          <EmptyState hasContact={Boolean(selectedContactId)} />
        ) : (
          groups.map((entry) => {
            if (entry.type === "divider") {
              return <DateDivider key={entry.id} date={entry.date} />;
            }
            const message = entry.message;
            const mine = String(message.senderId) === String(currentUserId);
            return (
              <MessageBubble
                key={entry.id}
                message={message}
                isMine={mine}
                onRetry={onRetryMessage}
              />
            );
          })
        )}
        <TypingHint visible={Boolean(selectedContactId) && isPartnerTyping} />
      </div>

      {!isNearBottom && unseenCount > 0 && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-semibold shadow-lg hover:opacity-90 transition-all"
        >
          <ChevronDown size={14} />
          {unseenCount} tin nhắn mới
        </button>
      )}
    </div>
  );
};

export default memo(MessageList);
