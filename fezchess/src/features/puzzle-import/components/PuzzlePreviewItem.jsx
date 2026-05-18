import { memo, useMemo } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { getConfidenceTone } from "../utils/fenValidation";

const EMPTY_FEN = "8/8/8/8/8/8/8/8 w - - 0 1";

const PuzzlePreviewItem = ({
  item,
  index,
  onToggleKeep,
  onFenChange,
  onFlipToggle,
}) => {
  const boardFen = useMemo(() => {
    if (!item.validFen) return EMPTY_FEN;
    try {
      const game = new Chess(item.fen);
      return game.fen();
    } catch {
      return EMPTY_FEN;
    }
  }, [item.fen, item.validFen]);

  const tone = getConfidenceTone(item.confidence);
  const toneClass =
    tone === "high"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "medium"
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";

  return (
    <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">Board #{index + 1}</div>
          <div className="text-xs text-muted-foreground">
            index: {item.index ?? index}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${toneClass}`}>
            confidence {Math.round(Number(item.confidence || 0) * 100)}%
          </span>
          <label className="text-xs flex items-center gap-1">
            <input
              type="checkbox"
              checked={Boolean(item.keep)}
              onChange={(e) => onToggleKeep(index, e.target.checked)}
            />
            Giữ lại
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
        <div className="space-y-3">
          {item.imagePreview ? (
            <img
              src={item.imagePreview}
              alt={`Detected board ${index + 1}`}
              loading="lazy"
              className="w-full rounded-xl border border-border object-cover"
            />
          ) : (
            <div className="h-40 rounded-xl border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
              Không có preview
            </div>
          )}
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={Boolean(item.flip)}
              onChange={(e) => onFlipToggle(index, e.target.checked)}
            />
            Flip board khi detect lại
          </label>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-muted/30 p-2">
            <Chessboard
              options={{
                id: `puzzle-import-preview-${index}`,
                position: boardFen,
                boardOrientation: item.flip ? "black" : "white",
                animationDurationInMs: 120,
                boardStyle: { width: "100%", maxWidth: "260px" },
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              FEN editor
            </label>
            <textarea
              rows={3}
              value={item.fen || ""}
              onChange={(e) => onFenChange(index, e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span
              className={
                item.validFen
                  ? "font-semibold text-emerald-600"
                  : "font-semibold text-rose-600"
              }
            >
              {item.validFen ? "FEN hợp lệ" : "FEN lỗi"}
            </span>
            {item.debug?.rect ? (
              <span className="text-muted-foreground">
                rect: {item.debug.rect.join(", ")}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(PuzzlePreviewItem);
