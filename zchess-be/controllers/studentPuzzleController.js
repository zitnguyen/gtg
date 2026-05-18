const { Chess } = require("chess.js");
const asyncHandler = require("../middleware/asyncHandler");
const Student = require("../models/Student");
const Puzzle = require("../models/Puzzle");
const PuzzleAssignment = require("../models/PuzzleAssignment");
const PuzzleAttempt = require("../models/PuzzleAttempt");

const normalize = (value) => String(value || "").trim();

const resolveStudentIdForUser = async (req, candidateStudentId = "") => {
  const role = String(req.user?.role || "").toLowerCase();
  if (role === "parent") {
    const studentId = normalize(candidateStudentId);
    if (!studentId) throw new Error("Thiếu studentId.");
    const student = await Student.findOne({
      _id: studentId,
      parentId: req.user._id,
      isDeleted: { $ne: true },
    }).select("_id");
    if (!student) throw new Error("Bạn không có quyền truy cập học viên này.");
    return String(student._id);
  }
  if (role === "student") {
    const direct = await Student.findOne({
      _id: req.user._id,
      isDeleted: { $ne: true },
    }).select("_id");
    if (!direct) throw new Error("Không tìm thấy hồ sơ học viên.");
    return String(direct._id);
  }
  throw new Error("Role không được phép.");
};

exports.getTodayAssignments = asyncHandler(async (req, res) => {
  let studentId;
  try {
    studentId = await resolveStudentIdForUser(req, req.query.studentId);
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }
  const now = new Date();
  const items = await PuzzleAssignment.find({
    studentId,
    status: { $in: ["active", "completed"] },
    deadline: { $gte: now },
  })
    .populate("puzzleIds")
    .sort({ createdAt: -1 })
    .lean();

  const puzzleIds = items.flatMap((item) =>
    (Array.isArray(item.puzzleIds) ? item.puzzleIds : []).map((p) => String(p._id || p)),
  );
  const attempts = await PuzzleAttempt.find({
    studentId,
    puzzleId: { $in: puzzleIds },
  }).lean();
  const attemptMap = Object.fromEntries(
    attempts.map((item) => [String(item.puzzleId), item]),
  );

  const merged = items.map((item) => ({
    ...item,
    puzzles: (Array.isArray(item.puzzleIds) ? item.puzzleIds : []).map((puzzle) => ({
      ...puzzle,
      attempt: attemptMap[String(puzzle._id)]
        ? {
            result: attemptMap[String(puzzle._id)].result,
            accuracy: Number(attemptMap[String(puzzle._id)].accuracy || 0),
            timeSpent: Number(attemptMap[String(puzzle._id)].timeSpent || 0),
            moveCount: Array.isArray(attemptMap[String(puzzle._id)].moves)
              ? attemptMap[String(puzzle._id)].moves.length
              : 0,
          }
        : null,
    })),
  }));

  return res.json({ items: merged, studentId });
});

exports.submitMove = asyncHandler(async (req, res) => {
  let studentId;
  try {
    studentId = await resolveStudentIdForUser(req, req.body.studentId);
  } catch (error) {
    return res.status(403).json({ message: error.message });
  }

  const puzzleId = normalize(req.params.puzzleId);
  const moveInput = normalize(req.body.move);
  if (!moveInput) return res.status(400).json({ message: "Thiếu move." });

  const puzzle = await Puzzle.findById(puzzleId).select("_id fen");
  if (!puzzle) return res.status(404).json({ message: "Puzzle không tồn tại." });

  const assignment = await PuzzleAssignment.findOne({
    studentId,
    puzzleIds: puzzleId,
    deadline: { $gte: new Date() },
  }).select("_id status");
  if (!assignment) {
    return res.status(403).json({ message: "Puzzle chưa được giao hoặc đã quá hạn." });
  }

  let attempt = await PuzzleAttempt.findOne({ studentId, puzzleId });
  if (!attempt) {
    attempt = await PuzzleAttempt.create({
      studentId,
      puzzleId,
      moves: [],
      result: "failed",
      accuracy: 0,
      timeSpent: 0,
      firstMoveAt: null,
      lastMoveAt: null,
    });
  }

  const game = new Chess();
  const existingMoves = Array.isArray(attempt.moves) ? attempt.moves : [];
  if (existingMoves.length > 0) {
    const latestFen = existingMoves[existingMoves.length - 1].fenAfter;
    game.load(latestFen);
  } else {
    game.load(puzzle.fen);
  }
  const fenBefore = game.fen();
  const moved = game.move(moveInput, { sloppy: true });
  if (!moved) {
    const totalMoves = existingMoves.length + 1;
    const legalMoves = existingMoves.length;
    attempt.accuracy = totalMoves > 0 ? Math.round((legalMoves / totalMoves) * 100) : 0;
    attempt.result = "failed";
    attempt.lastMoveAt = new Date();
    if (!attempt.firstMoveAt) attempt.firstMoveAt = new Date();
    attempt.timeSpent = Math.max(
      0,
      Math.round(
        ((attempt.lastMoveAt || new Date()).getTime() -
          (attempt.firstMoveAt || new Date()).getTime()) /
          1000,
      ),
    );
    await attempt.save();
    return res.status(400).json({ message: "Nước đi không hợp lệ.", valid: false });
  }

  const fenAfter = game.fen();
  attempt.moves.push({
    move: moved.san || moveInput,
    fenBefore,
    fenAfter,
    timestamp: Date.now(),
  });
  attempt.lastMoveAt = new Date();
  if (!attempt.firstMoveAt) attempt.firstMoveAt = new Date();
  const totalMoves = attempt.moves.length;
  const legalMoves = attempt.moves.length;
  attempt.accuracy = totalMoves > 0 ? Math.round((legalMoves / totalMoves) * 100) : 0;
  attempt.timeSpent = Math.max(
    0,
    Math.round(
      ((attempt.lastMoveAt || new Date()).getTime() -
        (attempt.firstMoveAt || new Date()).getTime()) /
        1000,
    ),
  );
  if (game.isCheckmate() || game.isStalemate() || game.isDraw()) {
    attempt.result = "completed";
  } else {
    attempt.result = "failed";
  }
  await attempt.save();

  return res.json({
    valid: true,
    move: moved.san,
    fenAfter,
    result: attempt.result,
    accuracy: attempt.accuracy,
    timeSpent: attempt.timeSpent,
    moveCount: attempt.moves.length,
  });
});
