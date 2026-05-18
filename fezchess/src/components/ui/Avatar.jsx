import { cn } from "../../lib/utils";

const SIZES = {
  xs: "h-6 w-6 text-[10px] rounded-[5px]",
  sm: "h-8 w-8 text-xs rounded-[6px]",
  toolbar: "h-9 w-9 text-xs rounded-[6px]",
  md: "h-10 w-10 text-sm rounded-[7px]",
  lg: "h-14 w-14 text-base rounded-[10px]",
};

function hashHue(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = name.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

function initials(name) {
  const parts = String(name || "?")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Avatar({
  src,
  alt,
  name,
  size = "md",
  online = false,
  className,
}) {
  const label = alt || name || "Avatar";
  const hue = hashHue(name || label);
  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      {src ? (
        <img
          src={src}
          alt={label}
          className={cn("object-cover border border-white/[0.08]", sizeClass)}
        />
      ) : (
        <span
          className={cn(
            "inline-flex items-center justify-center font-semibold text-z-t1 border border-white/[0.08]",
            sizeClass,
          )}
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 45% 28%), hsl(${(hue + 40) % 360} 50% 22%))`,
          }}
          aria-hidden={alt ? undefined : true}
        >
          {initials(name || label)}
        </span>
      )}
      {online ? (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-z-teal border-2 border-z-s1"
          title="Đang hoạt động"
        />
      ) : null}
    </span>
  );
}
