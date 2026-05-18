import React, { memo, useId, useRef } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import MediaThumb from "./MediaThumb";
import useMediaUploader from "../hooks/useMediaUploader";

// Reusable media uploader. Bound to a callback (`onUpload`) so it can be
// dropped into any field/form. Handles type/size validation, preview thumb,
// loading state and clear button. Backend contract unchanged.
const MediaUploader = memo(function MediaUploader({
  value,
  onChange,
  accept = "image/png,image/jpeg",
  label = "Tải lên",
  description = "PNG hoặc JPEG, tối đa 10MB",
  thumbSize = "lg",
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const { upload, uploading } = useMediaUploader({ accept });

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const url = await upload(file);
      if (url) {
        onChange?.(url);
        toast.success("Đã tải lên thành công");
      }
    } catch (error) {
      toast.error(error?.message || "Tải lên thất bại");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-stretch gap-3">
      <MediaThumb src={value} size={thumbSize} />
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor={inputId}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            {uploading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Upload size={13} />
            )}
            {uploading ? "Đang tải..." : label}
          </label>
          {value ? (
            <button
              type="button"
              onClick={() => onChange?.("")}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X size={12} /> Xoá
            </button>
          ) : null}
        </div>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          value={value || ""}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder="Hoặc dán URL trực tiếp"
          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <span className="text-[11px] text-muted-foreground">{description}</span>
      </div>
    </div>
  );
});

export default MediaUploader;
