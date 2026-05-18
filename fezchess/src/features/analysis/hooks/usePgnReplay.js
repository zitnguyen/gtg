import { useEffect } from "react";

/**
 * Keyboard shortcuts for the analysis player. Arrow keys navigate the move
 * tree, Home/End jump to start/end, F flips orientation. Skipped when the
 * user is typing in an input.
 */
export const usePgnReplay = ({ onNext, onPrev, onStart, onEnd, onFlip }) => {
  useEffect(() => {
    const handle = (event) => {
      const tag = String(event.target?.tagName || "").toLowerCase();
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        event.target?.isContentEditable;
      if (isTyping) return;

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          onNext?.();
          break;
        case "ArrowLeft":
          event.preventDefault();
          onPrev?.();
          break;
        case "Home":
          event.preventDefault();
          onStart?.();
          break;
        case "End":
          event.preventDefault();
          onEnd?.();
          break;
        case "f":
        case "F":
          if (!event.metaKey && !event.ctrlKey) {
            event.preventDefault();
            onFlip?.();
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onEnd, onFlip, onNext, onPrev, onStart]);
};

export default usePgnReplay;
