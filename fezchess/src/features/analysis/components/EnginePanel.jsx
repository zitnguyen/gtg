import { motion } from "framer-motion";
import { formatScore } from "../../../lib/chess-engine/evaluationParser";
import { EngineStatusBadge } from "../../chess-ui";

const EnginePanel = ({
  status,
  error,
  lines = [],
  bestmove,
  sideToMove,
  onChangeMultiPv,
  onChangeDepth,
  multipv,
  depth,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl bg-slate-900/85 border border-slate-800 p-4 shadow-xl"
  >
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="text-sm font-semibold text-white">Engine</div>
      <EngineStatusBadge status={status} error={error} />
    </div>

    <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-slate-300">
      <label className="flex items-center justify-between gap-2 rounded-lg bg-slate-800/60 px-2 py-1">
        <span>MultiPV</span>
        <select
          value={multipv}
          onChange={(e) => onChangeMultiPv?.(Number(e.target.value))}
          className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center justify-between gap-2 rounded-lg bg-slate-800/60 px-2 py-1">
        <span>Depth</span>
        <select
          value={depth}
          onChange={(e) => onChangeDepth?.(Number(e.target.value))}
          className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5"
        >
          {[12, 14, 16, 18, 20, 22].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    </div>

    {lines.length === 0 ? (
      <div className="text-xs text-slate-400 italic">
        Engine sẽ phát đề xuất ngay khi vị trí được phân tích.
      </div>
    ) : (
      <ul className="space-y-2">
        {lines.map((line) => (
          <li
            key={line.multipv}
            className="rounded-xl bg-slate-800/70 border border-slate-700/60 px-3 py-2"
          >
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span className="font-semibold text-white">
                {formatScore(line.score, sideToMove)}
              </span>
              <span>depth {line.depth ?? "-"}</span>
            </div>
            <div className="text-xs text-sky-200 break-words font-mono">
              {(line.pv || []).slice(0, 12).join(" ") || "-"}
            </div>
          </li>
        ))}
      </ul>
    )}

    {bestmove ? (
      <div className="mt-3 text-xs text-emerald-300">
        Best move: <span className="font-mono">{bestmove}</span>
      </div>
    ) : null}
  </motion.div>
);

export default EnginePanel;
