import { AnimatePresence, motion } from "framer-motion";

const PIECES = [
  { code: "q", label: "Hậu", glyph: { w: "♕", b: "♛" } },
  { code: "r", label: "Xe", glyph: { w: "♖", b: "♜" } },
  { code: "b", label: "Tượng", glyph: { w: "♗", b: "♝" } },
  { code: "n", label: "Mã", glyph: { w: "♘", b: "♞" } },
];

const PromotionDialog = ({ visible, color = "w", onSelect, onCancel }) => (
  <AnimatePresence>
    {visible ? (
      <motion.div
        key="promotion"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 16, scale: 0.96 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 16, scale: 0.96 }}
          className="rounded-2xl bg-slate-900 p-5 shadow-2xl border border-slate-700/60 w-[280px]"
        >
          <div className="text-sm font-semibold text-slate-200 mb-3">
            Chọn quân phong cấp
          </div>
          <div className="grid grid-cols-4 gap-2">
            {PIECES.map((piece) => (
              <button
                key={piece.code}
                type="button"
                onClick={() => onSelect?.(piece.code)}
                className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-white"
              >
                <span className="text-3xl leading-none">
                  {piece.glyph[color] || piece.glyph.w}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-slate-400">
                  {piece.label}
                </span>
              </button>
            ))}
          </div>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 w-full text-xs text-slate-400 hover:text-slate-200"
            >
              Huỷ
            </button>
          ) : null}
        </motion.div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

export default PromotionDialog;
