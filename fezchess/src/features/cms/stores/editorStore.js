import defaultPublicCms from "../schema/defaultPublicCms";
import {
  deepMerge,
  getByPath,
  setByPath,
  splitPath,
  stableJson,
} from "../utils/path";

// Vanilla store with React 18 useSyncExternalStore. Designed so multiple
// editors / preview panes / toolbar widgets can subscribe independently
// without prop drilling and without a context re-render storm.
//
// The state is intentionally minimal:
//   draft        : working copy that the editor reads/writes
//   savedSnapshot: last value confirmed by server (for dirty detection + reset)
//   history.past : stack of previous draft snapshots for undo
//   history.future: stack popped by undo, restored by redo
//   status       : 'idle' | 'saving' | 'saved' | 'error'
//   dirtyPaths   : Set of paths touched since last save
//   savedAt      : timestamp of last successful save
//
// All mutations go through pure helpers in utils/path so structural sharing
// is preserved (allowing cheap reference equality checks downstream).

const HISTORY_LIMIT = 50;

const createInitialState = () => ({
  draft: defaultPublicCms,
  savedSnapshot: defaultPublicCms,
  history: { past: [], future: [] },
  status: "idle",
  lastError: null,
  dirty: false,
  dirtyPaths: new Set(),
  savedAt: null,
  hydrated: false,
});

let state = createInitialState();
const listeners = new Set();

const emit = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error("CMS editor store listener error", err);
    }
  });
};

const setState = (patch) => {
  state = { ...state, ...patch };
  emit();
};

const pushHistory = (previousDraft) => {
  const past = [...state.history.past, previousDraft];
  if (past.length > HISTORY_LIMIT) past.shift();
  state.history = { past, future: [] };
};

const recomputeDirty = (nextDraft, snapshot) =>
  stableJson(nextDraft) !== stableJson(snapshot);

const editorStore = {
  getState: () => state,

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  init(serverData) {
    const merged = deepMerge(defaultPublicCms, serverData || {});
    state = {
      ...createInitialState(),
      draft: merged,
      savedSnapshot: merged,
      hydrated: true,
      savedAt: Date.now(),
    };
    emit();
  },

  setField(path, value, { recordHistory = true } = {}) {
    const previousValue = getByPath(state.draft, path);
    if (stableJson(previousValue) === stableJson(value)) return;
    const previousDraft = state.draft;
    const nextDraft = setByPath(previousDraft, path, value);

    if (recordHistory) pushHistory(previousDraft);

    const dirtyPaths = new Set(state.dirtyPaths);
    const top = splitPath(path)[0];
    if (top) dirtyPaths.add(top);

    setState({
      draft: nextDraft,
      dirty: recomputeDirty(nextDraft, state.savedSnapshot),
      dirtyPaths,
      status: state.status === "error" ? "error" : "idle",
    });
  },

  setMany(patches, { recordHistory = true } = {}) {
    if (!patches || typeof patches !== "object") return;
    const previousDraft = state.draft;
    let nextDraft = previousDraft;
    Object.entries(patches).forEach(([path, value]) => {
      nextDraft = setByPath(nextDraft, path, value);
    });
    if (nextDraft === previousDraft) return;
    if (recordHistory) pushHistory(previousDraft);

    const dirtyPaths = new Set(state.dirtyPaths);
    Object.keys(patches).forEach((path) => {
      const top = splitPath(path)[0];
      if (top) dirtyPaths.add(top);
    });

    setState({
      draft: nextDraft,
      dirty: recomputeDirty(nextDraft, state.savedSnapshot),
      dirtyPaths,
    });
  },

  undo() {
    const { past, future } = state.history;
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const nextPast = past.slice(0, -1);
    const nextFuture = [state.draft, ...future];
    state.history = { past: nextPast, future: nextFuture };
    setState({
      draft: previous,
      dirty: recomputeDirty(previous, state.savedSnapshot),
    });
  },

  redo() {
    const { past, future } = state.history;
    if (future.length === 0) return;
    const next = future[0];
    const nextFuture = future.slice(1);
    const nextPast = [...past, state.draft];
    state.history = { past: nextPast, future: nextFuture };
    setState({
      draft: next,
      dirty: recomputeDirty(next, state.savedSnapshot),
    });
  },

  reset() {
    state.history = { past: [], future: [] };
    setState({
      draft: state.savedSnapshot,
      dirty: false,
      dirtyPaths: new Set(),
      status: "idle",
      lastError: null,
    });
  },

  beginSave() {
    setState({ status: "saving", lastError: null });
  },

  markSaved(serverData) {
    const merged = deepMerge(defaultPublicCms, serverData || state.draft);
    setState({
      status: "saved",
      lastError: null,
      savedSnapshot: merged,
      draft: merged,
      dirty: false,
      dirtyPaths: new Set(),
      savedAt: Date.now(),
    });
  },

  markSaveError(error) {
    setState({ status: "error", lastError: error });
  },

  canUndo: () => state.history.past.length > 0,
  canRedo: () => state.history.future.length > 0,
  isDirty: () => state.dirty,
  getDraft: () => state.draft,
  getValue: (path) => getByPath(state.draft, path),
};

export default editorStore;
