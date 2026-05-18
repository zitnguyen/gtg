import { memo } from "react";
import { AlertCircle, Check, Clock, RotateCcw } from "lucide-react";
import { MESSAGE_STATUS } from "../utils/messageUtils";
import { formatMessageTime } from "../utils/relativeTime";

const StatusIcon = ({ status, isRead }) => {
  if (status === MESSAGE_STATUS.PENDING) {
    return <Clock size={10} aria-label="Đang gửi" />;
  }
  if (status === MESSAGE_STATUS.FAILED) {
    return <AlertCircle size={10} aria-label="Gửi thất bại" />;
  }
  if (isRead) {
    return <Check size={10} aria-label="Đã đọc" />;
  }
  return <Check size={10} aria-label="Đã gửi" className="opacity-60" />;
};

const MessageBubble = ({ message, isMine, onRetry }) => {
  const status = message._status || MESSAGE_STATUS.SENT;
  const isFailed = status === MESSAGE_STATUS.FAILED;
  const isPending = status === MESSAGE_STATUS.PENDING;
  const isRead = Boolean(message.readAt);

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`group relative max-w-[88%] md:max-w-[70%] px-3 py-2 rounded-2xl text-sm shadow-sm transition-all duration-150 ${
          isMine
            ? "bg-foreground text-background rounded-br-md"
            : "bg-background text-foreground border border-border rounded-bl-md"
        } ${isPending ? "opacity-80" : ""} ${
          isFailed ? "border border-rose-400/50" : ""
        }`}
      >
        {message.imageUrl ? (
          <a
            href={message.imageUrl}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <img
              src={message.imageUrl}
              alt="Tin nhắn ảnh"
              loading="lazy"
              className="rounded-lg max-h-56 object-cover mb-1"
            />
          </a>
        ) : null}
        {message.content ? (
          <div className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </div>
        ) : null}
        <div
          className={`flex items-center gap-1 text-[10px] mt-1 ${
            isMine ? "text-background/80 justify-end" : "text-muted-foreground"
          }`}
        >
          <span>{formatMessageTime(message.createdAt)}</span>
          {isMine ? (
            <span className="inline-flex items-center">
              <StatusIcon status={status} isRead={isRead} />
            </span>
          ) : null}
        </div>

        {isFailed && (
          <div className="mt-1 flex items-center justify-end gap-1 text-[11px]">
            <span className="text-rose-500">Gửi thất bại.</span>
            <button
              type="button"
              onClick={() => onRetry?.(message)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
            >
              <RotateCcw size={10} />
              Thử lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(MessageBubble);
