import { useCallback } from "react";
import useEditorStore, { editorStore } from "./useEditorStore";
import { getByPath } from "../utils/path";

// Bind a single CMS field to the central store. Components using this only
// rerender when the value at `path` changes — sibling fields don't trigger
// rerenders, which keeps the editor snappy with hundreds of inputs.
export default function useFieldValue(path, defaultValue = "") {
  const value = useEditorStore((state) => {
    const v = getByPath(state.draft, path);
    return v === undefined || v === null ? defaultValue : v;
  });

  const setValue = useCallback(
    (next) => editorStore.setField(path, next),
    [path],
  );

  return [value, setValue];
}
