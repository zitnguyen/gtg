import pdfPuzzleService from "../../../services/pdfPuzzleService";

/**
 * Demo puzzle pool used when the backend has no assignments for the user.
 * Each entry has a starting FEN plus the SAN of the correct first move so the
 * trainer is always playable out of the box. Real assignments coming from
 * `/student/assignments/today` always take priority.
 */
const DEMO_POOL = [
  {
    _id: "demo-1",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    solutionSan: ["Ng5"],
    rating: 1100,
    theme: "fork",
    title: "Tactical fork",
  },
  {
    _id: "demo-2",
    fen: "r2qkbnr/ppp2ppp/2n5/3pp3/3P4/2N1PN2/PPP2PPP/R1BQKB1R w KQkq - 0 5",
    solutionSan: ["dxe5"],
    rating: 1150,
    theme: "exchange",
    title: "Centre exchange",
  },
  {
    _id: "demo-3",
    fen: "rnbqkbnr/ppp2ppp/8/3pp3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3",
    solutionSan: ["exd5"],
    rating: 1080,
    theme: "central-pawn",
    title: "Central capture",
  },
  {
    _id: "demo-4",
    fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    solutionSan: ["c3"],
    rating: 1180,
    theme: "italian",
    title: "Italian quiet",
  },
];

const normaliseAssignment = (assignment) => {
  if (!assignment) return null;
  const puzzle = assignment.puzzleId || assignment.puzzle || assignment;
  if (!puzzle?.fen) return null;
  return {
    _id: puzzle._id || assignment._id,
    fen: puzzle.fen,
    solutionSan: Array.isArray(puzzle.solutionSan)
      ? puzzle.solutionSan
      : Array.isArray(puzzle.solutionMoves)
        ? puzzle.solutionMoves
        : null,
    rating: puzzle.rating || 1200,
    theme: puzzle.theme || null,
    title: puzzle.title || `Puzzle ${(puzzle._id || "").slice(-4)}`,
  };
};

export const fetchPuzzleQueue = async ({ studentId, fallback = true } = {}) => {
  try {
    const res = await pdfPuzzleService.getTodayAssignments(
      studentId ? { studentId } : {},
    );
    const items = Array.isArray(res?.assignments)
      ? res.assignments
      : Array.isArray(res?.data?.assignments)
        ? res.data.assignments
        : Array.isArray(res)
          ? res
          : [];
    const mapped = items.map(normaliseAssignment).filter(Boolean);
    if (mapped.length) return mapped;
  } catch {
    // ignore – fall through to demo pool
  }
  if (!fallback) return [];
  return [...DEMO_POOL];
};

export const submitPuzzleMove = (puzzleId, payload) => {
  if (!puzzleId || String(puzzleId).startsWith("demo-")) {
    // Demo puzzles run fully on the client.
    return Promise.resolve({ ok: true, demo: true });
  }
  return pdfPuzzleService.submitMove(puzzleId, payload);
};

export const shufflePool = (puzzles) => {
  const arr = [...(puzzles || [])];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
