import { motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";

const PuzzleStreak = ({ streak = 0, bestStreak = 0, solved = 0, failed = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    className="grid grid-cols-2 sm:grid-cols-4 gap-2"
  >
    <Stat icon={Flame} label="Streak" value={streak} accent="text-amber-300" />
    <Stat icon={Trophy} label="Best" value={bestStreak} accent="text-emerald-300" />
    <Stat icon={Flame} label="Đúng" value={solved} accent="text-sky-300" />
    <Stat icon={Flame} label="Sai" value={failed} accent="text-rose-300" />
  </motion.div>
);

const Stat = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2 shadow-md">
    <Icon size={16} className={accent} />
    <div>
      <div className={`text-lg font-bold tabular-nums ${accent}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400">
        {label}
      </div>
    </div>
  </div>
);

export default PuzzleStreak;
