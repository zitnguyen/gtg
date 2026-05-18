const express = require("express");
const multer = require("multer");
const { protect, authorize } = require("../middleware/authMiddleware");
const controller = require("../controllers/exerciseAssignmentController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

router.use(protect);

router.post("/", authorize("Admin", "Teacher"), controller.createAssignment);
router.post(
  "/auto-from-pdf",
  authorize("Admin", "Teacher"),
  upload.single("file"),
  controller.autoAssignFromPdf,
);
router.get(
  "/management",
  authorize("Admin", "Teacher"),
  controller.getAssignmentsForManagement,
);
router.get(
  "/my-today",
  authorize("Parent", "Student"),
  controller.getMyDailyAssignments,
);
router.post(
  "/:assignmentId/submit-board",
  authorize("Parent", "Student"),
  controller.submitAssignmentBoard,
);
router.get(
  "/:id/progress",
  authorize("Admin", "Teacher"),
  controller.getAssignmentProgress,
);

module.exports = router;
