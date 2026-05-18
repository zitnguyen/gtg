import { useCallback, useMemo } from "react";
import {
  analysisStore,
  goToPly,
  loadFen,
  loadPgn,
  flipOrientation,
  playMove,
  resetAnalysis,
  selectActiveFen,
  selectActiveMoves,
  setArrows,
  stepBack,
  stepForward,
  stepToEnd,
  stepToStart,
} from "../../../stores/analysisStore";
import { useStoreSelector } from "../../../stores/useStoreSelector";

/**
 * Provides a friendly facade over the analysis store: reactive snapshot plus
 * memoised handlers for board interaction, navigation, and PGN/FEN ingest.
 */
export const useMoveTree = () => {
  const state = useStoreSelector(analysisStore, (s) => s);

  const activeFen = useMemo(() => selectActiveFen(state), [state]);
  const activeMoves = useMemo(() => selectActiveMoves(state), [state]);

  const handlePlay = useCallback((move) => playMove(move), []);
  const handleJump = useCallback((ply) => goToPly(ply), []);
  const handleNext = useCallback(() => stepForward(), []);
  const handlePrev = useCallback(() => stepBack(), []);
  const handleStart = useCallback(() => stepToStart(), []);
  const handleEnd = useCallback(() => stepToEnd(), []);
  const handleFlip = useCallback(() => flipOrientation(), []);
  const handleLoadFen = useCallback((fen) => loadFen(fen), []);
  const handleLoadPgn = useCallback((pgn) => loadPgn(pgn), []);
  const handleReset = useCallback(() => resetAnalysis(), []);
  const handleSetArrows = useCallback((arrows) => setArrows(arrows), []);

  return {
    state,
    activeFen,
    activeMoves,
    handlePlay,
    handleJump,
    handleNext,
    handlePrev,
    handleStart,
    handleEnd,
    handleFlip,
    handleLoadFen,
    handleLoadPgn,
    handleReset,
    handleSetArrows,
  };
};

export default useMoveTree;
