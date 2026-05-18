const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const controller = require("../controllers/chessExerciseController");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  validateImportPayload,
  validatePublishPayload,
} = require("../middleware/chessExerciseValidationMiddleware");

const router = express.Router();

const chessUploadDir = path.join(__dirname, "..", "uploads", "chess");
if (!fs.existsSync(chessUploadDir)) {
  fs.mkdirSync(chessUploadDir, { recursive: true });
}

const ALLOWED_IMPORT_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

const ALLOWED_IMPORT_EXT = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, chessUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".bin";
    cb(null, `chess_import_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const mime = String(file.mimetype || "").toLowerCase();
    if (ALLOWED_IMPORT_MIME.has(mime) || ALLOWED_IMPORT_EXT.has(ext)) {
      return cb(null, true);
    }
    cb(new Error("Định dạng file không được hỗ trợ. Chỉ chấp nhận PDF/PNG/JPG/WEBP/GIF."));
  },
});

router.use(protect);

router.post(
  "/import",
  authorize("Admin", "Teacher"),
  (req, res, next) => upload.single("file")(req, res, next),
  validateImportPayload,
  controller.importExercises,
);
router.patch("/:id", authorize("Admin", "Teacher"), controller.updateExercise);
router.post(
  "/:id/publish",
  authorize("Admin", "Teacher"),
  validatePublishPayload,
  controller.publishExercise,
);
router.get("/library", authorize("Admin", "Teacher"), controller.getExerciseLibrary);
router.get("/public", controller.getPublicExercises);
router.post("/:id/submit", controller.submitAnswer);
router.post("/:id/hint", controller.getHint);

module.exports = router;
