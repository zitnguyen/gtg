import { forwardRef } from "react";
import { Search } from "lucide-react";
import { cn } from "../../lib/utils";
import Input from "./Input";

const Toolbar = forwardRef(function Toolbar(
  { className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
        "rounded-2xl border border-border bg-card p-3 md:p-4 shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});

const ToolbarGroup = ({ className, children, ...props }) => (
  <div
    className={cn("flex flex-wrap items-center gap-2", className)}
    {...props}
  >
    {children}
  </div>
);

const ToolbarSearch = forwardRef(function ToolbarSearch(
  { className, placeholder = "Tìm kiếm...", ...props },
  ref,
) {
  return (
    <Input
      ref={ref}
      type="search"
      placeholder={placeholder}
      leftIcon={<Search className="w-4 h-4" />}
      className={cn("md:w-72", className)}
      {...props}
    />
  );
});

export { Toolbar, ToolbarGroup, ToolbarSearch };
export default Toolbar;
