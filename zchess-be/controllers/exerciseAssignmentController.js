const { Chess } = require("chess.js");
const pdfParseLib = require("pdf-parse");
const asyncHandler = require("../middleware/asyncHandler");
const ExerciseAssignment = require("../models/ExerciseAssignment");
const ExerciseAssignmentProgress = require("../models/ExerciseAssignmentProgress");
const Student = require("../models/Student");
const ClassModel = require("../models/Class");
const {
  parsePgnToExercises,
  parseFenToExercise,
  parseLooseSanTextToExercises,
} = require("../services/chessExerciseParserService");

const normalize = (value) => String(value || "").trim();

const normalizeDay = (dateInput = new Date()) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const isValidFen = (fen) => {
  const normalized = normalize(fen);
  if (!normalized) return false;
  try {
    const game = new Chess();
    game.load(normalized);
    return true;
  } catch {
    return false;
  }
};

const resolveAssignmentStudentIds = async ({
  studentIds = [],
  classIds = [],
}) => {
  const idSet = new Set((Array.isArray(studentIds) ? studentIds : []).map(String));
  const classIdList = (Array.isArray(classIds) ? classIds : []).filter(Boolean);
  if (classIdList.length > 0) {
    const classes = await ClassModel.find({ _id: { $in: classIdList } }).select("studentIds");
    classes.forEach((item) => {
      (Array.isArray(item?.studentIds) ? item.studentIds : []).forEach((studentId) => {
        idSet.add(String(studentId));
      });
    });
  }
  return Array.from(idSet);
};

exports.createAssignment = asyncHandler(async (req, res) => {
  const title = normalize(req.body.title);
  const description = normalize(req.body.description);
  const difficulty = normalize(req.body.difficulty) || "mixed";
  const positionFen = normalize(req.body.positionFen);
  const tags = Array.isArray(req.body.tags)
    ? req.body.tags.map((tag) => normalize(tag)).filter(Boolean)
    : [];
  const exerciseIds = Array.isArray(req.body.exerciseIds)
    ? req.body.exerciseIds.map(String).filter(Boolean)
    : [];
  const studentIds = Array.isArray(req.body.studentIds)
    ? req.body.studentIds.map(String).filter(Boolean)
    : [];
  const classIds = Array.isArray(req.body.classIds)
    ? req.body.classIds.map(String).filter(Boolean)
    : [];
  const assignedDate = normalizeDay(req.body.assignedDate || new Date());
  const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;

  if (!title) return res.status(400).json({ message: "Thiếu tiêu đề bài tập" });
  if (!positionFen) {
    return res.status(400).json({ message: "Thiếu thế cờ ban đầu (positionFen)" });
  }
  try {
    const validateGame = new Chess();
    validateGame.load(positionFen);
  } catch {
    return res.status(400).json({ message: "positionFen không hợp lệ" });
  }
  if (!assignedDate || !dueDate || Number.isNaN(dueDate.getTime())) {
    return res.status(400).json({ message: "assignedDate/dueDate không hợp lệ" });
  }

  const allStudentIds = await resolveAssignmentStudentIds({ studentIds, classIds });
  if (allStudentIds.length === 0) {
    return res
      .status(400)
      .json({ message: "Không tìm thấy học viên nào để giao bài tập" });
  }

  const students = await Student.find({
    _id: { $in: allStudentIds },
    isDeleted: { $ne: true },
  }).select("_id");
  if (students.length === 0) {
    return res.status(400).json({ message: "Danh sách học viên không hợp lệ" });
  }

  const assignment = await ExerciseAssignment.create({
    title,
    description,
    difficulty,
    positionFen,
    tags,
    exerciseIds,
    studentIds: students.map((item) => item._id),
    classIds,
    assignedDate,
    dueDate,
    createdBy: req.user._id,
  });

  return res.status(201).json(assignment);
});

