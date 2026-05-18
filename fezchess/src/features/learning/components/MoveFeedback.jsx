import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    color: "text-emerald-300",
    bg: "bg-emerald-500/15",
    border: "border-emerald-400/30",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-300",
    bg: "bg-amber-500/15",
    border: "border-amber-400/30",
  },
  danger: {
    icon: XCircle,
    color: "text-rose-300",
    bg: "bg-rose-500/15",
    border: "border-rose-400/30",
  },
};

const MoveFeedback = ({ message, variant = "warning" }) => {
  const meta = VARIANTS[variant] || VARIANTS.warning;
  const Icon = meta.icon;
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${meta.bg} ${meta.color} ${meta.border}`}
        >
          <Icon size={16} className="mt-0.5 shrink-0" />
          <span className="leading-snug">{message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default MoveFeedback;
