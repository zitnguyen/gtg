import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const PuzzleRatingBadge = ({ rating = 1200 }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 text-emerald-200 text-sm font-semibold shadow-sm"
  >
    <TrendingUp size={14} />
    <span className="tabular-nums">Rating · {rating}</span>
  </motion.div>
);

export default PuzzleRatingBadge;