exports.getAssignmentsForManagement = asyncHandler(async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  const query = {};
  if (req.user?.role === "Teacher") {
    query.createdBy = req.user._id;
  }
  if (from || to) {
    query.assignedDate = {};
    if (from && !Number.isNaN(from.getTime())) query.assignedDate.$gte = from;
    if (to && !Number.isNaN(to.getTime())) query.assignedDate.$lte = to;
  }
  const items = await ExerciseAssignment.find(query)
    .populate("createdBy", "fullName role")
    .populate("exerciseIds", "title difficulty tags")
    .populate("studentIds", "fullName studentId")
    .populate("classIds", "className classId")
    .sort({ assignedDate: -1, createdAt: -1 })
    .lean();

  return res.json({ items });
});

exports.getMyDailyAssignments = asyncHandler(async (req, res) => {
  const day = normalizeDay(req.query.date || new Date());
  if (!day) return res.status(400).json({ message: "Ngày không hợp lệ" });
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);

  let studentId = normalize(req.query.studentId);
  if (String(req.user?.role || "").toLowerCase() === "parent") {
    const myChildren = await Student.find({
      parentId: req.user._id,
      isDeleted: { $ne: true },
    }).select("_id fullName studentId skillLevel");
    const validChildIds = new Set(myChildren.map((item) => String(item._id)));
    if (!studentId) {
      studentId = myChildren[0]?._id ? String(myChildren[0]._id) : "";
    }
    if (!studentId || !validChildIds.has(String(studentId))) {
      return res.status(403).json({ message: "Bạn không có quyền xem học viên này" });
    }
  } else {
    if (!studentId) {
      const directStudent = await Student.findOne({
        _id: req.user._id,
        isDeleted: { $ne: true },
      }).select("_id");
      studentId = directStudent?._id ? String(directStudent._id) : "";
    }
    if (!studentId) {
      return res.status(400).json({ message: "Thiếu studentId cho tài khoản hiện tại" });
    }
  }

  const items = await ExerciseAssignment.find({
    studentIds: studentId,
    assignedDate: { $lte: dayEnd },
    dueDate: { $gte: dayStart },
    status: "active",
  })
    .sort({ assignedDate: -1, createdAt: -1 })
    .lean();
  const safeItems = items.filter((item) => isValidFen(item?.positionFen));

  const progressRows = await ExerciseAssignmentProgress.find({
    assignmentId: { $in: safeItems.map((item) => item._id) },
    studentId,
  }).lean();
  const progressMap = Object.fromEntries(
    progressRows.map((row) => [String(row.assignmentId), row]),
  );

  const merged = safeItems.map((item) => {
    const progress = progressMap[String(item._id)] || null;
    return {
      ...item,
      progress: progress
        ? {
            completed: Boolean(progress.completed),
            solvedPuzzles: Number(progress.solvedPuzzles || 0),
            totalPuzzles: Number(progress.totalPuzzles || 1),
            accuracy: Number(progress.accuracy || 0),
            timeSpentSec: Number(progress.timeSpentSec || 0),
            submittedCount: Number(progress.submittedCount || 0),
            latestSubmittedFen: normalize(progress.latestSubmittedFen || ""),
          }
        : {
            completed: false,
            solvedPuzzles: 0,
            totalPuzzles: 1,
            accuracy: 0,
            timeSpentSec: 0,
            submittedCount: 0,
            latestSubmittedFen: "",
          },
    };
  });

  return res.json({ items: merged, studentId });
});

