import { createStore } from "./createStore";

const STORAGE_KEY = "zchess.training.state";

const defaultState = () => ({
  mode: "rush", // rush | survival | daily | theme
  status: "idle", // idle | active | paused | finished
  startedAt: null,
  endsAt: null,
  durationSec: 180,
  currentPuzzle: null,
  queue: [],
  solved: 0,
  failed: 0,
  streak: 0,
  bestStreak: 0,
  totalAttempted: 0,
  rating: readPersistedRating(),
  history: [],
  lives: 3,
  themeFilter: null,
  difficulty: null,
});

function readPersistedRating() {
  if (typeof window === "undefined") return 100;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 100;
    const parsed = JSON.parse(raw);
    return Number.isFinite(parsed?.rating) ? parsed.rating : 100;
  } catch {
    return 100;
  }
}

function persistRating(rating) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ rating, updatedAt: Date.now() }),
    );
  } catch {
    // ignore quota
  }
}

export const trainingStore = createStore(defaultState);

export const startSession = ({
  mode = "rush",
  durationSec = 180,
  queue = [],
  themeFilter = null,
  difficulty = null,
  lives = 3,
} = {}) => {
  trainingStore.setState((state) => ({
    ...state,
    mode,
    status: "active",
    startedAt: Date.now(),
    endsAt: durationSec ? Date.now() + durationSec * 1000 : null,
    durationSec,
    currentPuzzle: queue[0] || null,
    queue: queue.slice(1),
    solved: 0,
    failed: 0,
    streak: 0,
    bestStreak: 0,
    totalAttempted: 0,
    history: [],
    themeFilter,
    difficulty,
    lives,
  }));
};

export const enqueuePuzzles = (puzzles = []) => {
  trainingStore.setState((state) => ({
    ...state,
    queue: [...state.queue, ...puzzles],
    currentPuzzle: state.currentPuzzle || puzzles[0] || null,
    queue:
      state.currentPuzzle == null && puzzles.length
        ? puzzles.slice(1)
        : [...state.queue, ...puzzles],
  }));
};

export const advancePuzzle = ({ correct, durationMs }) => {
  trainingStore.setState((state) => {
    const next = state.queue[0] || null;
    const updatedHistory = [
      ...state.history.slice(-49),
      {
        puzzleId: state.currentPuzzle?._id,
        correct,
        durationMs,
        ratingAtTime: state.rating,
      },
    ];
    const ratingDelta = correct
      ? 8 + Math.max(0, Math.round((state.rating - 100) / 250))
      : -10 - Math.max(0, Math.round((500 - state.rating) / 200));
    const nextRating = Math.max(100, Math.min(3000, state.rating + ratingDelta));
    persistRating(nextRating);

    const newStreak = correct ? state.streak + 1 : 0;
    const livesLeft = correct ? state.lives : Math.max(0, state.lives - 1);
    const finished =
      state.mode === "survival"
        ? livesLeft <= 0
        : state.mode === "daily"
          ? !next
          : !next || (state.endsAt && Date.now() >= state.endsAt);

    return {
      ...state,
      currentPuzzle: finished ? null : next,
      queue: state.queue.slice(1),
      solved: state.solved + (correct ? 1 : 0),
      failed: state.failed + (correct ? 0 : 1),
      streak: newStreak,
      bestStreak: Math.max(state.bestStreak, newStreak),
      totalAttempted: state.totalAttempted + 1,
      history: updatedHistory,
      lives: livesLeft,
      rating: nextRating,
      status: finished ? "finished" : "active",
    };
  });
};

export const finishSession = () => {
  trainingStore.setState((state) => ({
    ...state,
    status: "finished",
    currentPuzzle: null,
  }));
};

export const resetSession = () => {
  trainingStore.setState(() => defaultState());
};

export const tickSession = () => {
  trainingStore.setState((state) => {
    if (state.status !== "active") return state;
    if (!state.endsAt) return state;
    if (Date.now() >= state.endsAt) {
      return { ...state, status: "finished", currentPuzzle: null };
    }
    return state;
  });
};
