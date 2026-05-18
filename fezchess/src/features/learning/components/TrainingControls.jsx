import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Save,
  FlipVertical2,
} from "lucide-react";
import { motion } from "framer-motion";

const ToolbarButton = ({
  onClick,
  disabled,
  title,
  children,
  intent,
  touch = false,
}) => {
  const intentClass =
    intent === "primary"
      ? "bg-sky-500 hover:bg-sky-400 text-white border-sky-400"
      : intent === "save"
        ? "bg-emerald-500 hover:bg-emerald-400 text-white border-emerald-400"
        : "bg-slate-800/70 hover:bg-slate-700 text-slate-100 border-slate-700";

  const sizeClass = touch
    ? "min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-2xl text-base justify-center"
    : "px-3 py-1.5 rounded-xl text-sm gap-1.5";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center font-medium border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${sizeClass} ${intentClass}`}
    >
      {children}
    </motion.button>
  );
};

const TrainingControls = ({
  onStart,
  onPrev,
  onNext,
  onEnd,
  onReset,
  onFlip,
  onSave,
  saving,
  step,
  total,
  showReplay,
  showSave,
  showFlip = true,
  /** Bố cục nút to, căn giữa — dùng cho thanh dock dưới mobile. */
  variant = "default",
}) => {
  const touch = variant === "dock";
  const iconSm = touch ? 18 : 14;
  const rowClass = touch
    ? "flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full"
    : "flex flex-wrap items-center gap-2";

  return (
    <div className={rowClass}>
      {showReplay ? (
        <>
          <ToolbarButton touch={touch} onClick={onStart} title="Về vị trí đầu">
            <ChevronsLeft size={iconSm} />
          </ToolbarButton>
          <ToolbarButton touch={touch} onClick={onPrev} title="Lùi 1 nước">
            <ChevronLeft size={iconSm} />
          </ToolbarButton>
          <span
            className={`text-slate-200 px-1 font-bold tabular-nums ${
              touch ? "text-sm min-w-[3.5rem] text-center" : "text-xs"
            }`}
          >
            {step}/{total}
          </span>
          <ToolbarButton
            touch={touch}
            onClick={onNext}
            title="Tiến 1 nước"
            intent="primary"
          >
            <ChevronRight size={iconSm} />
          </ToolbarButton>
          <ToolbarButton touch={touch} onClick={onEnd} title="Tới vị trí cuối">
            <ChevronsRight size={iconSm} />
          </ToolbarButton>
        </>
      ) : null}
      <ToolbarButton touch={touch} onClick={onReset} title="Đặt lại bàn">
        <RotateCcw size={iconSm} />
        {!touch ? <span className="ml-0.5">Reset</span> : null}
      </ToolbarButton>
      {showFlip ? (
        <ToolbarButton touch={touch} onClick={onFlip} title="Lật bàn cờ">
          <FlipVertical2 size={iconSm} />
        </ToolbarButton>
      ) : null}
      {showSave ? (
        <ToolbarButton
          touch={touch}
          onClick={onSave}
          disabled={saving}
          intent="save"
          title="Lưu nước đi"
        >
          <Save size={iconSm} />
          {touch ? (saving ? "…" : "Lưu") : saving ? "Đang lưu..." : "Lưu"}
        </ToolbarButton>
      ) : null}
    </div>
  );
};

export default TrainingControls;