exports.submitAssignmentBoard = asyncHandler(async (req, res) => {
  const assignment = await ExerciseAssignment.findById(req.params.assignmentId);
  if (!assignment || assignment.status !== "active") {
    return res.status(404).json({ message: "Assignment không tồn tại hoặc đã đóng" });
  }

  const studentId = normalize(req.body.studentId);
  const role = String(req.user?.role || "").toLowerCase();
  const resolvedStudentId = studentId || (role === "student" ? String(req.user._id) : "");
  if (
    !resolvedStudentId ||
    !assignment.studentIds.some((id) => String(id) === resolvedStudentId)
  ) {
    return res.status(403).json({ message: "Học viên không thuộc assignment" });
  }

  if (role === "parent") {
    const mine = await Student.findOne({
      _id: resolvedStudentId,
      parentId: req.user._id,
      isDeleted: { $ne: true },
    }).select("_id");
    if (!mine) {
      return res.status(403).json({ message: "Bạn không có quyền nộp cho học viên này" });
    }
  }

  const submittedFen = normalize(req.body.fen || req.body.submittedFen);
  const submittedPgn = normalize(req.body.pgn);
  const submittedMoves = Array.isArray(req.body.moves)
    ? req.body.moves.map((item) => normalize(item)).filter(Boolean)
    : [];
  if (!submittedFen) return res.status(400).json({ message: "Thiếu FEN nộp bài" });
  try {
    const validateGame = new Chess();
    validateGame.load(submittedFen);
  } catch {
    return res.status(400).json({ message: "FEN học viên nộp không hợp lệ" });
  }
  const deltaSec = Math.max(0, Number(req.body.timeSpentSec || 0));

  let progress = await ExerciseAssignmentProgress.findOne({
    assignmentId: assignment._id,
    studentId: resolvedStudentId,
  });
  if (!progress) {
    progress = await ExerciseAssignmentProgress.create({
      assignmentId: assignment._id,
      studentId: resolvedStudentId,
      puzzleProgress: [],
      totalPuzzles: 1,
    });
  }
  progress.submittedCount = Number(progress.submittedCount || 0) + 1;
  progress.latestSubmittedFen = submittedFen;
  progress.submissions = [
    ...(Array.isArray(progress.submissions) ? progress.submissions : []),
    {
      fen: submittedFen,
      pgn: submittedPgn,
      moves: submittedMoves,
      submittedAt: new Date(),
      timeSpentSec: deltaSec,
    },
  ];
  progress.totalPuzzles = 1;
  progress.solvedPuzzles = 1;
  progress.timeSpentSec = Number(progress.timeSpentSec || 0) + deltaSec;
  progress.completed = true;
  progress.completedAt = progress.completedAt || new Date();
  progress.lastActivityAt = new Date();
  await progress.save();

  return res.json({
    message: "Đã nộp FEN thành công.",
    progress: {
      completed: progress.completed,
      solvedPuzzles: progress.solvedPuzzles,
      totalPuzzles: progress.totalPuzzles,
      timeSpentSec: progress.timeSpentSec,
      submittedCount: progress.submittedCount,
      latestSubmittedFen: progress.latestSubmittedFen,
    },
  });
});

exports.getAssignmentProgress = asyncHandler(async (req, res) => {
  const assignment = await ExerciseAssignment.findById(req.params.id)
    .populate("studentIds", "fullName studentId")
    .populate("exerciseIds", "title difficulty tags");
  if (!assignment) return res.status(404).json({ message: "Assignment không tồn tại" });

  const rows = await ExerciseAssignmentProgress.find({
    assignmentId: assignment._id,
  })
    .populate("studentId", "fullName studentId skillLevel")
    .sort({ completed: 1, solvedPuzzles: -1, accuracy: -1, timeSpentSec: 1 })
    .lean();

  return res.json({ assignment, rows });
});

const extractFenCandidates = (text = "") => {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const candidates = [];
  lines.forEach((line) => {
    const game = new Chess();
    try {
      const loaded = game.load(line);
      if (loaded) candidates.push(game.fen());
    } catch {
      // Skip non-FEN line.
    }
  });
  return Array.from(new Set(candidates));
};

const parsePdfText = async (buffer) => {
  if (!buffer) return "";
  if (typeof pdfParseLib === "function") {
    const data = await pdfParseLib(buffer);
    return String(data?.text || "");
  }
  if (typeof pdfParseLib?.default === "function") {
    const data = await pdfParseLib.default(buffer);
    return String(data?.text || "");
  }
  if (typeof pdfParseLib?.PDFParse === "function") {
    const parser = new pdfParseLib.PDFParse({ data: buffer });
    try {
      const data = await parser.getText();
      return String(data?.text || "");
    } finally {
      if (typeof parser.destroy === "function") {
        await parser.destroy();
      }
    }
  }
  throw new Error("Không hỗ trợ parser PDF hiện tại.");
};

