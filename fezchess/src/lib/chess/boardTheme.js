// Centralised board styling. Keeping these tokens in one place lets every
// chess surface (lesson, analysis, puzzle) share the same premium look.

export const BOARD_THEMES = Object.freeze({
  midnight: {
    light: { backgroundColor: "#e8edf6" },
    dark: { backgroundColor: "#3a4661" },
    accentLight: "#fde68a",
    accentDark: "#facc15",
    border: "rgba(15, 23, 42, 0.55)",
  },
  emerald: {
    light: { backgroundColor: "#eef2e6" },
    dark: { backgroundColor: "#5d8350" },
    accentLight: "#f5f3ff",
    accentDark: "#a855f7",
    border: "rgba(13, 53, 32, 0.55)",
  },
  classic: {
    light: { backgroundColor: "#f0d9b5" },
    dark: { backgroundColor: "#b58863" },
    accentLight: "#fde68a",
    accentDark: "#f59e0b",
    border: "rgba(75, 50, 12, 0.45)",
  },
});

export const HIGHLIGHT_COLORS = Object.freeze({
  selected: "rgba(250, 204, 21, 0.55)",
  legal: "rgba(34, 197, 94, 0.45)",
  capture: "rgba(248, 113, 113, 0.55)",
  lastMove: "rgba(250, 204, 21, 0.32)",
  premove: "rgba(96, 165, 250, 0.45)",
  hint: "rgba(34, 211, 238, 0.45)",
  brilliant: "rgba(34, 211, 238, 0.45)",
  blunder: "rgba(239, 68, 68, 0.45)",
});

export const ARROW_COLORS = Object.freeze({
  best: "rgba(34, 197, 94, 0.85)",
  hint: "rgba(34, 211, 238, 0.9)",
  threat: "rgba(239, 68, 68, 0.9)",
  user: "rgba(250, 204, 21, 0.95)",
});

export const buildSquareHighlights = ({
  selected,
  legalMoves = [],
  lastMove = null,
  premove = null,
  hintSquare = null,
  brilliantSquare = null,
  blunderSquare = null,
} = {}) => {
  const styles = {};
  if (selected) {
    styles[selected] = {
      boxShadow: `inset 0 0 0 4px ${HIGHLIGHT_COLORS.selected}`,
    };
  }
  legalMoves.forEach((move) => {
    if (!move?.to) return;
    styles[move.to] = {
      ...styles[move.to],
      background: move.captured
        ? `radial-gradient(circle, transparent 55%, ${HIGHLIGHT_COLORS.capture} 60%)`
        : `radial-gradient(circle, ${HIGHLIGHT_COLORS.legal} 22%, transparent 25%)`,
      borderRadius: "9999px",
    };
  });
  if (lastMove) {
    [lastMove.from, lastMove.to].filter(Boolean).forEach((sq) => {
      styles[sq] = {
        ...styles[sq],
        boxShadow: `inset 0 0 0 4px ${HIGHLIGHT_COLORS.lastMove}`,
      };
    });
  }
  if (premove) {
    [premove.from, premove.to].filter(Boolean).forEach((sq) => {
      styles[sq] = {
        ...styles[sq],
        boxShadow: `inset 0 0 0 4px ${HIGHLIGHT_COLORS.premove}`,
      };
    });
  }
  if (hintSquare) {
    styles[hintSquare] = {
      ...styles[hintSquare],
      boxShadow: `inset 0 0 0 4px ${HIGHLIGHT_COLORS.hint}`,
    };
  }
  if (brilliantSquare) {
    styles[brilliantSquare] = {
      ...styles[brilliantSquare],
      boxShadow: `inset 0 0 0 4px ${HIGHLIGHT_COLORS.brilliant}`,
    };
  }
  if (blunderSquare) {
    styles[blunderSquare] = {
      ...styles[blunderSquare],
      boxShadow: `inset 0 0 0 4px ${HIGHLIGHT_COLORS.blunder}`,
    };
  }
  return styles;
};
