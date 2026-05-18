import { motion } from "framer-motion";
import { Timer } from "lucide-react";

const formatMs = (ms) => {
  if (ms === null || ms === undefined) return "∞";
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const PuzzleTimer = ({ remainingMs, durationSec }) => {
  const ratio =
    remainingMs !== null && durationSec
      ? Math.max(0, Math.min(1, remainingMs / (durationSec * 1000)))
      : 1;
  const intent =
    ratio > 0.5 ? "text-emerald-300" : ratio > 0.2 ? "text-amber-300" : "text-rose-300";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2 shadow-md"
    >
      <Timer size={16} className={intent} />
      <div>
        <div className={`text-xl font-bold tabular-nums ${intent}`}>
          {formatMs(remainingMs)}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-slate-400">
          Thời gian còn lại
        </div>
      </div>
    </motion.div>
  );
};

export default PuzzleTimer;
