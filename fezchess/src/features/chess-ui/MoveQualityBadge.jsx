import { motion } from "framer-motion";
import { MOVE_QUALITY_META } from "../../lib/chess/moveClassifier";

const MoveQualityBadge = ({ quality, size = "md" }) => {
  if (!quality) return null;
  const meta = MOVE_QUALITY_META[quality];
  if (!meta) return null;
  const sizes = {
    sm: { px: "px-2", py: "py-0.5", text: "text-[11px]" },
    md: { px: "px-3", py: "py-1", text: "text-xs" },
    lg: { px: "px-4", py: "py-1.5", text: "text-sm" },
  }[size] || { px: "px-3", py: "py-1", text: "text-xs" };

  return (
    <motion.span
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizes.px} ${sizes.py} ${sizes.text}`}
      style={{
        background: `${meta.color}1f`,
        color: meta.color,
        border: `1px solid ${meta.color}55`,
      }}
    >
      <span>{meta.short}</span>
      <span>{meta.label}</span>
    </motion.span>
  );
};

export default MoveQualityBadge;
