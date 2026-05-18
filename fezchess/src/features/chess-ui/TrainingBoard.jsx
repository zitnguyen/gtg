import { memo, useMemo } from "react";
import { Chessboard } from "react-chessboard";
import { motion } from "framer-motion";
import {
  ARROW_COLORS,
  buildSquareHighlights,
  BOARD_THEMES,
} from "../../lib/chess/boardTheme";

/**
 * Premium chess board surface shared by lesson player, analysis board, puzzle
 * trainer and (future) game review. The component is fully controlled: it
 * never owns chess state, only renders the supplied snapshot. Interaction
 * helpers live in `useBoardInteraction`.
 */
const TrainingBoard = ({
  id = "training-board",
  fen,
  orientation = "white",
  onPieceDrop,
  onSquareClick,
  selectedSquare = null,
  legalMoves = [],
  lastMove = null,
  premove = null,
  hintSquare = null,
  brilliantSquare = null,
  blunderSquare = null,
  arrows = [],
  allowDragging = true,
  animationDurationInMs = 220,
  themeKey = "midnight",
  /**
   * Task: Lesson layout — optional pixel width so bàn cờ không bị cắt trong khung hẹp.
   * Content: Truyền `boardWidth` từ ResizeObserver (LearningPage).
   * Author: DucManh-BlueOC
   */
  boardWidth = null,
  className = "",
  style,
}) => {
  const theme = BOARD_THEMES[themeKey] || BOARD_THEMES.midnight;

  const squareStyles = useMemo(
    () =>
      buildSquareHighlights({
        selected: selectedSquare,
        legalMoves,
        lastMove,
        premove,
        hintSquare,
        brilliantSquare,
        blunderSquare,
      }),
    [
      blunderSquare,
      brilliantSquare,
      hintSquare,
      lastMove,
      legalMoves,
      premove,
      selectedSquare,
    ],
  );

  const decoratedArrows = useMemo(
    () =>
      (arrows || [])
        .filter((arrow) => arrow?.from && arrow?.to)
        .map((arrow) => ({
          startSquare: arrow.from,
          endSquare: arrow.to,
          color: arrow.color || ARROW_COLORS.best,
        })),
    [arrows],
  );

  const numericBoard =
    boardWidth != null && Number.isFinite(Number(boardWidth)) && Number(boardWidth) > 0
      ? Math.round(Number(boardWidth))
      : null;

  const options = useMemo(
    () => ({
      id,
      position: fen,
      onPieceDrop,
      onSquareClick,
      allowDragging,
      boardOrientation: orientation,
      animationDurationInMs,
      ...(numericBoard
        ? { boardWidth: numericBoard }
        : { boardStyle: { width: "100%" } }),
      squareStyles,
      arrows: decoratedArrows,
      darkSquareStyle: theme.dark,
      lightSquareStyle: theme.light,
    }),
    [
      allowDragging,
      animationDurationInMs,
      decoratedArrows,
      fen,
      id,
      numericBoard,
      onPieceDrop,
      onSquareClick,
      orientation,
      squareStyles,
      theme.dark,
      theme.light,
    ],
  );

  return (
    <motion.div
      layout={!numericBoard}
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`relative select-none ${numericBoard ? "mx-auto max-h-full max-w-full" : "h-full w-full"} ${className}`}
      style={{
        boxShadow: "0 24px 60px rgba(15, 23, 42, 0.45)",
        borderRadius: "18px",
        overflow: "hidden",
        background: "rgba(15, 23, 42, 0.5)",
        ...(numericBoard
          ? { width: numericBoard, height: numericBoard, maxWidth: "100%", maxHeight: "100%" }
          : {}),
        ...style,
      }}
    >
      <Chessboard options={options} />
    </motion.div>
  );
};

export default memo(TrainingBoard);
