import { useCallback, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { swapTurnInFen } from "../../lib/chess/fenHelpers";

/**
 * Reusable click-to-move + drag-to-move controller.
 *
 * The hook is intentionally engine-free: the parent component owns the FEN
 * and decides whether a candidate move should be committed. We keep the side
 * mutation light by passing through the chess.js move object so callers can
 * track captures, promotions, check etc.
 */
export const useBoardInteraction = ({ fen, allowMove, onCommit }) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [invalidMessage, setInvalidMessage] = useState("");

  const game = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  const tryMove = useCallback(
    (input) => {
      const attempt = (sourceFen) => {
        const replica = new Chess(sourceFen);
        try {
          const move = replica.move(input);
          return move ? { move, fen: replica.fen() } : null;
        } catch {
          return null;
        }
      };
      let result = attempt(fen);
      if (!result) {
        result = attempt(swapTurnInFen(fen));
      }
      return result;
    },
    [fen],
  );

  const commit = useCallback(
    (input) => {
      setInvalidMessage("");
      const ok = tryMove(input);
      if (!ok) {
        setInvalidMessage("Nước đi không hợp lệ.");
        return false;
      }
      if (allowMove && !allowMove(ok.move, ok.fen)) {
        return false;
      }
      onCommit?.(ok.move, ok.fen);
      setSelectedSquare(null);
      return true;
    },
    [allowMove, onCommit, tryMove],
  );

  const onSquareClick = useCallback(
    ({ square }) => {
      if (!square) return;
      setInvalidMessage("");
      if (!selectedSquare) {
        const piece = game.get(square);
        if (!piece) return;
        setSelectedSquare(square);
        return;
      }
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }
      const ok = commit({ from: selectedSquare, to: square, promotion: "q" });
      if (!ok) {
        const piece = game.get(square);
        if (piece) setSelectedSquare(square);
        else setSelectedSquare(null);
      }
    },
    [commit, game, selectedSquare],
  );

  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }) => {
      if (!sourceSquare || !targetSquare) return false;
      return commit({ from: sourceSquare, to: targetSquare, promotion: "q" });
    },
    [commit],
  );

  const legalMoves = useMemo(() => {
    if (!selectedSquare) return [];
    try {
      return game.moves({ square: selectedSquare, verbose: true });
    } catch {
      return [];
    }
  }, [game, selectedSquare]);

  return {
    selectedSquare,
    setSelectedSquare,
    invalidMessage,
    setInvalidMessage,
    onSquareClick,
    onPieceDrop,
    legalMoves,
  };
};

export default useBoardInteraction;
