/**
 * Express application wiring (split from `server.js`, following zlss layout).
 * DB connection and process listen stay in `server.js`.
 */
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const hpp = require("hpp");
const compression = require("compression");
const mongoSanitize = require("./middleware/mongoSanitizeExpress5");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const chapterRoutes = require("./routes/chapterRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const postRoutes = require("./routes/postRoutes");
const studentRoutes = require("./routes/studentRoutes");
const classRoutes = require("./routes/classRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const parentRoutes = require("./routes/parentRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");
const progressRoutes = require("./routes/progressRoutes");
const progressLessonTemplateRoutes = require("./routes/progressLessonTemplateRoutes");
const financeRoutes = require("./routes/financeRoutes");
const revenueRoutes = require("./routes/revenueRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const assessmentStubRoutes = require("./routes/assessmentStubRoutes");
const teachingLogStubRoutes = require("./routes/teachingLogStubRoutes");
const leadRoutes = require("./routes/leadRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminPayrollRoutes = require("./routes/adminPayrollRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const heroSettingRoutes = require("./routes/heroSettingRoutes");
const lichessRoutes = require("./routes/lichessRoutes");
const chatRoutes = require("./routes/chatRoutes");
const formMetadataRoutes = require("./routes/formMetadataRoutes");
const chessExerciseRoutes = require("./routes/chessExerciseRoutes");
const exerciseAssignmentRoutes = require("./routes/exerciseAssignmentRoutes");
const adminPuzzleRoutes = require("./routes/adminPuzzleRoutes");
const studentPuzzleRoutes = require("./routes/studentPuzzleRoutes");
const operationsRoutes = require("./routes/operationsRoutes");
const liveGameRoutes = require("./routes/liveGameRoutes");
const publicPuzzleRoutes = require("./routes/publicPuzzleRoutes");

const errorHandler = require("./middleware/errorMiddleware");
const { apiLimiter } = require("./middleware/securityMiddleware");
const requestSanitizer = require("./middleware/requestSanitizerMiddleware");
const requestId = require("./middleware/requestIdMiddleware");
const crudSocketMiddleware = require("./middleware/crudSocketMiddleware");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

const buildCorsOrigins = () => {
  const fromEnv = String(process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
  ];
  const clientUrl = (process.env.CLIENT_URL || "").trim();
  const localNetwork =
    process.env.NODE_ENV !== "production" ? ["http://192.168.1.31:5173"] : [];
  return Array.from(
    new Set([...defaults, ...localNetwork, ...fromEnv, clientUrl].filter(Boolean)),
  );
};

app.use(requestId);
app.use(
  cors({
    origin: buildCorsOrigins(),
    credentials: true,
  }),
);

app.use(
  helmet({
    // Allow frontend on another local origin (5173) to render uploaded images.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(compression());
app.use(apiLimiter);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(crudSocketMiddleware);
app.use(mongoSanitize({ replaceWith: "_" }));
app.use(requestSanitizer);
app.use(hpp());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/news", postRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/progress-lesson-templates", progressLessonTemplateRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/revenue", revenueRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/assessments", assessmentStubRoutes);
app.use("/api/teaching-logs", teachingLogStubRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/admin", adminPayrollRoutes);
app.use("/api/admin", adminPuzzleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/hero-settings", heroSettingRoutes);
app.use("/api/lichess", lichessRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/form-metadata", formMetadataRoutes);
app.use("/api/chess-exercises", chessExerciseRoutes);
app.use("/api/exercise-assignments", exerciseAssignmentRoutes);
app.use("/api/student", studentPuzzleRoutes);
app.use("/api/operations", operationsRoutes);
app.use("/api/live-games", liveGameRoutes);
app.use("/api/public/puzzles", publicPuzzleRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    requestId: req.id,
  });
});

app.use(errorHandler);

module.exports = app;
