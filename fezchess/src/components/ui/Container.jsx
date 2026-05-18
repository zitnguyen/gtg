import { cn } from "../../lib/utils";

const MAX_WIDTH = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  "2xl": "max-w-[1400px]",
  full: "max-w-none",
};

/**
 * Container — đặt giới hạn reading-width cho nội dung.
 * Dùng trong public pages hoặc khi muốn nén nội dung admin (form chi tiết).
 */
const Container = ({ max = "xl", padX = true, className, children, ...props }) => (
  <div
    className={cn(
      "mx-auto w-full",
      MAX_WIDTH[max] || MAX_WIDTH.xl,
      padX && "px-4 md:px-6",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export { Container };
export default Container;
