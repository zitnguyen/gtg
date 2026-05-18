import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export function Select({
  value,
  onValueChange,
  placeholder = "Chọn...",
  options = [],
  label,
  className,
  disabled,
}) {
  return (
    <div className={cn("w-full space-y-1", className)}>
      {label ? (
        <span className="block text-xs font-medium text-muted-foreground">
          {label}
        </span>
      ) : null}
      <SelectPrimitive.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input",
            "bg-background px-3 text-sm text-foreground",
            "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="z-50 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-elevated"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={String(opt.value)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-3 text-sm",
                    "outline-none focus:bg-muted data-[highlighted]:bg-muted",
                  )}
                >
                  <SelectPrimitive.ItemIndicator className="absolute left-2 inline-flex">
                    <Check className="h-4 w-4 text-primary" />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}

export default Select;
