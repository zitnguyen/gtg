const express = require("express");
const multer = require("multer");
const { protect, authorize } = require("../middleware/authMiddleware");
const controller = require("../controllers/adminPuzzleController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.use(protect);
router.use(authorize("Admin", "Teacher"));

router.post("/upload-pdf", upload.single("file"), controller.uploadPdfAndSave);
router.post("/puzzle/preview", upload.single("file"), controller.previewPuzzleFromPdf);
router.post("/puzzle/preview-jobs", upload.single("file"), controller.createPreviewJob);
router.get("/puzzle/preview-jobs/:jobId", controller.getPreviewJob);
router.post("/puzzle/confirm", controller.confirmPuzzleFromPreview);
router.post("/assign", controller.assignPuzzles);
router.get("/puzzles", controller.listPuzzles);

module.exports = router;
