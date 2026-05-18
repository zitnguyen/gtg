/**
 * Task: Daily puzzle — dữ liệu từ API công khai Lichess (proxy BE, ghi nguồn AGPL)
 * Tác giả: DucManh-BlueOC
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, ExternalLink, Play } from "lucide-react";
import PuzzleBoard from "../components/PuzzleBoard";
import PuzzleRatingBadge from "../components/PuzzleRatingBadge";
import MoveFeedback from "../../learning/components/MoveFeedback";
import useLichessDailyPuzzle from "../hooks/useLichessDailyPuzzle";

const formatDateLabel = () => {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    }).format(new Date());
  } catch {
    return new Date().toDateString();
  }
};

const DailyPuzzlePage = () => {
  const puzzle = useLichessDailyPuzzle();
  const dateLabel = useMemo(() => formatDateLabel(), []);

  const isIdle = puzzle.status === "idle" || puzzle.status === "error";
  const isSolved = puzzle.status === "solved";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-emerald-300 font-semibold flex items-center gap-1">
              <CalendarCheck size={14} />
              Daily Puzzle · {dateLabel}
            </div>
            <h1 className="text-2xl font-bold">Puzzle hôm nay</h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Dữ liệu từ{" "}
              <a
                href="https://lichess.org/training/daily"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:underline inline-flex items-center gap-0.5"
              >
                Lichess.org
                <ExternalLink className="h-3 w-3" />
              </a>{" "}
              (mã nguồn mở AGPL). Giải đúng từng nước theo gợi ý engine.
            </p>
          </div>
          {puzzle.meta?.rating ? (
            <PuzzleRatingBadge rating={puzzle.meta.rating} />
          ) : null}
        </div>

        {puzzle.meta?.themes?.length ? (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {puzzle.meta.themes.map((t) => (
              <span
                key={t}
                className="text-[11px] uppercase tracking-wide rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-slate-300"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}

        <div className="space-y-3">
          {isIdle ? (
            <Idle
              loading={puzzle.loading}
              onStart={() => {
                puzzle.reset();
                puzzle.load();
              }}
            />
          ) : isSolved ? (
            <div className="rounded-2xl bg-emerald-950/40 border border-emerald-800/60 p-8 text-center">
              <h2 className="text-xl font-bold text-emerald-100">Hoàn thành!</h2>
              <p className="text-sm text-emerald-200/80 mt-2">
                Bạn đã giải hết chuỗi nước của puzzle Lichess #{puzzle.meta?.lichessPuzzleId}.
              </p>
              <button
                type="button"
                onClick={() => {
                  puzzle.reset();
                  puzzle.load();
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5"
              >
                <Play size={16} />
                Tải puzzle mới
              </button>
            </div>
          ) : puzzle.fen ? (
            <PuzzleBoard
              fen={puzzle.fen}
              onMove={puzzle.tryMove}
              lastMove={puzzle.lastMove}
              disabled={puzzle.loading}
            />
          ) : null}

          {puzzle.feedback ? (
            <MoveFeedback
              message={puzzle.feedback.message}
              variant={puzzle.feedback.correct ? "success" : "danger"}
            />
          ) : null}

          {puzzle.meta?.attribution ? (
            <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-800 pt-4">
              {puzzle.meta.attribution}
            </p>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
};

const Idle = ({ loading, onStart }) => (
  <div className="rounded-2xl bg-slate-900/85 border border-slate-800 p-8 text-center shadow-xl">
    <h2 className="text-xl font-bold text-white">Puzzle daily từ Lichess</h2>
    <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
      Mỗi ngày một thế cờ chọn lọc. Bấm bắt đầu để tải qua máy chủ Z Chess (proxy
      an toàn, không cần API key).
    </p>
    <button
      type="button"
      onClick={onStart}
      disabled={loading}
      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 disabled:opacity-60"
    >
      <Play size={16} />
      {loading ? "Đang tải từ Lichess…" : "Bắt đầu"}
    </button>
  </div>
);

export default DailyPuzzlePage;
