import { useMemo } from "react";
import {
  TrainingBoard,
  useBoardInteraction,
} from "../../chess-ui";
import { uciToSquares } from "../../../lib/chess/fenHelpers";

/**
 * Composed board surface used inside the analysis page. Owns the click /
 * drag controller but delegates to the move tree store via `onPlay`.
 */
const AnalysisBoard = ({
  fen,
  orientation = "white",
  onPlay,
  bestmoveUci,
  lastMoveUci,
}) => {
  const interaction = useBoardInteraction({
    fen,
    onCommit: (move) => {
      onPlay?.({ from: move.from, to: move.to, promotion: move.promotion });
    },
  });

  const arrows = useMemo(() => {
    const arr = [];
    if (bestmoveUci) {
      const sq = uciToSquares(bestmoveUci);
      if (sq) arr.push({ from: sq.from, to: sq.to, color: "rgba(34, 197, 94, 0.85)" });
    }
    return arr;
  }, [bestmoveUci]);

  const lastMove = useMemo(() => uciToSquares(lastMoveUci) || null, [lastMoveUci]);

  return (
    <TrainingBoard
      id="analysis-board"
      fen={fen}
      orientation={orientation}
      onPieceDrop={interaction.onPieceDrop}
      onSquareClick={interaction.onSquareClick}
      selectedSquare={interaction.selectedSquare}
      legalMoves={interaction.legalMoves}
      lastMove={lastMove}
      arrows={arrows}
    />
  );
};

export default AnalysisBoard;
