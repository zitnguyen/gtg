import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

const HintButton = ({ onHint, disabled, label = "Gợi ý" }) => (
  <motion.button
    type="button"
    onClick={onHint}
    disabled={disabled}
    whileTap={{ scale: 0.96 }}
    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all bg-amber-500/10 text-amber-200 border-amber-400/30 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <Lightbulb size={16} />
    {label}
  </motion.button>
);

export default HintButton;
