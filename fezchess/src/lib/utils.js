import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — merge className theo chuẩn shadcn/ui:
 *   - clsx xử lý điều kiện/array/object
 *   - twMerge dedupe Tailwind utilities (vd: "p-2 p-4" → "p-4")
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
