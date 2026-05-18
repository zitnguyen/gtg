import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../../lib/utils";

export function TooltipProvider({ children, delayDuration = 200 }) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

export default function Tooltip({ content, children, side = "top" }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          className={cn(
            "z-50 rounded-md border border-white/[0.11] bg-z-s3 px-2.5 py-1.5",
            "text-xs text-z-t1 shadow-elevated animate-fade-in",
          )}
          sideOffset={4}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-z-s3" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
