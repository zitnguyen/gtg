import { motion } from "framer-motion";

/**
 * Variation panel: foundation only. We surface alternative branches keyed by
 * ply index so this can grow into a full PGN tree later.
 */
const VariationPanel = ({ branches = {} }) => {
  const entries = Object.entries(branches);
  if (!entries.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl bg-slate-900/85 border border-slate-800 p-4 shadow-xl"
    >
      <div className="text-sm font-semibold text-white mb-2">Biến phụ</div>
      <ul className="space-y-2 text-xs text-slate-300">
        {entries.map(([ply, list]) => (
          <li key={ply}>
            <span className="text-slate-400">Sau nước {ply}:</span>{" "}
            <span className="font-mono text-sky-200">
              {(list || []).map((m) => m.san).join(" ")}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export default VariationPanel;
