import { memo, useCallback, useState } from "react";
import { FileUp, RotateCcw, X } from "lucide-react";

const PuzzleUploadPanel = ({
  file,
  uploadProgress,
  detectionProgress,
  detectionStatus,
  isDetecting,
  onFileSelect,
  onPreview,
  onCancel,
  onRetry,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const pickFile = useCallback(
    (files) => {
      const nextFile = files?.[0] || null;
      if (nextFile) onFileSelect(nextFile);
    },
    [onFileSelect],
  );

  return (
    <div className="rounded-2xl border border-border bg-background p-5 space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          pickFile(event.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/20"
        }`}
      >
        <FileUp className="mx-auto mb-3 text-muted-foreground" size={36} />
        <div className="text-sm font-semibold text-foreground">
          Kéo thả PDF vào đây hoặc chọn file
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Hệ thống sẽ tạo detection job, poll tiến độ và trả preview FEN.
        </p>
        <label className="inline-flex mt-4 cursor-pointer rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90">
          Chọn PDF
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(event) => pickFile(event.target.files)}
          />
        </label>
        {file ? (
          <div className="mt-3 text-xs text-muted-foreground">
            File: <span className="font-semibold text-foreground">{file.name}</span>
          </div>
        ) : null}
      </div>

      {(uploadProgress > 0 || detectionProgress > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ProgressBar label="Upload" value={uploadProgress} />
          <ProgressBar label="Detection" value={detectionProgress} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPreview}
          disabled={!file || isDetecting}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isDetecting ? "Đang phân tích..." : "Preview PDF"}
        </button>
        {isDetecting ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            <X size={14} />
            Hủy upload
          </button>
        ) : null}
        {detectionStatus === "failed" ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            <RotateCcw size={14} />
            Retry detection
          </button>
        ) : null}
        <span className="text-xs text-muted-foreground">
          Trạng thái: {detectionStatus}
        </span>
      </div>
    </div>
  );
};

const ProgressBar = ({ label, value }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
      <span>{label}</span>
      <span>{Math.min(100, Math.max(0, Number(value || 0)))}%</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, Number(value || 0)))}%` }}
      />
    </div>
  </div>
);

export default memo(PuzzleUploadPanel);
