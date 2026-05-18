import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Play } from "lucide-react";
import authService from "../../../services/authService";
import PuzzleBoard from "../components/PuzzleBoard";
import PuzzleTimer from "../components/PuzzleTimer";
import PuzzleStreak from "../components/PuzzleStreak";
import PuzzleSummary from "../components/PuzzleSummary";
import PuzzleRatingBadge from "../components/PuzzleRatingBadge";
import usePuzzleRushSession from "../hooks/usePuzzleRushSession";
import { resetSession } from "../../../stores/trainingStore";
import MoveFeedback from "../../learning/components/MoveFeedback";

const PuzzleRushPage = () => {
  const currentUser = authService.getCurrentUser?.() || null;
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    if (currentUser?._id) setStudentId(currentUser._id);
  }, [currentUser?._id]);

  const session = usePuzzleRushSession({ studentId, mode: "rush" });

  const showSummary = session.state.status === "finished";
  const isIdle = session.state.status === "idle";

  const lastMove = useMemo(() => null, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-amber-300 font-semibold">
              Training · Puzzle Rush
            </div>
            <h1 className="text-2xl font-bold">Tăng tốc giải puzzle</h1>
            <p className="text-sm text-slate-400">
              Giải càng nhiều puzzle càng tốt trong 3 phút. Streak càng dài,
              điểm càng cao.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <PuzzleRatingBadge rating={session.state.rating} />
            <PuzzleTimer
              remainingMs={session.remainingMs}
              durationSec={session.state.durationSec}
            />
          </div>
        </div>

        <PuzzleStreak
          streak={session.state.streak}
          bestStreak={session.state.bestStreak}
          solved={session.state.solved}
          failed={session.state.failed}
        />

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-3 min-w-0">
            {isIdle ? (
              <IdleHero loading={session.loading} onStart={session.startNewSession} />
            ) : showSummary ? (
              <PuzzleSummary
                visible
                solved={session.state.solved}
                failed={session.state.failed}
                bestStreak={session.state.bestStreak}
                rating={session.state.rating}
                onRestart={session.startNewSession}
                onClose={() => resetSession()}
              />
            ) : session.boardFen ? (
              <PuzzleBoard
                fen={session.boardFen}
                onMove={session.tryMove}
                lastMove={lastMove}
              />
            ) : (
              <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-12 text-center text-slate-300">
                Đang chuẩn bị puzzle tiếp theo...
              </div>
            )}
            {session.feedback ? (
              <MoveFeedback
                message={session.feedback.message}
                variant={session.feedback.correct ? "success" : "danger"}
              />
            ) : null}
          </div>
          <aside className="space-y-3">
            <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-4 shadow-xl">
              <div className="text-sm font-semibold text-white mb-2">
                Puzzle hiện tại
              </div>
              {session.state.currentPuzzle ? (
                <>
                  <div className="text-xs text-slate-300">
                    {session.state.currentPuzzle.title || "Tactics"}
                  </div>
                  {session.state.currentPuzzle.theme ? (
                    <div className="text-[11px] uppercase text-amber-300 mt-1 tracking-wider">
                      {session.state.currentPuzzle.theme}
                    </div>
                  ) : null}
                  {session.state.currentPuzzle.rating ? (
                    <div className="mt-1 text-xs text-slate-400">
                      Mức khó: {session.state.currentPuzzle.rating}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  Chưa có puzzle nào.
                </div>
              )}
            </div>
            <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-4 shadow-xl">
              <div className="text-sm font-semibold text-white mb-2">
                Hướng dẫn
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>Bạn đi trước.</li>
                <li>Click hoặc kéo quân để thử nước đi.</li>
                <li>Đúng → puzzle kế tiếp, Sai → mất streak.</li>
                <li>3 phút thi nhanh, hết giờ là kết thúc.</li>
              </ul>
            </div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
};

const IdleHero = ({ loading, onStart }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="rounded-2xl bg-slate-900/85 border border-slate-800 p-8 text-center shadow-xl"
  >
    <div className="flex justify-center mb-4">
      <div className="rounded-full bg-amber-500/20 text-amber-300 p-3">
        <Sparkles size={28} />
      </div>
    </div>
    <h2 className="text-xl font-bold text-white">Sẵn sàng cho 3 phút Rush?</h2>
    <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
      Hệ thống sẽ kéo các puzzle bài tập hôm nay của bạn. Nếu chưa có, chúng
      tôi đã chuẩn bị sẵn 4 puzzle khởi động.
    </p>
    <button
      type="button"
      onClick={onStart}
      disabled={loading}
      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 disabled:opacity-60"
    >
      <Play size={16} />
      {loading ? "Đang tải..." : "Bắt đầu"}
    </button>
  </motion.div>
);

export default PuzzleRushPage;
