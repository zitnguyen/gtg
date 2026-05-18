import { useSyncExternalStore } from "react";
import {
  subscribe,
  getSnapshot,
  startActivity,
  endActivity,
} from "../stores/activityStore";

export const useGlobalActivity = () =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const useActivityActions = () => ({ startActivity, endActivity });
