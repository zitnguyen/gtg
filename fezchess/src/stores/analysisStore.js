import { Chess } from "chess.js";
import { createStore } from "./createStore";
import { STARTING_FEN } from "../lib/chess/fenHelpers";

const buildInitial = () => ({
  rootFen: STARTING_FEN,
  // Linear PGN list of `{ san, fen, uci, ply }` for the active line. The data
  // shape is intentionally flat to keep selectors cheap. Variations live in
  // `branches` keyed by ply index for future tree exploration.
  moves: [],
  branches: {},
  cursor: 0,
  orientation: "white",
  pgnHeader: {},
  arrows: [],
  showEngine: true,
  showEvalGraph: true,
  hoveredEvalIndex: null,
});

export const analysisStore = createStore(buildInitial);

const computeMovesFromGame = (game) => {
  const history = game.history({ verbose: true });
  return history.map((move, idx) => ({
    san: move.san,
    uci: move.from + move.to + (move.promotion || ""),
    fen: move.after,
    ply: idx + 1,
  }));
};

export const loadFen = (fen) => {
  if (!fen) return;
  try {
    const game = new Chess(fen);
    analysisStore.setState({
      rootFen: game.fen(),
      moves: [],
      branches: {},
      cursor: 0,
      arrows: [],
    });
  } catch {
    analysisStore.setState({ ...buildInitial() });
  }
};

export const loadPgn = (pgn) => {
  const game = new Chess();
  try {
    game.loadPgn(pgn);
  } catch {
    return;
  }
  const moves = computeMovesFromGame(game);
  analysisStore.setState({
    rootFen: STARTING_FEN,
    moves,
    cursor: moves.length,
    branches: {},
    arrows: [],
  });
};

export const goToPly = (ply) => {
  analysisStore.setState((state) => ({
    ...state,
    cursor: Math.max(0, Math.min(ply, state.moves.length)),
  }));
};

export const stepBack = () =>
  analysisStore.setState((state) => ({
    ...state,
    cursor: Math.max(0, state.cursor - 1),
  }));

export const stepForward = () =>
  analysisStore.setState((state) => ({
    ...state,
    cursor: Math.min(state.moves.length, state.cursor + 1),
  }));

export const stepToStart = () =>
  analysisStore.setState((state) => ({ ...state, cursor: 0 }));

export const stepToEnd = () =>
  analysisStore.setState((state) => ({ ...state, cursor: state.moves.length }));

export const flipOrientation = () =>
  analysisStore.setState((state) => ({
    ...state,
    orientation: state.orientation === "white" ? "black" : "white",
  }));

export const playMove = (move) => {
  if (!move) return;
  const state = analysisStore.getState();
  const game = new Chess(state.rootFen);
  for (let i = 0; i < state.cursor; i += 1) {
    const past = state.moves[i];
    if (!past) break;
    try {
      game.move(past.san);
    } catch {
      break;
    }
  }
  let played;
  try {
    played = game.move(move);
  } catch {
    played = null;
  }
  if (!played) return;
  const branchKey = state.cursor;
  const newMove = {
    san: played.san,
    uci: played.from + played.to + (played.promotion || ""),
    fen: played.after,
    ply: state.cursor + 1,
  };

  // If we're at the tip, append. Otherwise create a branch and keep the active
  // line replaced. The full variation editor will consume `branches` later.
  const isAtTip = state.cursor === state.moves.length;
  if (isAtTip) {
    analysisStore.setState({
      moves: [...state.moves, newMove],
      cursor: state.cursor + 1,
    });
    return;
  }

  const branches = { ...state.branches };
  const list = branches[branchKey] ? [...branches[branchKey]] : [];
  list.push(newMove);
  branches[branchKey] = list;
  const newMoves = state.moves.slice(0, state.cursor).concat([newMove]);
  analysisStore.setState({
    moves: newMoves,
    branches,
    cursor: state.cursor + 1,
  });
};

export const setArrows = (arrows) =>
  analysisStore.setState({ arrows: Array.isArray(arrows) ? arrows : [] });

export const setHoveredEvalIndex = (index) =>
  analysisStore.setState({ hoveredEvalIndex: Number.isFinite(index) ? index : null });

export const toggleEnginePanel = () =>
  analysisStore.setState((state) => ({ ...state, showEngine: !state.showEngine }));

export const toggleEvalGraph = () =>
  analysisStore.setState((state) => ({
    ...state,
    showEvalGraph: !state.showEvalGraph,
  }));

export const resetAnalysis = () => {
  analysisStore.setState({ ...buildInitial() });
};

export const selectActiveFen = (state) => {
  if (!state) return STARTING_FEN;
  if (state.cursor === 0) return state.rootFen;
  const move = state.moves[state.cursor - 1];
  return move?.fen || state.rootFen;
};

export const selectActiveMoves = (state) =>
  state ? state.moves.slice(0, state.cursor).map((m) => m.uci) : [];
