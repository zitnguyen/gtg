import React, { memo, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  Loader2,
  Redo,
  RotateCcw,
  Save,
  Undo,
} from "lucide-react";
import { motion } from "framer-motion";
import useEditorStatus from "../hooks/useEditorStatus";
import { editorStore } from "../hooks/useEditorStore";
import { cn } from "../utils/classNames";

const formatRelative = (timestamp) => {
  if (!timestamp) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 5) return "vừa xong";
  if (seconds < 60) return `${seconds}s trước`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  return `${hours} giờ trước`;
};

const StatusBadge = ({ status, dirty, savedAt, error }) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 15000);
    return () => window.clearInterval(id);
  }, []);

  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
        <Loader2 size={13} className="animate-spin" /> Đang lưu...
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
        title={error?.message}
      >
        <CircleAlert size={13} /> Lưu thất bại
      </span>
    );
  }
  if (dirty) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
        <CircleAlert size={13} /> Có thay đổi chưa lưu
      </span>
    );
  }
  if (savedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 size={13} /> Đã lưu · {formatRelative(savedAt)}
      </span>
    );
  }
  return null;
};

const ToolbarButton = ({
  onClick,
  disabled,
  icon: Icon,
  label,
  variant = "ghost",
  title,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title || label}
    className={cn(
      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
      "disabled:cursor-not-allowed disabled:opacity-50",
      variant === "primary"
        ? "bg-foreground text-background hover:opacity-90"
        : variant === "danger"
          ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
          : "border border-border bg-background text-foreground hover:bg-muted/50",
    )}
  >
    {Icon ? <Icon size={13} /> : null}
    {label}
  </button>
);

// Sticky top toolbar containing the page back action, status pill, undo/redo
// stack controls, viewport switcher placeholder, preview toggle, and a
// manual Save button (which simply triggers `flush`).
const EditorToolbar = memo(function EditorToolbar({
  onBack,
  onFlush,
  showPreview,
  onTogglePreview,
}) {
  const { status, dirty, canUndo, canRedo, savedAt, lastError } =
    useEditorStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-5 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} /> Quay lại
        </button>
        <span className="hidden h-5 w-px bg-border md:inline-block" />
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-foreground">
            Public CMS Builder
          </h1>
          <StatusBadge
            status={status}
            dirty={dirty}
            savedAt={savedAt}
            error={lastError}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <ToolbarButton
          icon={Undo}
          label="Undo"
          title="Hoàn tác (Ctrl/Cmd+Z)"
          onClick={() => editorStore.undo()}
          disabled={!canUndo}
        />
        <ToolbarButton
          icon={Redo}
          label="Redo"
          title="Làm lại (Ctrl/Cmd+Shift+Z)"
          onClick={() => editorStore.redo()}
          disabled={!canRedo}
        />
        <ToolbarButton
          icon={RotateCcw}
          label="Khôi phục"
          variant="danger"
          title="Trở về trạng thái đã lưu"
          onClick={() => {
            if (window.confirm("Khôi phục về trạng thái đã lưu?"))
              editorStore.reset();
          }}
          disabled={!dirty}
        />
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          icon={showPreview ? EyeOff : Eye}
          label={showPreview ? "Ẩn preview" : "Hiện preview"}
          onClick={onTogglePreview}
        />
        <ToolbarButton
          icon={status === "saving" ? Loader2 : Save}
          label={status === "saving" ? "Đang lưu" : "Lưu"}
          variant="primary"
          onClick={onFlush}
          disabled={!dirty || status === "saving"}
        />
      </div>
    </motion.div>
  );
});

export default EditorToolbar;
