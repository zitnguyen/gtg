import { useEffect } from "react";
import { matchesShortcut, SHORTCUTS } from "../config/shortcuts";

const isFocusableInput = (target) => {
  if (!target) return false;
  const tagName = String(target.tagName || "").toLowerCase();
  if (tagName === "input" || tagName === "textarea" || tagName === "select") {
    return true;
  }
  if (target.isContentEditable) return true;
  return false;
};

export const useKeyboardShortcuts = ({
  onOpenPalette,
  onToggleSidebar,
  onCloseOverlay,
  onQuickSearch,
} = {}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (matchesShortcut(event, SHORTCUTS.COMMAND_PALETTE) && onOpenPalette) {
        event.preventDefault();
        onOpenPalette();
        return;
      }
      if (matchesShortcut(event, SHORTCUTS.TOGGLE_SIDEBAR) && onToggleSidebar) {
        event.preventDefault();
        onToggleSidebar();
        return;
      }
      if (matchesShortcut(event, SHORTCUTS.CLOSE_OVERLAY) && onCloseOverlay) {
        onCloseOverlay();
        return;
      }
      if (
        matchesShortcut(event, SHORTCUTS.QUICK_SEARCH) &&
        onQuickSearch &&
        !isFocusableInput(event.target)
      ) {
        event.preventDefault();
        onQuickSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenPalette, onToggleSidebar, onCloseOverlay, onQuickSearch]);
};
