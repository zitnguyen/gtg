import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialog — modal có animation, focus trap, esc, click backdrop.
 * Controlled: <Dialog open={open} onOpenChange={setOpen}>...</Dialog>
 *
 *   <Dialog open={open} onOpenChange={setOpen} title="Xoá học viên?" description="Hành động này không thể hoàn tác">
 *     <DialogBody>nội dung</DialogBody>
 *     <DialogFooter>
 *       <Button variant="outline" onClick={() => setOpen(false)}>Huỷ</Button>
 *       <Button variant="destructive" onClick={confirm}>Xoá</Button>
 *     </DialogFooter>
 *   </Dialog>
 */
const Dialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
  closeOnOverlayClick = true,
  hideCloseButton = false,
  className,
}) => {
  const containerRef = useRef(null);
  const previouslyFocused = useRef(null);

  const close = useCallback(() => {
    if (typeof onOpenChange === "function") onOpenChange(false);
  }, [onOpenChange]);

  // Focus trap + esc + lock scroll
  useEffect(() => {
    if (!open) return undefined;
    previouslyFocused.current =
      typeof document !== "undefined" ? document.activeElement : null;

    const node = containerRef.current;
    if (node) {
      const focusable = node.querySelectorAll(FOCUSABLE_SELECTOR);
      const target = focusable[0] || node;
      target.focus?.({ preventScroll: true });
    }

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key === "Tab" && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) {
          e.preventDefault();
          containerRef.current.focus?.();
          return;
        }
        const list = Array.from(focusable);
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      const prev = previouslyFocused.current;
      if (prev && typeof prev.focus === "function") {
        prev.focus({ preventScroll: true });
      }
    };
  }, [open, close]);

  if (!open || typeof document === "undefined") return null;

  const sizeClass =
    size === "sm"
      ? "max-w-sm"
      : size === "lg"
        ? "max-w-2xl"
        : size === "xl"
          ? "max-w-4xl"
          : "max-w-md";

  const node = (
    <div
      className="fixed inset-0 z-[80] flex items-end md:items-center justify-center p-0 md:p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? "dialog-title" : undefined}
      aria-describedby={description ? "dialog-description" : undefined}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlayClick ? close : undefined}
        aria-hidden="true"
      />
      <div
        ref={containerRef}
        tabIndex={-1}
        className={cn(
          "relative w-full bg-card text-card-foreground border border-border shadow-elevated",
          "rounded-t-2xl md:rounded-2xl",
          "animate-slide-up md:animate-scale-in",
          "max-h-[92vh] overflow-hidden flex flex-col",
          sizeClass,
          className,
        )}
      >
        {(title || description || !hideCloseButton) && (
          <div className="flex items-start justify-between gap-3 px-5 pt-5 md:px-6 md:pt-6">
            <div className="space-y-1 min-w-0">
              {title ? (
                <h2
                  id="dialog-title"
                  className="text-base md:text-lg font-semibold tracking-tight text-foreground"
                >
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p
                  id="dialog-description"
                  className="text-sm text-muted-foreground"
                >
                  {description}
                </p>
              ) : null}
            </div>
            {!hideCloseButton ? (
              <button
                type="button"
                onClick={close}
                aria-label="Đóng"
                className="-mr-2 -mt-1 inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        )}
        <div className="overflow-y-auto px-5 md:px-6 py-4 md:py-5 flex-1">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
};

const DialogBody = ({ className, ...props }) => (
  <div className={cn("space-y-3", className)} {...props} />
);

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      "mt-5 -mx-5 md:-mx-6 px-5 md:px-6 pt-4 border-t border-border/60 flex flex-col-reverse sm:flex-row sm:justify-end gap-2",
      className,
    )}
    {...props}
  />
);

export { Dialog, DialogBody, DialogFooter };
export default Dialog;
