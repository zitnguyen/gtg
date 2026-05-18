import { cn } from "../../lib/utils";
import { headerToolbarGroupClass } from "./headerToolbarStyles";

/** Nhóm nút toolbar header — cùng hàng, cùng chiều cao h-9 */
export default function HeaderToolbarGroup({ className, children }) {
  return <div className={cn(headerToolbarGroupClass, className)}>{children}</div>;
}
