import { memo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  MOVE_QUALITY_META,
} from "../../lib/chess/moveClassifier";

/**
 * Compact PGN move list. Each move pair (white/black) sits side-by-side. Move
 * quality badges render inline when the parent passes a `qualityByPly` map.
 */
const MoveList = ({
  moves = [],
  cursor = null,
  onJump,
  qualityByPly = {},
  emptyState = "Chưa có nước đi nào.",
  className = "",
}) => {
  const containerRef = useRef(null);
  const activeRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !activeRef.current) return;
    activeRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [cursor]);

  if (!moves.length) {
    return (
      <div className={`text-sm text-slate-400 italic ${className}`}>
        {emptyState}
      </div>
    );
  }

  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1]]);
  }

  return (
    <div
      ref={containerRef}
      className={`max-h-full min-w-0 overflow-y-auto overflow-x-hidden pr-1 ${className}`}
    >
      <table className="w-full min-w-0 table-fixed text-xs sm:text-sm">
        <tbody>
          {pairs.map((pair, idx) => {
            const moveNo = idx + 1;
            const whitePly = idx * 2 + 1;
            const blackPly = idx * 2 + 2;
            const whiteQuality = qualityByPly[whitePly];
            const blackQuality = qualityByPly[blackPly];
            return (
              <tr key={moveNo} className="border-b border-slate-800/40">
                <td className="w-7 shrink-0 py-1 pr-1 text-[10px] text-slate-500 sm:w-8 sm:pr-2 sm:text-xs">
                  {moveNo}.
                </td>
                <MoveCell
                  move={pair[0]}
                  ply={whitePly}
                  quality={whiteQuality}
                  isActive={cursor === whitePly}
                  onJump={onJump}
                  forwardRef={cursor === whitePly ? activeRef : null}
                />
                <MoveCell
                  move={pair[1]}
                  ply={blackPly}
                  quality={blackQuality}
                  isActive={cursor === blackPly}
                  onJump={onJump}
                  forwardRef={cursor === blackPly ? activeRef : null}
                />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const MoveCell = ({ move, ply, quality, isActive, onJump, forwardRef }) => {
  if (!move) return <td className="min-w-0 py-1" />;
  const meta = quality ? MOVE_QUALITY_META[quality] : null;
  const san = typeof move === "string" ? move : move?.san;
  return (
    <td className="min-w-0 py-1" ref={forwardRef}>
      <motion.button
        type="button"
        onClick={() => onJump?.(ply)}
        whileTap={{ scale: 0.97 }}
        animate={{
          backgroundColor: isActive ? "rgba(56, 189, 248, 0.18)" : "transparent",
        }}
        className={`inline-flex min-w-0 max-w-full items-center gap-1 rounded-md px-1 py-0.5 text-left sm:gap-1.5 sm:px-2 ${
          isActive
            ? "text-white font-semibold"
            : "text-slate-200 hover:text-white"
        }`}
      >
        <span className="min-w-0 truncate">{san}</span>
        {meta ? (
          <span
            className="text-[10px] font-bold"
            style={{ color: meta.color }}
            title={meta.label}
          >
            {meta.short}
          </span>
        ) : null}
      </motion.button>
    </td>
  );
};

export default memo(MoveList);