exports.autoAssignFromPdf = asyncHandler(async (req, res) => {
  if (!req.file?.buffer) {
    return res.status(400).json({ message: "Vui lòng tải file PDF." });
  }

  const title = normalize(req.body.title) || "Bài tập PDF";
  const description = normalize(req.body.description);
  const difficulty = normalize(req.body.difficulty) || "mixed";
  const studentIds = Array.isArray(req.body.studentIds)
    ? req.body.studentIds.map(String).filter(Boolean)
    : String(req.body.studentIds || "")
        .split(",")
        .map((item) => normalize(item))
        .filter(Boolean);
  const classIds = Array.isArray(req.body.classIds)
    ? req.body.classIds.map(String).filter(Boolean)
    : String(req.body.classIds || "")
        .split(",")
        .map((item) => normalize(item))
        .filter(Boolean);
  const assignedDate = normalizeDay(req.body.assignedDate || new Date());
  const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
  if (!assignedDate || !dueDate || Number.isNaN(dueDate.getTime())) {
    return res.status(400).json({ message: "assignedDate/dueDate không hợp lệ" });
  }

  const allStudentIds = await resolveAssignmentStudentIds({ studentIds, classIds });
  if (allStudentIds.length === 0) {
    return res
      .status(400)
      .json({ message: "Không tìm thấy học viên nào để giao bài tập" });
  }
  const students = await Student.find({
    _id: { $in: allStudentIds },
    isDeleted: { $ne: true },
  }).select("_id");
  if (students.length === 0) {
    return res.status(400).json({ message: "Danh sách học viên không hợp lệ" });
  }

  const pdfText = String(await parsePdfText(req.file.buffer)).trim();
  if (!pdfText) {
    return res.status(400).json({ message: "Không trích xuất được nội dung từ PDF." });
  }

  const fenList = extractFenCandidates(pdfText);
  let parsedExercises = [];
  let parseMode = "fen";

  if (fenList.length > 0) {
    parsedExercises = fenList.map((fen, idx) => ({
      title: `Bài tập PDF #${idx + 1}`,
      startFen: fen,
    }));
  } else {
    try {
      const parsed = parsePgnToExercises(pdfText);
      parsedExercises = parsed.exercises.map((item, idx) => ({
        title: item.title || `Bài tập PGN #${idx + 1}`,
        startFen: item.startFen,
      }));
      parseMode = "pgn";
    } catch {
      try {
        const parsed = parseFenToExercise(pdfText);
        parsedExercises = parsed.exercises.map((item, idx) => ({
          title: item.title || `Bài tập FEN #${idx + 1}`,
          startFen: item.startFen,
        }));
        parseMode = "fen-single";
      } catch {
        const parsed = parseLooseSanTextToExercises(pdfText);
        parsedExercises = parsed.exercises.map((item, idx) => ({
          title: item.title || `Bài tập SAN #${idx + 1}`,
          startFen: item.startFen,
        }));
        parseMode = "san-heuristic";
      }
    }
  }

  if (parsedExercises.length === 0) {
    return res.status(400).json({ message: "Không tạo được bài tập từ PDF." });
  }
  const safeExercises = parsedExercises.filter((item) => isValidFen(item?.startFen));
  if (safeExercises.length === 0) {
    return res.status(400).json({
      message: "PDF không chứa thế cờ hợp lệ (FEN/PGN).",
    });
  }

  const assignmentDocs = await ExerciseAssignment.insertMany(
    safeExercises.map((item, idx) => ({
      title: `${title} - ${idx + 1}`,
      description: description || `Tự động tạo từ file PDF (${item.title || "Puzzle"})`,
      difficulty,
      positionFen: item.startFen,
      tags: ["pdf-auto"],
      exerciseIds: [],
      studentIds: students.map((student) => student._id),
      classIds,
      assignedDate,
      dueDate,
      createdBy: req.user._id,
    })),
  );

  return res.status(201).json({
    message: `Đã tạo ${assignmentDocs.length} bài tập tự động từ PDF.`,
    parseMode,
    totalAssignments: assignmentDocs.length,
    items: assignmentDocs,
  });
});
