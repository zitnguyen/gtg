import { motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";
import { MoveList } from "../../chess-ui";

/**
 * Premium side panel for the lesson player. Shows lesson meta, exercise
 * progress (when in exercise mode), the move list and any inline feedback.
 */
const LessonSidebar = ({
  title,
  subtitle,
  exercises = [],
  exerciseIndex = 0,
  exerciseSolvedMap = {},
  moves = [],
  cursor = null,
  onJump,
  feedbackSlot = null,
  coachSlot = null,
  controlsSlot = null,
}) => (
  <motion.aside
    initial={{ opacity: 0, x: 12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.25 }}
    className="flex h-full max-h-full min-h-0 flex-col overflow-y-auto overflow-x-hidden bg-slate-900/85 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur"
  >
    <div className="px-4 pt-4 pb-3 border-b border-slate-800/60">
      {subtitle ? (
        <div className="text-[11px] uppercase tracking-wider text-sky-300 font-semibold">
          {subtitle}
        </div>
      ) : null}
      {title ? (
        <h3 className="text-base font-bold text-white truncate">{title}</h3>
      ) : null}
    </div>

    {coachSlot ? (
      <div className="shrink-0 px-4 pt-3">{coachSlot}</div>
    ) : null}
    {feedbackSlot ? <div className="px-4 pt-3">{feedbackSlot}</div> : null}

    {exercises.length > 0 ? (
      <div className="px-4 py-3 border-b border-slate-800/40">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
          Bài tập
        </div>
        <ol className="space-y-1.5">
          {exercises.map((exercise, idx) => {
            const solved = Boolean(exerciseSolvedMap[exercise._id]);
            const active = idx === exerciseIndex;
            const Icon = solved ? CheckCircle2 : Circle;
            return (
              <li
                key={exercise._id || idx}
                className={`flex items-center gap-2 text-sm rounded-lg px-2 py-1.5 transition-colors ${
                  active
                    ? "bg-sky-500/15 text-white font-semibold"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <Icon
                  size={14}
                  className={solved ? "text-emerald-300" : "text-slate-500"}
                />
                <span className="truncate">
                  Bài {idx + 1}
                  {exercise.title ? ` · ${exercise.title}` : ""}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    ) : null}

    <div className="flex-1 min-h-0 px-4 py-3 overflow-hidden">
      <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
        Lịch sử nước đi
      </div>
      <MoveList moves={moves} cursor={cursor} onJump={onJump} />
    </div>

    {controlsSlot ? (
      <div className="px-4 py-3 border-t border-slate-800/60">{controlsSlot}</div>
    ) : null}
  </motion.aside>
);

export default LessonSidebar;
