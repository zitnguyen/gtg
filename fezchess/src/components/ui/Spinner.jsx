import { cn } from "../../lib/utils";

export default function Spinner({ size = 24, className }) {
  const s = Number(size) || 24;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      className={cn("animate-spin", className)}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.2"
      />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-z-gold"
      />
    </svg>
  );
}
