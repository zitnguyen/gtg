import { motion } from "framer-motion";
import { GraduationCap, Sparkles, Target } from "lucide-react";

const ICONS = {
  hint: Target,
  goal: GraduationCap,
  praise: Sparkles,
};

/**
 * Friendly coach panel that explains the lesson goal, gives the active
 * instruction, and surfaces hints/praise. Designed to sit next to the board.
 */
const MoveCoach = ({
  title,
  goal,
  hint,
  praise,
  variant = "info",
}) => {
  const Icon = ICONS[variant] || GraduationCap;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-slate-900/80 border border-slate-700/60 px-4 py-3 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-sky-500/20 p-2 text-sky-300">
          <Icon size={18} />
        </div>
        <div className="min-h-0 min-w-0 flex-1">
          {title ? (
            <div className="text-xs uppercase tracking-wider text-sky-300 font-semibold">
              {title}
            </div>
          ) : null}
          {goal ? (
            <div className="mt-1 max-h-[min(38vh,16rem)] overflow-y-auto overscroll-y-contain text-pretty text-sm font-semibold leading-relaxed text-white [overflow-wrap:anywhere] sm:max-h-[min(48vh,22rem)] md:text-[15px]">
              {goal}
            </div>
          ) : null}
          {hint ? (
            <div className="mt-2 text-sm text-amber-200/90 italic">
              <span className="font-semibold not-italic mr-1">Gợi ý:</span>
              {hint}
            </div>
          ) : null}
          {praise ? (
            <div className="mt-2 text-sm text-emerald-300 font-semibold">
              {praise}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

export default MoveCoach;
