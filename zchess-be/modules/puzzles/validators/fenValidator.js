const { Chess } = require("chess.js");

const normalizeText = (value) => String(value || "").trim();

const isValidFen = (fen) => {
  const normalized = normalizeText(fen);
  if (!normalized) return false;
  try {
    const game = new Chess();
    game.load(normalized);
    return true;
  } catch {
    return false;
  }
};

const assertValidFen = (fen, message = "FEN không hợp lệ") => {
  if (!isValidFen(fen)) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
};

module.exports = {
  assertValidFen,
  isValidFen,
  normalizeText,
};
