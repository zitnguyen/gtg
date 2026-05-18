const Lesson = require("../models/Lesson");
const Chapter = require("../models/Chapter");
const Student = require("../models/Student");
const CourseAccess = require("../models/CourseAccess");
const LessonChessProgress = require("../models/LessonChessProgress");
const asyncHandler = require("../middleware/asyncHandler");

exports.createLesson = asyncHandler(async (req, res) => {
  const { title, chapterId, type, content, duration, isFree, order } =
    req.body;
  const initialMoves = Array.isArray(req.body?.initialMoves)
    ? req.body.initialMoves.map((m) => String(m || "").trim()).filter(Boolean)
    : [];
  const rawMoveNotes = Array.isArray(req.body?.initialMoveNotes)
    ? req.body.initialMoveNotes.map((n) => String(n || "").trim())
    : [];
  const initialMoveNotes = initialMoves.map((_, index) => rawMoveNotes[index] || "");

  const chapter = await Chapter.findById(chapterId);
  if (!chapter) {
    return res.status(404).json({ message: "Chương không tồn tại" });
  }

  const lesson = await Lesson.create({
    title,
    chapterId,
    courseId: chapter.courseId,
    type,
    content: type === "chess" ? "" : content,
    chessMode: type === "chess" ? "internal" : req.body?.chessMode,
    chessPlatform: type === "chess" ? "internal-board" : req.body?.chessPlatform,
    initialFen: req.body?.initialFen,
    initialPgn: type === "chess" ? String(req.body?.initialPgn || "") : "",
    initialMoves: type === "chess" ? initialMoves : [],
    initialMoveNotes: type === "chess" ? initialMoveNotes : [],
    chessBackgroundUrl: type === "chess" ? String(req.body?.chessBackgroundUrl || "") : "",
    exerciseMode: type === "chess" ? Boolean(req.body?.exerciseMode) : false,
    duration,
    isFree,
    order,
  });

  res.status(201).json(lesson);
});

exports.updateLesson = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  payload.initialMoves = Array.isArray(payload?.initialMoves)
    ? payload.initialMoves.map((m) => String(m || "").trim()).filter(Boolean)
    : [];
  payload.initialMoveNotes = Array.isArray(payload?.initialMoveNotes)
    ? payload.initialMoveNotes.map((n) => String(n || "").trim())
    : [];
  payload.initialMoveNotes = payload.initialMoves.map(
    (_, index) => payload.initialMoveNotes[index] || "",
  );
  if (payload?.initialPgn != null) {
    payload.initialPgn = String(payload.initialPgn || "");
  }
  if (payload?.type === "chess") {
    payload.content = "";
    payload.chessMode = "internal";
    payload.chessPlatform = "internal-board";
    payload.chessBackgroundUrl = String(payload?.chessBackgroundUrl || "");
    payload.exerciseMode = Boolean(payload?.exerciseMode);
  } else {
    payload.chessBackgroundUrl = "";
    payload.exerciseMode = false;
  }
  const lesson = await Lesson.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });

  if (!lesson) {
    return res.status(404).json({ message: "Bài học không tồn tại" });
  }

  res.json(lesson);
});

exports.deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findByIdAndDelete(req.params.id);
  if (!lesson) {
    return res.status(404).json({ message: "Bài học không tồn tại" });
  }

  res.json({ message: "Đã xóa bài học" });
});

exports.getLessonById = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) {
    return res.status(404).json({ message: "Bài học không tồn tại" });
  }
  const role = String(req.user?.role || "").toLowerCase();
  if (role === "admin") {
    return res.json(lesson);
  }
  const hasDirectAccess = req.user?._id
    ? Boolean(
        await CourseAccess.exists({ courseId: lesson.courseId, userId: req.user._id }),
      )
    : false;
  const isLinkedParent =
    role === "parent"
      ? Boolean(
          await Student.exists({
            parentId: req.user._id,
            _id: {
              $in: await CourseAccess.find({ courseId: lesson.courseId }).distinct(
                "userId",
              ),
            },
            isDeleted: { $ne: true },
          }),
        )
      : false;
  if (!hasDirectAccess && !isLinkedParent) {
    return res.status(403).json({
      message:
        "Bạn không có quyền xem nội dung bài học. Vui lòng liên hệ Admin để được cấp quyền.",
    });
  }
  res.json(lesson);
});

