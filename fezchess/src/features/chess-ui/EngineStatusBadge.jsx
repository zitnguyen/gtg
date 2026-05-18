import { Cpu, Loader2, AlertTriangle, Pause, Power } from "lucide-react";
import { ENGINE_STATUS } from "../../lib/chess-engine";

const VARIANTS = {
  [ENGINE_STATUS.IDLE]: {
    icon: Power,
    color: "text-slate-400",
    bg: "bg-slate-800/60",
    label: "Engine offline",
  },
  [ENGINE_STATUS.STARTING]: {
    icon: Loader2,
    color: "text-sky-300",
    bg: "bg-sky-500/15",
    label: "Đang khởi động engine",
    spin: true,
  },
  [ENGINE_STATUS.READY]: {
    icon: Cpu,
    color: "text-emerald-300",
    bg: "bg-emerald-500/15",
    label: "Engine sẵn sàng",
  },
  [ENGINE_STATUS.THINKING]: {
    icon: Loader2,
    color: "text-emerald-300",
    bg: "bg-emerald-500/20",
    label: "Đang phân tích...",
    spin: true,
  },
  [ENGINE_STATUS.STOPPED]: {
    icon: Pause,
    color: "text-amber-300",
    bg: "bg-amber-500/15",
    label: "Đã tạm dừng",
  },
  [ENGINE_STATUS.UNAVAILABLE]: {
    icon: AlertTriangle,
    color: "text-rose-300",
    bg: "bg-rose-500/15",
    label: "Engine chưa sẵn sàng",
  },
  [ENGINE_STATUS.ERROR]: {
    icon: AlertTriangle,
    color: "text-rose-300",
    bg: "bg-rose-500/15",
    label: "Engine lỗi",
  },
};

const EngineStatusBadge = ({ status, error }) => {
  const variant = VARIANTS[status] || VARIANTS[ENGINE_STATUS.IDLE];
  const Icon = variant.icon;
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${variant.bg} ${variant.color}`}
      title={error || variant.label}
    >
      <Icon size={14} className={variant.spin ? "animate-spin" : ""} />
      <span>{variant.label}</span>
    </div>
  );
};

export default EngineStatusBadge;
