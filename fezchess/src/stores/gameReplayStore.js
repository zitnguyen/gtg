import { Chess } from "chess.js";
import { createStore } from "./createStore";

const initial = () => ({
  startFen: null,
  moves: [],
  cursor: 0,
});

export const gameReplayStore = createStore(initial);

export const setReplay = ({ startFen, moves }) =>
  gameReplayStore.setState({
    startFen: startFen || null,
    moves: Array.isArray(moves) ? moves : [],
    cursor: 0,
  });

export const goToReplayPly = (ply) =>
  gameReplayStore.setState((state) => ({
    ...state,
    cursor: Math.max(0, Math.min(ply, state.moves.length)),
  }));

export const replayNext = () =>
  gameReplayStore.setState((state) => ({
    ...state,
    cursor: Math.min(state.moves.length, state.cursor + 1),
  }));

export const replayPrev = () =>
  gameReplayStore.setState((state) => ({
    ...state,
    cursor: Math.max(0, state.cursor - 1),
  }));

export const replayResetCursor = () =>
  gameReplayStore.setState((state) => ({ ...state, cursor: 0 }));

export const computeReplayFen = (state) => {
  if (!state) return null;
  const game = new Chess(state.startFen || undefined);
  for (let i = 0; i < state.cursor; i += 1) {
    const san = state.moves[i];
    if (!san) break;
    try {
      const ok = game.move(san);
      if (!ok) break;
    } catch {
      break;
    }
  }
  return game.fen();
};
