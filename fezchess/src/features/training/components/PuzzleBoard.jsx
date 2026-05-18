import { useEffect, useMemo, useState } from "react";
import {
  TrainingBoard,
  useBoardInteraction,
} from "../../chess-ui";
import { sideToMoveFromFen } from "../../../lib/chess/fenHelpers";

/**
 * Puzzle-tuned board surface. Side-to-move drives orientation automatically
 * so the player always sees their pieces from the bottom.
 */
const PuzzleBoard = ({ fen, onMove, lastMove, disabled }) => {
  const [orientation, setOrientation] = useState("white");

  useEffect(() => {
    if (!fen) return;
    setOrientation(sideToMoveFromFen(fen) === "b" ? "black" : "white");
  }, [fen]);

  const interaction = useBoardInteraction({
    fen,
    onCommit: (move) => {
      if (disabled) return;
      onMove?.({ from: move.from, to: move.to, promotion: move.promotion });
    },
  });

  const arrows = useMemo(() => [], []);

  return (
    <TrainingBoard
      id="puzzle-board"
      fen={fen}
      orientation={orientation}
      onPieceDrop={interaction.onPieceDrop}
      onSquareClick={interaction.onSquareClick}
      selectedSquare={interaction.selectedSquare}
      legalMoves={interaction.legalMoves}
      lastMove={lastMove}
      arrows={arrows}
      allowDragging={!disabled}
    />
  );
};

export default PuzzleBoard;
