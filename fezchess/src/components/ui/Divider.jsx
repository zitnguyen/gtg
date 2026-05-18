import { cn } from "../../lib/utils";

export default function Divider({ label, className }) {
  if (!label) {
    return <hr className={cn("border-0 border-t border-white/[0.06]", className)} />;
  }
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <hr className="flex-1 border-0 border-t border-white/[0.06]" />
      <span className="text-[10px] uppercase tracking-wide text-z-t3">{label}</span>
      <hr className="flex-1 border-0 border-t border-white/[0.06]" />
    </div>
  );
}
