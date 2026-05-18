import { AnimatePresence, motion } from "framer-motion";

/**
 * Optional overlay layer above the board (e.g. lesson completion modal,
 * puzzle summary, awaiting hint). Renders nothing when `visible` is false.
 */
const BoardOverlay = ({ visible, children, intent = "neutral" }) => {
  const intentColor = {
    success: "rgba(34, 197, 94, 0.18)",
    danger: "rgba(239, 68, 68, 0.18)",
    info: "rgba(56, 189, 248, 0.18)",
    neutral: "rgba(15, 23, 42, 0.55)",
  }[intent];

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 z-20 flex items-center justify-center text-center"
          style={{
            background: intentColor,
            backdropFilter: "blur(2px)",
          }}
        >
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl bg-slate-900/85 px-6 py-4 shadow-2xl border border-slate-700/60"
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default BoardOverlay;
