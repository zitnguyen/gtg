import useEditorStore from "./useEditorStore";

// Lightweight selector for toolbar-style components that need only the
// status / dirty / history availability — never the full draft.
export default function useEditorStatus() {
  return useEditorStore((state) => ({
    status: state.status,
    dirty: state.dirty,
    canUndo: state.history.past.length > 0,
    canRedo: state.history.future.length > 0,
    savedAt: state.savedAt,
    hydrated: state.hydrated,
    lastError: state.lastError,
  }));
}
