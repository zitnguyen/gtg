const { Chess } = require("chess.js");
const ChessExercise = require("../models/ChessExercise");
const ChessExerciseAttempt = require("../models/ChessExerciseAttempt");
const Lesson = require("../models/Lesson");
const {
  parsePgnToExercises,
  parseFenToExercise,
  parseImageToExerciseDraft,
} = require("../services/chessExerciseParserService");
const asyncHandler = require("../middleware/asyncHandler");

const normalize = (value) => String(value || "").trim();

const parseImportFileContent = async (req) => {
  if (!req.file) return "";
  if (req.file.buffer) return req.file.buffer.toString("utf8");
  return "";
};

exports.importExercises = asyncHandler(async (req, res) => {
  const lessonId = req.body.lessonId;
  const sourceType = String(req.body.sourceType || "pgn");
  const lesson = await Lesson.findById(lessonId).select("_id type");
  if (!lesson) return res.status(404).json({ message: "Lesson không tồn tại" });
  if (lesson.type !== "chess") {
    return res.status(400).json({ message: "Chỉ import bài tập cho lesson chess" });
  }

  const content = normalize(req.body.content) || (await parseImportFileContent(req));
  let parsed;
  if (sourceType === "pgn") {
    parsed = parsePgnToExercises(content);
  } else if (sourceType === "fen") {
    parsed = parseFenToExercise(content);
  } else {
    const fileUrl = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/chess/${req.file.filename}`
      : "";
    parsed = parseImageToExerciseDraft(fileUrl);
  }

  await ChessExercise.deleteMany({ lessonId, status: "draft" });
  const docs = await ChessExercise.insertMany(
    parsed.exercises.map((item) => ({
      lessonId,
      sourceType,
      sourceFileUrl: req.file
        ? `${req.protocol}://${req.get("host")}/uploads/chess/${req.file.filename}`
        : "",
      title: item.title,
      startFen: item.startFen,
      solutionSan: item.solutionSan,
      solutionUci: item.solutionUci,
      parseWarnings: item.parseWarnings || [],
      status: "draft",
      createdBy: req.user._id,
      updatedBy: req.user._id,
    })),
  );

  return res.status(201).json({
    warnings: parsed.warnings || [],
    items: docs,
  });
});

exports.updateExercise = asyncHandler(async (req, res) => {
  const allowed = {};
  [
    "title",
    "startFen",
    "solutionSan",
    "solutionUci",
    "hintText",
    "explanation",
    "difficulty",
    "tags",
    "status",
  ].forEach((key) => {
    if (req.body[key] !== undefined) allowed[key] = req.body[key];
  });
  allowed.updatedBy = req.user._id;

  const updated = await ChessExercise.findByIdAndUpdate(req.params.id, allowed, {
    new: true,
    runValidators: true,
  });
  if (!updated) return res.status(404).json({ message: "Exercise không tồn tại" });
  return res.json(updated);
});

exports.publishExercise = asyncHandler(async (req, res) => {
  const exercise = await ChessExercise.findById(req.params.id);
  if (!exercise) return res.status(404).json({ message: "Exercise không tồn tại" });
  const solutionSan = normalize(req.body.solutionSan || exercise.solutionSan);
  const solutionUci = normalize(req.body.solutionUci || exercise.solutionUci);
  if (!solutionSan && !solutionUci) {
    return res
      .status(400)
      .json({ message: "Cần solutionSan hoặc solutionUci trước khi publish" });
  }
  exercise.solutionSan = solutionSan;
  exercise.solutionUci = solutionUci;
  exercise.hintText = normalize(req.body.hintText || exercise.hintText);
  exercise.explanation = normalize(req.body.explanation || exercise.explanation);
  exercise.status = "published";
  exercise.updatedBy = req.user._id;
  await exercise.save();
  return res.json(exercise);
});

exports.getPublicExercises = asyncHandler(async (req, res) => {
  const lessonId = normalize(req.query.lessonId);
  if (!lessonId) return res.status(400).json({ message: "Thiếu lessonId" });
  const items = await ChessExercise.find({ lessonId, status: "published" })
    .select(
      "_id lessonId title startFen hintText difficulty tags status",
    )
    .sort({ createdAt: 1 });
  return res.json({ items });
});

exports.getExerciseLibrary = asyncHandler(async (req, res) => {
  const query = { status: "published" };
  const difficulty = normalize(req.query.difficulty);
  const tag = normalize(req.query.tag);
  if (difficulty) query.difficulty = difficulty;
  if (tag) query.tags = tag;
  const items = await ChessExercise.find(query)
    .populate("lessonId", "title courseId")
    .select(
      "_id lessonId title startFen hintText explanation difficulty tags status createdAt",
    )
    .sort({ createdAt: -1 })
    .limit(300);
  return res.json({ items });
});

const answerToUci = (startFen, answer) => {
  const game = new Chess(startFen);
  const normalized = normalize(answer);
  if (!normalized) return "";
  if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(normalized)) return normalized.toLowerCase();
  const move = game.move(normalized, { sloppy: true });
  if (!move) return "";
  return `${move.from}${move.to}${move.promotion || ""}`.toLowerCase();
};

exports.submitAnswer = asyncHandler(async (req, res) => {
  const exercise = await ChessExercise.findById(req.params.id);
  if (!exercise || exercise.status !== "published") {
    return res.status(404).json({ message: "Exercise không tồn tại hoặc chưa publish" });
  }

  const answer = normalize(req.body.answerSan || req.body.answerUci || req.body.answer);
  if (!answer) return res.status(400).json({ message: "Thiếu đáp án" });

  const answerUci = answerToUci(exercise.startFen, answer);
  const solutionUci =
    normalize(exercise.solutionUci) ||
    answerToUci(exercise.startFen, exercise.solutionSan || "");
  const isCorrect = Boolean(answerUci && solutionUci && answerUci === solutionUci);

  const attempt = await ChessExerciseAttempt.findOneAndUpdate(
    { exerciseId: exercise._id, userId: req.user._id },
    {
      $inc: { attemptCount: 1 },
      $set: {
        lastAnswer: answer,
        isSolved: isCorrect,
        solvedAt: isCorrect ? new Date() : null,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return res.json({
    isCorrect,
    mustRetry: !isCorrect,
    message: isCorrect ? "Chính xác!" : "Sai rồi, vui lòng làm lại.",
    attempt,
  });
});

exports.getHint = asyncHandler(async (req, res) => {
  const exercise = await ChessExercise.findById(req.params.id).select(
    "hintText solutionSan solutionUci startFen",
  );
  if (!exercise) return res.status(404).json({ message: "Exercise không tồn tại" });
  const level = Number(req.body.level || 1);
  const hintText = normalize(exercise.hintText);
  if (hintText) return res.json({ hint: hintText });

  const solutionSan = normalize(exercise.solutionSan);
  if (level <= 1) {
    return res.json({
      hint: solutionSan
        ? `Nước đi bắt đầu bằng: ${solutionSan.charAt(0)}`
        : "Hãy ưu tiên nước kiểm soát trung tâm.",
    });
  }

  const uci =
    normalize(exercise.solutionUci) ||
    answerToUci(exercise.startFen, exercise.solutionSan || "");
  if (uci.length >= 4) {
    return res.json({ hint: `Ô đích của nước đúng là: ${uci.slice(2, 4)}` });
  }
  return res.json({ hint: "Hãy thử tìm một nước phát triển quân và an toàn vua." });
});
