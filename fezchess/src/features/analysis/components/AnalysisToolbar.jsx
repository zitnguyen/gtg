import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  FlipVertical2,
  Cpu,
  RotateCcw,
} from "lucide-react";
import { motion } from "framer-motion";

const Btn = ({ children, onClick, title, intent }) => (
  <motion.button
    whileTap={{ scale: 0.94 }}
    type="button"
    onClick={onClick}
    title={title}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
      intent === "primary"
        ? "bg-sky-500 hover:bg-sky-400 text-white border-sky-400"
        : "bg-slate-900/70 hover:bg-slate-800 text-slate-100 border-slate-700"
    }`}
  >
    {children}
  </motion.button>
);

const AnalysisToolbar = ({
  onStart,
  onPrev,
  onNext,
  onEnd,
  onFlip,
  onReset,
  onCopyFen,
  onCopyPgn,
  onToggleEngine,
  engineEnabled,
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <Btn onClick={onStart} title="Vị trí đầu">
      <ChevronsLeft size={14} />
    </Btn>
    <Btn onClick={onPrev} title="Lùi 1 nước">
      <ChevronLeft size={14} />
    </Btn>
    <Btn onClick={onNext} title="Tiến 1 nước" intent="primary">
      <ChevronRight size={14} />
    </Btn>
    <Btn onClick={onEnd} title="Vị trí cuối">
      <ChevronsRight size={14} />
    </Btn>
    <span className="mx-1 h-5 w-px bg-slate-700" />
    <Btn onClick={onFlip} title="Lật bàn cờ">
      <FlipVertical2 size={14} />
    </Btn>
    <Btn onClick={onReset} title="Đặt lại">
      <RotateCcw size={14} />
    </Btn>
    <Btn onClick={onCopyFen} title="Sao chép FEN">
      <Copy size={14} />
      FEN
    </Btn>
    <Btn onClick={onCopyPgn} title="Sao chép PGN">
      <Copy size={14} />
      PGN
    </Btn>
    <span className="mx-1 h-5 w-px bg-slate-700" />
    <Btn
      onClick={onToggleEngine}
      title={engineEnabled ? "Tắt engine" : "Bật engine"}
      intent={engineEnabled ? "primary" : undefined}
    >
      <Cpu size={14} />
      {engineEnabled ? "Tắt engine" : "Bật engine"}
    </Btn>
  </div>
);

export default AnalysisToolbar;