exports.getMyChessProgress = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) {
    return res.status(404).json({ message: "Bài học không tồn tại" });
  }
  if (lesson.type !== "chess" || lesson.chessMode !== "internal") {
    return res.status(400).json({ message: "Bài học này không dùng bàn cờ nội bộ" });
  }
  const progress = await LessonChessProgress.findOne({
    lessonId: lesson._id,
    userId: req.user._id,
  });
  return res.json(
    progress || {
      lessonId: lesson._id,
      userId: req.user._id,
      fen: lesson.initialFen || "",
      pgn: "",
      moves: [],
    },
  );
});

exports.saveMyChessProgress = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) {
    return res.status(404).json({ message: "Bài học không tồn tại" });
  }
  if (lesson.type !== "chess" || lesson.chessMode !== "internal") {
    return res.status(400).json({ message: "Bài học này không dùng bàn cờ nội bộ" });
  }
  const { fen = "", pgn = "", moves = [] } = req.body || {};
  const progress = await LessonChessProgress.findOneAndUpdate(
    {
      lessonId: lesson._id,
      userId: req.user._id,
    },
    {
      fen: String(fen || ""),
      pgn: String(pgn || ""),
      moves: Array.isArray(moves) ? moves.map((m) => String(m || "")).filter(Boolean) : [],
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return res.json(progress);
});

exports.getNextLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).select("_id courseId");
  if (!lesson) {
    return res.status(404).json({ message: "Bài học không tồn tại" });
  }

  const chapters = await Chapter.find({ courseId: lesson.courseId })
    .select("_id order")
    .sort({ order: 1, _id: 1 })
    .lean();
  if (!chapters.length) {
    return res.json({ nextLesson: null });
  }

  const chapterIds = chapters.map((chapter) => chapter._id);
  const lessons = await Lesson.find({ chapterId: { $in: chapterIds } })
    .select("_id title chapterId order")
    .sort({ order: 1, _id: 1 })
    .lean();

  const chapterOrder = new Map(
    chapters.map((chapter, index) => [String(chapter._id), Number(chapter.order ?? index)]),
  );

  const orderedLessons = lessons
    .slice()
    .sort((a, b) => {
      const chapterDiff =
        (chapterOrder.get(String(a.chapterId)) ?? 0) -
        (chapterOrder.get(String(b.chapterId)) ?? 0);
      if (chapterDiff !== 0) return chapterDiff;
      const lessonDiff = Number(a.order ?? 0) - Number(b.order ?? 0);
      if (lessonDiff !== 0) return lessonDiff;
      return String(a._id).localeCompare(String(b._id));
    });

  const currentIndex = orderedLessons.findIndex(
    (item) => String(item._id) === String(lesson._id),
  );
  if (currentIndex < 0 || currentIndex >= orderedLessons.length - 1) {
    return res.json({ nextLesson: null });
  }

  const next = orderedLessons[currentIndex + 1];
  return res.json({
    nextLesson: next
      ? {
          _id: next._id,
          title: next.title || "Bài học tiếp theo",
        }
      : null,
  });
});

exports.getPrevLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).select("_id courseId");
  if (!lesson) {
    return res.status(404).json({ message: "Bài học không tồn tại" });
  }

  const chapters = await Chapter.find({ courseId: lesson.courseId })
    .select("_id order")
    .sort({ order: 1, _id: 1 })
    .lean();
  if (!chapters.length) {
    return res.json({ prevLesson: null });
  }

  const chapterIds = chapters.map((chapter) => chapter._id);
  const lessons = await Lesson.find({ chapterId: { $in: chapterIds } })
    .select("_id title chapterId order")
    .sort({ order: 1, _id: 1 })
    .lean();

  const chapterOrder = new Map(
    chapters.map((chapter, index) => [String(chapter._id), Number(chapter.order ?? index)]),
  );

  const orderedLessons = lessons
    .slice()
    .sort((a, b) => {
      const chapterDiff =
        (chapterOrder.get(String(a.chapterId)) ?? 0) -
        (chapterOrder.get(String(b.chapterId)) ?? 0);
      if (chapterDiff !== 0) return chapterDiff;
      const lessonDiff = Number(a.order ?? 0) - Number(b.order ?? 0);
      if (lessonDiff !== 0) return lessonDiff;
      return String(a._id).localeCompare(String(b._id));
    });

  const currentIndex = orderedLessons.findIndex(
    (item) => String(item._id) === String(lesson._id),
  );
  if (currentIndex <= 0) {
    return res.json({ prevLesson: null });
  }

  const prev = orderedLessons[currentIndex - 1];
  return res.json({
    prevLesson: prev
      ? {
          _id: prev._id,
          title: prev.title || "Bài học trước",
        }
      : null,
  });
});
