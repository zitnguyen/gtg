import { useCallback, useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { trainingStore, advancePuzzle, startSession, tickSession } from "../../../stores/trainingStore";
import { useStoreSelector } from "../../../stores/useStoreSelector";
import {
  fetchPuzzleQueue,
  shufflePool,
  submitPuzzleMove,
} from "../services/puzzleTrainingService";
import { playCorrectSound, playWrongSound } from "../../../lib/chess/boardSounds";

const RUSH_DURATION_SEC = 180;

export const usePuzzleRushSession = ({ studentId, mode = "rush" } = {}) => {
  const state = useStoreSelector(trainingStore, (s) => s);
  const [boardFen, setBoardFen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // session timer tick
  useEffect(() => {
    if (state.status !== "active") return undefined;
    if (!state.endsAt) return undefined;
    const id = window.setInterval(() => tickSession(), 500);
    return () => window.clearInterval(id);
  }, [state.endsAt, state.status]);

  useEffect(() => {
    if (state.currentPuzzle?.fen) {
      setBoardFen(state.currentPuzzle.fen);
      setFeedback(null);
    } else {
      setBoardFen(null);
    }
  }, [state.currentPuzzle?._id, state.currentPuzzle?.fen]);

  const startNewSession = useCallback(async () => {
    setLoading(true);
    try {
      const queue = shufflePool(await fetchPuzzleQueue({ studentId }));
      startSession({
        mode,
        durationSec: mode === "rush" ? RUSH_DURATION_SEC : null,
        queue,
        lives: mode === "survival" ? 3 : Infinity,
      });
    } finally {
      setLoading(false);
    }
  }, [mode, studentId]);

  const expectedSan = useMemo(() => {
    const sol = state.currentPuzzle?.solutionSan;
    if (!sol) return null;
    if (Array.isArray(sol)) return sol[0];
    return sol;
  }, [state.currentPuzzle]);

  const submitAttempt = useCallback(
    async ({ san, fen, durationMs }) => {
      const puzzle = state.currentPuzzle;
      if (!puzzle) return;
      let correct = false;
      if (expectedSan) {
        correct = String(san).trim() === String(expectedSan).trim();
      } else {
        // fallback: ask the backend
        try {
          const res = await submitPuzzleMove(puzzle._id, {
            move: san,
            fen,
          });
          correct = Boolean(res?.correct ?? res?.ok);
        } catch {
          correct = false;
        }
      }
      if (correct) playCorrectSound();
      else playWrongSound();
      setFeedback({
        correct,
        message: correct
          ? "Đúng rồi! Tới puzzle tiếp theo."
          : `Chưa đúng. Đáp án mong đợi: ${expectedSan || "(chưa xác định)"}`,
      });
      advancePuzzle({ correct, durationMs });
    },
    [expectedSan, state.currentPuzzle],
  );

  const tryMove = useCallback(
    ({ from, to, promotion = "q" }) => {
      if (!boardFen) return false;
      const game = new Chess(boardFen);
      let move;
      try {
        move = game.move({ from, to, promotion });
      } catch {
        move = null;
      }
      if (!move) return false;
      const startedAt = state.currentPuzzle?._startedAt || Date.now();
      submitAttempt({
        san: move.san,
        fen: game.fen(),
        durationMs: Date.now() - startedAt,
      });
      return true;
    },
    [boardFen, state.currentPuzzle, submitAttempt],
  );

  const remainingMs = state.endsAt
    ? Math.max(0, state.endsAt - Date.now())
    : null;

  return {
    state,
    loading,
    feedback,
    boardFen,
    remainingMs,
    startNewSession,
    tryMove,
  };
};

export default usePuzzleRushSession;
