import { Chess } from "chess.js";

export const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const isFenValid = (fen) => {
  if (!fen || typeof fen !== "string") return false;
  try {
    const game = new Chess();
    game.load(fen);
    return true;
  } catch {
    return false;
  }
};

export const sideToMoveFromFen = (fen) => {
  const parts = String(fen || "").split(" ");
  return parts[1] === "b" ? "b" : "w";
};

export const swapTurnInFen = (fen) => {
  const parts = String(fen || "").split(" ");
  if (parts.length < 2) return fen;
  parts[1] = parts[1] === "w" ? "b" : "w";
  return parts.join(" ");
};

export const cloneGame = (fenOrGame) => {
  if (fenOrGame instanceof Chess) {
    return new Chess(fenOrGame.fen());
  }
  try {
    return new Chess(fenOrGame || STARTING_FEN);
  } catch {
    return new Chess();
  }
};

export const sanListFromPgn = (pgn) => {
  if (!pgn) return [];
  try {
    const game = new Chess();
    if (game.loadPgn(pgn)) {
      return game.history();
    }
  } catch {
    // fall through
  }
  return [];
};

export const fenAfterMoves = (startFen, moves) => {
  const game = cloneGame(startFen || STARTING_FEN);
  if (Array.isArray(moves)) {
    for (const move of moves) {
      try {
        const ok = game.move(move);
        if (!ok) break;
      } catch {
        break;
      }
    }
  }
  return game.fen();
};

export const uciToSquares = (uci) => {
  if (!uci || uci.length < 4) return null;
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci.slice(4, 5) : null,
  };
};

export const sanToUci = (san, fen) => {
  if (!san) return null;
  try {
    const game = new Chess(fen || STARTING_FEN);
    const move = game.move(san);
    if (!move) return null;
    return move.from + move.to + (move.promotion || "");
  } catch {
    return null;
  }
};
