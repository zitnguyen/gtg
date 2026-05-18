import { ENGINE_STATUS, getEngineManager } from "../lib/chess-engine";
import { createStore } from "./createStore";

const initialState = {
  status: ENGINE_STATUS.IDLE,
  enabled: false,
  multipv: 1,
  depth: 18,
  movetime: 1500,
  lines: [],
  bestmove: null,
  sideToMove: "w",
  error: null,
  evalCpForWhite: 0,
};

const computeEvalCpForWhite = (lines, sideToMove) => {
  if (!lines || !lines.length) return 0;
  const top = lines[0];
  const cp = Number.isFinite(top?.cp) ? top.cp : 0;
  return sideToMove === "b" ? -cp : cp;
};

export const engineStore = createStore(initialState);

let unsubscribeFromManager = null;

const ensureSubscription = () => {
  if (unsubscribeFromManager) return;
  const manager = getEngineManager();
  unsubscribeFromManager = manager.subscribe((snapshot) => {
    engineStore.setState((state) => ({
      ...state,
      status: snapshot.status,
      lines: snapshot.lines,
      bestmove: snapshot.bestmove,
      sideToMove: snapshot.sideToMove,
      error: snapshot.error,
      evalCpForWhite: computeEvalCpForWhite(snapshot.lines, snapshot.sideToMove),
    }));
  });
};

export const startEngine = async () => {
  ensureSubscription();
  engineStore.setState({ enabled: true, error: null });
  const manager = getEngineManager();
  const ok = await manager.start();
  if (!ok) {
    engineStore.setState({ status: ENGINE_STATUS.UNAVAILABLE });
  }
  return ok;
};

export const stopEngineAnalysis = () => {
  const manager = getEngineManager();
  manager.stop();
};

export const disposeEngine = () => {
  const manager = getEngineManager();
  manager.dispose();
  if (unsubscribeFromManager) {
    unsubscribeFromManager();
    unsubscribeFromManager = null;
  }
  engineStore.setState({ ...initialState });
};

export const setEnginePosition = ({ fen, moves } = {}) => {
  ensureSubscription();
  const manager = getEngineManager();
  manager.setPosition({ fen, moves });
};

export const runEngineAnalysis = ({ depth, movetime, multipv } = {}) => {
  ensureSubscription();
  const manager = getEngineManager();
  const state = engineStore.getState();
  manager.analyze({
    depth: depth ?? state.depth,
    movetime: movetime ?? state.movetime,
    multipv: multipv ?? state.multipv,
  });
};

export const setEngineMultipv = (multipv) => {
  engineStore.setState({ multipv });
};

export const setEngineDepth = (depth) => {
  engineStore.setState({ depth });
};
