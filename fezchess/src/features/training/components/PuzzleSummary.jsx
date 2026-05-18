import { motion } from "framer-motion";
import { CheckCircle2, RefreshCcw, Trophy, X } from "lucide-react";

const PuzzleSummary = ({
  visible,
  solved,
  failed,
  bestStreak,
  rating,
  onRestart,
  onClose,
}) => {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-emerald-500/15 to-sky-500/10 border border-emerald-400/30 p-6 shadow-xl text-center max-w-md mx-auto"
    >
      <div className="flex justify-center mb-3">
        <div className="rounded-full bg-emerald-500/20 p-3 text-emerald-300">
          <Trophy size={28} />
        </div>
      </div>
      <h3 className="text-lg font-bold text-white">Hoàn tất!</h3>
      <p className="text-sm text-slate-300">
        Phiên tập puzzle kết thúc. Đây là kết quả của bạn:
      </p>
      <div className="grid grid-cols-3 gap-3 mt-4">
        <Stat label="Đúng" value={solved} color="text-emerald-300" />
        <Stat label="Sai" value={failed} color="text-rose-300" />
        <Stat label="Best Streak" value={bestStreak} color="text-amber-300" />
      </div>
      <div className="mt-4 text-sm text-slate-300">
        Rating mới: <span className="font-bold text-white">{rating}</span>
      </div>
      <div className="mt-5 flex justify-center gap-2">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 text-sm font-semibold"
        >
          <RefreshCcw size={14} />
          Chơi lại
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 px-4 py-2 text-sm font-semibold"
        >
          <X size={14} />
          Đóng
        </button>
      </div>
    </motion.div>
  );
};

const Stat = ({ label, value, color }) => (
  <div className="rounded-xl bg-slate-900/70 border border-slate-800 px-3 py-2">
    <div className={`text-xl font-bold tabular-nums ${color}`}>{value}</div>
    <div className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
      <CheckCircle2 size={10} />
      {label}
    </div>
  </div>
);

export default PuzzleSummary;
