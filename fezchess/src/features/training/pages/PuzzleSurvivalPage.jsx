import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Play } from "lucide-react";
import authService from "../../../services/authService";
import PuzzleBoard from "../components/PuzzleBoard";
import PuzzleStreak from "../components/PuzzleStreak";
import PuzzleSummary from "../components/PuzzleSummary";
import PuzzleRatingBadge from "../components/PuzzleRatingBadge";
import usePuzzleRushSession from "../hooks/usePuzzleRushSession";
import { resetSession } from "../../../stores/trainingStore";
import MoveFeedback from "../../learning/components/MoveFeedback";

const PuzzleSurvivalPage = () => {
  const currentUser = authService.getCurrentUser?.() || null;
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    if (currentUser?._id) setStudentId(currentUser._id);
  }, [currentUser?._id]);

  const session = usePuzzleRushSession({ studentId, mode: "survival" });
  const isIdle = session.state.status === "idle";
  const showSummary = session.state.status === "finished";
  const lives = session.state.lives === Infinity ? 3 : session.state.lives;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-rose-300 font-semibold">
              Training · Survival
            </div>
            <h1 className="text-2xl font-bold">Puzzle Survival</h1>
            <p className="text-sm text-slate-400">
              3 mạng. Sai 3 lần là kết thúc. Streak càng dài, rating càng tăng.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PuzzleRatingBadge rating={session.state.rating} />
            <div className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-400/30 px-3 py-1 text-rose-200 text-sm font-semibold">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Heart
                  key={idx}
                  size={14}
                  className={idx < lives ? "fill-rose-300 text-rose-300" : "text-slate-600"}
                />
              ))}
            </div>
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
              <Idle loading={session.loading} onStart={session.startNewSession} />
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
              <PuzzleBoard fen={session.boardFen} onMove={session.tryMove} />
            ) : (
              <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-12 text-center text-slate-300">
                Đang chuẩn bị...
              </div>
            )}
            {session.feedback ? (
              <MoveFeedback
                message={session.feedback.message}
                variant={session.feedback.correct ? "success" : "danger"}
              />
            ) : null}
          </div>
          <aside className="rounded-2xl bg-slate-900/85 border border-slate-800 p-4 shadow-xl space-y-2">
            <div className="text-sm font-semibold text-white">Cách chơi</div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Mỗi puzzle bạn đi trước.</li>
              <li>Sai 1 nước = mất 1 mạng.</li>
              <li>Hết mạng → kết thúc phiên.</li>
              <li>Streak liên tục giúp tăng rating nhanh hơn.</li>
            </ul>
          </aside>
        </div>
      </motion.div>
    </div>
  );
};

const Idle = ({ loading, onStart }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="rounded-2xl bg-slate-900/85 border border-slate-800 p-8 text-center shadow-xl"
  >
    <h2 className="text-xl font-bold text-white">Đối mặt với 3 mạng</h2>
    <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
      Đẩy streak càng dài càng tốt trước khi mất hết tim.
    </p>
    <button
      type="button"
      onClick={onStart}
      disabled={loading}
      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold px-5 py-2.5 disabled:opacity-60"
    >
      <Play size={16} />
      {loading ? "Đang tải..." : "Bắt đầu"}
    </button>
  </motion.div>
);

export default PuzzleSurvivalPage;
