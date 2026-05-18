import { useRef, useSyncExternalStore } from "react";
import { shallowEqual } from "./createStore";

/**
 * Subscribes to a slice of an external store. The selector result is shallow-
 * compared against the previous snapshot so React's `useSyncExternalStore`
 * never throws "result of getSnapshot should be cached".
 */
export const useStoreSelector = (store, selector) => {
  const cacheRef = useRef({ hasValue: false, value: undefined });

  const getSnapshot = () => {
    const next = selector(store.getState());
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

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
};
