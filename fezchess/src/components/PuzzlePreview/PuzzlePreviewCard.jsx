import React from "react";

const PuzzlePreviewCard = ({
  item,
  index,
  onToggleKeep,
  onFenChange,
  onFlipToggle,
}) => {
  return (
    <div className="rounded-xl border border-border bg-background p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">Board #{index + 1}</div>
        <label className="text-xs flex items-center gap-1">
          <input
            type="checkbox"
            checked={Boolean(item.keep)}
            onChange={(e) => onToggleKeep(index, e.target.checked)}
          />
          Giữ lại
        </label>
      </div>
      {item.imagePreview ? (
        <img
          src={item.imagePreview}
          alt={`Detected board ${index + 1}`}
          className="w-full rounded-lg border border-border object-cover"
        />
      ) : (
        <div className="h-28 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
          Không có preview
        </div>
      )}
      <textarea
        rows={3}
        value={item.fen || ""}
        onChange={(e) => onFenChange(index, e.target.value)}
        className="w-full rounded-lg border border-border px-2 py-1 text-xs"
      />
      <div className="flex items-center justify-between text-xs">
        <span
          className={
            item.validFen ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"
          }
        >
          {item.validFen ? "FEN hợp lệ" : "FEN lỗi"}
        </span>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={Boolean(item.flip)}
            onChange={(e) => onFlipToggle(index, e.target.checked)}
          />
          Flip
        </label>
      </div>
    </div>
  );
};

export default PuzzlePreviewCard;
