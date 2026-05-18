/**
 * Task: Giải câu đố daily Lichess (chuỗi nước UCI) — giao diện tối, feedback
 * Tác giả: DucManh-BlueOC
 */
import { useCallback, useState } from "react";
import { Chess } from "chess.js";
import { fetchLichessDailyPuzzle } from "../services/puzzlePublicService";
import { playCorrectSound, playWrongSound } from "../../../lib/chess/boardSounds";

const normUci = (uci) => String(uci || "").trim().toLowerCase();

export const useLichessDailyPuzzle = () => {
  const [loading, setLoading] = useState(false);
  const [fen, setFen] = useState(null);
  const [moveIndex, setMoveIndex] = useState(0);
  const [solutionUci, setSolutionUci] = useState([]);
  const [meta, setMeta] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [status, setStatus] = useState("idle");
  const [lastMove, setLastMove] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    setLastMove(null);
    try {
      const data = await fetchLichessDailyPuzzle();
      setMeta({
        lichessPuzzleId: data.lichessPuzzleId,
        rating: data.rating,
        themes: data.themes || [],
        attribution: data.attribution,
        source: data.source,
      });
      setFen(data.fen);
      setSolutionUci(Array.isArray(data.solutionUci) ? data.solutionUci.map(normUci) : []);
      setMoveIndex(0);
      setStatus("playing");
    } catch (e) {
      setStatus("error");
      setFeedback({
        correct: false,
        message:
          e?.response?.data?.message ||
          "Không tải được câu đố. Thử lại sau hoặc kiểm tra mạng.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const tryMove = useCallback(
    ({ from, to, promotion = "q" }) => {
      if (status !== "playing" || !fen || !solutionUci.length) return false;
      const game = new Chess(fen);
      let move;
      try {
        move = game.move({ from, to, promotion });
      } catch {
        move = null;
      }
      if (!move) return false;

      const played = normUci(
        `${move.from}${move.to}${move.promotion ? String(move.promotion).toLowerCase() : ""}`,
      );
      const expected = solutionUci[moveIndex];
      if (!expected) return false;

      if (played !== expected) {
        playWrongSound();
        setFeedback({
          correct: false,
          message: "Chưa đúng nước tốt nhất — thử lại.",
        });
        return false;
      }

      playCorrectSound();
      setLastMove({ from: move.from, to: move.to });
      const nextIdx = moveIndex + 1;
      setMoveIndex(nextIdx);
      setFen(game.fen());
      setFeedback({
        correct: true,
        message:
          nextIdx >= solutionUci.length
            ? "Hoàn thành câu đố!"
            : `Đúng! Nước tiếp theo (${nextIdx + 1}/${solutionUci.length})`,
      });

      if (nextIdx >= solutionUci.length) {
        setStatus("solved");
      }
      return true;
    },
    [fen, moveIndex, solutionUci, status],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setFen(null);
    setSolutionUci([]);
    setMoveIndex(0);
    setMeta(null);
    setFeedback(null);
    setLastMove(null);
  }, []);

  return {
    loading,
    fen,
    meta,
    feedback,
    status,
    lastMove,
    moveIndex,
    totalMoves: solutionUci.length,
    load,
    tryMove,
    reset,
  };
};

export default useLichessDailyPuzzle;
