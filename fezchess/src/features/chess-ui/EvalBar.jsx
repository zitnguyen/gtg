import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { evalToBarRatio } from "../../lib/chess-engine/evaluationParser";

/**
 * Vertical evaluation bar a-la Lichess analysis. White ratio at the bottom,
 * mate / huge advantages saturate to the ends with smooth animation.
 */
const EvalBar = ({
  cpForWhite = 0,
  height = 480,
  width = 14,
  orientation = "white",
  label,
  className = "",
}) => {
  const ratio = useMemo(() => evalToBarRatio(cpForWhite), [cpForWhite]);
  const whitePct = Math.max(0, Math.min(100, ratio * 100));
  const isFlipped = orientation === "black";

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-slate-800 ${className}`}
      style={{
        width,
        height,
        background: "linear-gradient(#0f172a, #020617)",
      }}
      aria-label="Eval bar"
    >
      <motion.div
        className="absolute left-0 right-0"
        style={{
          background:
            "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 50%, #cbd5f5 100%)",
          bottom: isFlipped ? "auto" : 0,
          top: isFlipped ? 0 : "auto",
        }}
        animate={{ height: `${whitePct}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
      />
      {label ? (
        <div
          className="absolute left-1/2 -translate-x-1/2 text-[10px] font-semibold tracking-wider"
          style={{
            top: isFlipped ? "auto" : 4,
            bottom: isFlipped ? 4 : "auto",
            color: ratio > 0.55 ? "#0f172a" : "#f8fafc",
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};

export default memo(EvalBar);
