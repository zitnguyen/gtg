import { useEffect } from "react";
import { editorStore } from "./useEditorStore";

// Wires standard editor shortcuts:
//   Cmd/Ctrl + Z       -> undo
//   Cmd/Ctrl + Shift+Z -> redo (also Cmd+Y for Windows users)
//   Cmd/Ctrl + S       -> flush autosave (passed via props)
export default function useCmsHotkeys({ flush } = {}) {
  useEffect(() => {
    const handler = (event) => {
      const target = event.target;
      // Allow undo/redo even inside inputs (browser default would only undo
      // the local input). For Cmd+S we always intercept.
      const isMod = event.metaKey || event.ctrlKey;
      if (!isMod) return;
      const key = event.key.toLowerCase();

      if (key === "s") {
        event.preventDefault();
        flush?.();
        return;
      }
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        editorStore.redo();
        return;
      }
      if (key === "y") {
        event.preventDefault();
        editorStore.redo();
        return;
      }
      if (key === "z") {
        // For inputs, browsers undo local typing first; once their internal
        // history is empty they bubble — at which point we step CMS history.
        // We always intercept here because store-level undo is the desired
        // mental model for the page builder.
        event.preventDefault();
        editorStore.undo();
        return;
      }
      void target;
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flush]);
}
