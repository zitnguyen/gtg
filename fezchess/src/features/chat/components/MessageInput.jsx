import { memo, useRef } from "react";
import { ImagePlus, Loader2, Send } from "lucide-react";

const MessageInput = ({
  value,
  onChange,
  onSend,
  onSendImage,
  disabled,
  uploadingImage,
  sending,
}) => {
  const fileInputRef = useRef(null);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onSendImage(file);
    }
    event.target.value = "";
  };

  const isBusy = uploadingImage || sending;
  const canSend = !disabled && !isBusy && value.trim().length > 0;

  return (
    <div className="p-2 md:p-3 border-t border-border bg-background flex items-center gap-2">
      <label
        className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border shrink-0 transition-colors ${
          disabled || isBusy
            ? "opacity-60 cursor-not-allowed"
            : "cursor-pointer hover:bg-muted"
        }`}
      >
        {uploadingImage ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <ImagePlus size={18} />
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || isBusy}
        />
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
        placeholder="Nhập tin nhắn..."
        disabled={disabled || isBusy}
      />
      <button
        type="button"
        onClick={onSend}
        disabled={!canSend}
        className="inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-xl bg-foreground text-background text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all shrink-0"
      >
        {sending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Send size={14} />
        )}
        <span className="hidden sm:inline">Gửi</span>
      </button>
    </div>
  );
};

export default memo(MessageInput);
