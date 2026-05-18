import { Chess } from "chess.js";

export const isValidFen = (fen) => {
  try {
    const game = new Chess();
    game.load(String(fen || "").trim());
    return true;
  } catch {
    return false;
  }
};

export const normalizePreviewItem = (row, index) => ({
  ...row,
  index: row?.index ?? index,
  keep: Boolean(row?.validFen),
  flip: false,
  validFen: Boolean(row?.validFen) && isValidFen(row?.fen),
  confidence: Number(row?.confidence || 0),
});

export const getConfidenceTone = (confidence) => {
  const value = Number(confidence || 0);
  if (value >= 0.72) return "high";
  if (value >= 0.5) return "medium";
  return "low";
};
