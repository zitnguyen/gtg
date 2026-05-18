import { useEffect } from "react";
import {
  engineStore,
  runEngineAnalysis,
  setEnginePosition,
  startEngine,
  stopEngineAnalysis,
} from "../../../stores/engineStore";
import { useStoreSelector } from "../../../stores/useStoreSelector";

/**
 * Drives engine analysis for the active position. Pass the FEN of the
 * position to evaluate. The hook lazily starts the engine once and reruns
 * the search whenever the FEN changes.
 */
export const useEngineAnalysis = ({ fen, enabled = true, multipv, depth, movetime } = {}) => {
  const state = useStoreSelector(engineStore, (s) => s);

  useEffect(() => {
    if (!enabled) {
      stopEngineAnalysis();
      return undefined;
    }
    let cancelled = false;
    const run = async () => {
      const ok = await startEngine();
      if (cancelled || !ok || !fen) return;
      setEnginePosition({ fen });
      runEngineAnalysis({ depth, movetime, multipv });
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [enabled, fen, depth, movetime, multipv]);

  return state;
};

export default useEngineAnalysis;
