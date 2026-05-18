import { memo } from "react";
import PuzzlePreviewItem from "./PuzzlePreviewItem";

const PuzzlePreviewGrid = ({
  items,
  stats,
  saving,
  onToggleKeep,
  onFenChange,
  onFlipToggle,
  onSelectAllValid,
  onClearSelection,
  onConfirmSave,
}) => {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">Preview phát hiện bàn cờ</h3>
          <p className="text-xs text-muted-foreground">
            {stats.valid}/{stats.total} FEN hợp lệ, {stats.selected} đang chọn.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSelectAllValid}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Chọn FEN hợp lệ
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Bỏ chọn
          </button>
          <button
            type="button"
            onClick={onConfirmSave}
            disabled={saving || stats.selected === 0}
            className="rounded-lg bg-foreground px-4 py-1.5 text-sm font-semibold text-background disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Confirm lưu puzzle"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <PuzzlePreviewItem
            key={`${index}-${item.fen}-${item.validFen}`}
            item={item}
            index={index}
            onToggleKeep={onToggleKeep}
            onFenChange={onFenChange}
            onFlipToggle={onFlipToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(PuzzlePreviewGrid);
