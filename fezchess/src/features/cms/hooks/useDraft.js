import useEditorStore from "./useEditorStore";

// Subscribe to the entire draft document. Used by the live preview pane only
// (which intentionally re-renders when any field changes). Field editors must
// use useFieldValue instead to keep render scope local.
export default function useDraft() {
  return useEditorStore((state) => state.draft);
}
