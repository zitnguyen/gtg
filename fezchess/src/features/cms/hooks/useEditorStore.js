import { useRef, useSyncExternalStore } from "react";
import editorStore from "../stores/editorStore";

// Stable subscribe reference — module-scope so React doesn't see a new
// function each render and resubscribe.
const subscribe = (listener) => editorStore.subscribe(listener);

const shallowEqual = (a, b) => {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
};

// Subscribe to a derived slice of the editor store. Selectors that return
// object literals (e.g. {status, dirty, canUndo, canRedo}) must produce a
// stable reference between renders when nothing changed, otherwise React's
// useSyncExternalStore detects an unstable snapshot and bails with
// "getSnapshot should be cached to avoid an infinite loop".
//
// We solve that here by memoising the previous selector result and returning
// the cached reference whenever the shallow content is unchanged. This keeps
// the call sites ergonomic (inline arrow selectors are fine) without forcing
// every consumer to memoise a selector function.
export default function useEditorStore(selector) {
  const cacheRef = useRef({ hasValue: false, value: undefined });

  const getSnapshot = () => {
    const next = selector(editorStore.getState());
    if (
      cacheRef.current.hasValue &&
      shallowEqual(cacheRef.current.value, next)
    ) {
      return cacheRef.current.value;
    }
    cacheRef.current.value = next;
    cacheRef.current.hasValue = true;
    return next;
  };

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export { editorStore };
