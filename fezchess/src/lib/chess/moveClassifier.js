// Move quality classification based on centipawn-loss heuristics, modelled
// after the buckets used by Chess.com / Lichess. The thresholds are tuned for
// our learning use-case where we reward good moves and warn loudly about
// blunders to keep the experience encouraging.

export const MOVE_QUALITY = Object.freeze({
  BRILLIANT: "brilliant",
  GREAT: "great",
  BEST: "best",
  EXCELLENT: "excellent",
  GOOD: "good",
  INACCURACY: "inaccuracy",
  MISTAKE: "mistake",
  BLUNDER: "blunder",
  BOOK: "book",
});

export const MOVE_QUALITY_META = Object.freeze({
  brilliant: {
    label: "Tuyệt diệu",
    short: "!!",
    color: "#22d3ee",
    intent: "celebrate",
  },
  great: {
    label: "Xuất sắc",
    short: "!",
    color: "#34d399",
    intent: "celebrate",
  },
  best: {
    label: "Nước hay nhất",
    short: "★",
    color: "#10b981",
    intent: "positive",
  },
  excellent: {
    label: "Rất tốt",
    short: "✓",
    color: "#22c55e",
    intent: "positive",
  },
  good: {
    label: "Tốt",
    short: "✓",
    color: "#84cc16",
    intent: "positive",
  },
  inaccuracy: {
    label: "Thiếu chính xác",
    short: "?!",
    color: "#facc15",
    intent: "warn",
  },
  mistake: {
    label: "Sai lầm",
    short: "?",
    color: "#f97316",
    intent: "danger",
  },
  blunder: {
    label: "Nước thua",
    short: "??",
    color: "#ef4444",
    intent: "danger",
  },
  book: {
    label: "Khai cuộc sách",
    short: "B",
    color: "#a855f7",
    intent: "info",
  },
});

const clampMate = (cp) => {
  if (cp === null || cp === undefined) return null;
  if (cp >= 100000) return 1500;
  if (cp <= -100000) return -1500;
  return cp;
};

/**
 * Classify a move based on the eval delta from the engine's perspective.
 *
 * @param {object} args
 * @param {number|null} args.evalBefore  Centipawns from the side-to-move's POV before the move.
 * @param {number|null} args.evalAfter   Centipawns from same POV after the move (negate engine eval if needed).
 * @param {string|null} [args.bestMoveUci] The engine's preferred move before user moved.
 * @param {string|null} [args.playedUci]   The user's actual move in UCI form.
 * @param {boolean}     [args.isOnlyMove]  Forced/only legal move marker.
 * @param {boolean}     [args.isBookMove]  Opening-book hit marker.
 * @returns {{ quality: string, delta: number }}
 */
export const classifyMove = ({
  evalBefore,
  evalAfter,
  bestMoveUci = null,
  playedUci = null,
  isOnlyMove = false,
  isBookMove = false,
}) => {
  if (isBookMove) return { quality: MOVE_QUALITY.BOOK, delta: 0 };

  const before = clampMate(evalBefore);
  const after = clampMate(evalAfter);
  if (before === null || after === null) {
    return { quality: MOVE_QUALITY.GOOD, delta: 0 };
  }

  // delta is the centipawn loss from the player's side.
  const delta = before - after;

  if (
    bestMoveUci &&
    playedUci &&
    bestMoveUci.slice(0, 4) === playedUci.slice(0, 4)
  ) {
    if (delta <= -150) return { quality: MOVE_QUALITY.BRILLIANT, delta };
    if (delta <= -40) return { quality: MOVE_QUALITY.GREAT, delta };
    return { quality: MOVE_QUALITY.BEST, delta };
  }

  if (isOnlyMove) return { quality: MOVE_QUALITY.BEST, delta };

  if (delta <= 15) return { quality: MOVE_QUALITY.EXCELLENT, delta };
  if (delta <= 50) return { quality: MOVE_QUALITY.GOOD, delta };
  if (delta <= 120) return { quality: MOVE_QUALITY.INACCURACY, delta };
  if (delta <= 250) return { quality: MOVE_QUALITY.MISTAKE, delta };
  return { quality: MOVE_QUALITY.BLUNDER, delta };
};

export const explainMoveQuality = (quality) => {
  const meta = MOVE_QUALITY_META[quality];
  if (!meta) return "Một nước đi.";
  switch (quality) {
    case MOVE_QUALITY.BRILLIANT:
      return "Một nước đi cực kỳ sáng tạo và mạnh mẽ.";
    case MOVE_QUALITY.GREAT:
      return "Đây là nước duy nhất tốt và rất khó tìm.";
    case MOVE_QUALITY.BEST:
      return "Đúng nước máy đề xuất.";
    case MOVE_QUALITY.EXCELLENT:
      return "Một lựa chọn rất chính xác.";
    case MOVE_QUALITY.GOOD:
      return "Nước đi tốt, không mất ưu thế.";
    case MOVE_QUALITY.INACCURACY:
      return "Hơi thiếu chính xác, có lựa chọn tốt hơn.";
    case MOVE_QUALITY.MISTAKE:
      return "Sai lầm, làm giảm thế trận.";
    case MOVE_QUALITY.BLUNDER:
      return "Nước thua đáng kể, hãy xem lại biến đề xuất.";
    case MOVE_QUALITY.BOOK:
      return "Khai cuộc trong sách lý thuyết.";
    default:
      return "Một nước đi.";
  }
};
