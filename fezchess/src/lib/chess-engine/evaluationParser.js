// Pure helpers to parse Stockfish UCI `info` lines into structured evaluations.
// Keeping this engine-agnostic makes it trivial to unit-test or swap engines.

const NUMERIC = /^-?\d+$/;

export const parseInfoLine = (line) => {
  const text = String(line || "");
  if (!text.startsWith("info ")) return null;

  const tokens = text.split(/\s+/);
  const info = {
    raw: text,
    depth: null,
    seldepth: null,
    multipv: 1,
    nodes: null,
    nps: null,
    time: null,
    score: null,
    pv: [],
  };

  for (let i = 1; i < tokens.length; i += 1) {
    const token = tokens[i];
    switch (token) {
      case "depth":
        if (NUMERIC.test(tokens[i + 1])) info.depth = Number(tokens[++i]);
        break;
      case "seldepth":
        if (NUMERIC.test(tokens[i + 1])) info.seldepth = Number(tokens[++i]);
        break;
      case "multipv":
        if (NUMERIC.test(tokens[i + 1])) info.multipv = Number(tokens[++i]);
        break;
      case "nodes":
        if (NUMERIC.test(tokens[i + 1])) info.nodes = Number(tokens[++i]);
        break;
      case "nps":
        if (NUMERIC.test(tokens[i + 1])) info.nps = Number(tokens[++i]);
        break;
      case "time":
        if (NUMERIC.test(tokens[i + 1])) info.time = Number(tokens[++i]);
        break;
      case "score": {
        const kind = tokens[i + 1];
        const value = Number(tokens[i + 2]);
        if ((kind === "cp" || kind === "mate") && Number.isFinite(value)) {
          info.score = { type: kind, value };
          i += 2;
        }
        break;
      }
      case "pv": {
        info.pv = tokens.slice(i + 1).filter(Boolean);
        i = tokens.length;
        break;
      }
      default:
        break;
    }
  }

  return info;
};

export const parseBestMove = (line) => {
  const text = String(line || "").trim();
  if (!text.startsWith("bestmove")) return null;
  const tokens = text.split(/\s+/);
  return {
    bestmove: tokens[1] && tokens[1] !== "(none)" ? tokens[1] : null,
    ponder: tokens[3] || null,
  };
};

export const scoreToCp = (score, sideToMove = "w") => {
  if (!score) return null;
  if (score.type === "mate") {
    const sign = score.value === 0 ? 0 : score.value > 0 ? 1 : -1;
    return sign * 100000;
  }
  const cp = Number(score.value) || 0;
  return sideToMove === "b" ? -cp : cp;
};

export const formatScore = (score, sideToMove = "w") => {
  if (!score) return "0.00";
  if (score.type === "mate") {
    const moves = Math.abs(score.value);
    if (moves === 0) return "#";
    const sign = score.value > 0 ? "" : "-";
    return `${sideToMove === "b" ? (score.value > 0 ? "-" : "") : sign}M${moves}`;
  }
  const cp = scoreToCp(score, sideToMove);
  const pawns = (cp / 100).toFixed(2);
  return cp > 0 ? `+${pawns}` : pawns;
};

export const evalToBarRatio = (cp) => {
  if (cp === null || cp === undefined) return 0.5;
  if (Math.abs(cp) >= 100000) return cp > 0 ? 1 : 0;
  // Logistic squashing tuned for chess (centipawns -> 0..1 for white).
  const k = 0.004;
  return 1 / (1 + Math.exp(-cp * k));
};
