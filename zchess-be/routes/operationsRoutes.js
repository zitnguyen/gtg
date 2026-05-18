const express = require("express");
const router = express.Router();
const controller = require("../controllers/operationsController");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  validateObjectIdParam,
} = require("../middleware/paramValidationMiddleware");

router.use(protect);

// --- Enrollment transfer ---
router.post(
  "/enrollments/:id/transfer",
  authorize("Admin", "Teacher"),
  validateObjectIdParam("id"),
  controller.transferEnrollmentHandler,
);

// --- Class lifecycle ---
router.get(
  "/classes/:id/events",
  authorize("Admin", "Teacher"),
  validateObjectIdParam("id"),
  controller.listClassEvents,
);
router.post(
  "/classes/:id/cancel-session",
  authorize("Admin", "Teacher"),
  validateObjectIdParam("id"),
  controller.cancelClassSession,
);
router.post(
  "/classes/:id/makeup-session",
  authorize("Admin", "Teacher"),
  validateObjectIdParam("id"),
  controller.scheduleMakeupSession,
);
router.post(
  "/classes/:id/substitute",
  authorize("Admin"),
  validateObjectIdParam("id"),
  controller.assignSubstituteTeacher,
);

// --- Waitlist ---
router.get(
  "/classes/:id/waitlist",
  authorize("Admin", "Teacher"),
  validateObjectIdParam("id"),
  controller.listWaitlistHandler,
);
router.post(
  "/classes/:id/waitlist",
  authorize("Admin", "Teacher", "Parent"),
  validateObjectIdParam("id"),
  controller.joinWaitlistHandler,
);
router.post(
  "/waitlist/:waitlistId/promote",
  authorize("Admin"),
  validateObjectIdParam("waitlistId"),
  controller.promoteWaitlistHandler,
);
router.delete(
  "/waitlist/:waitlistId",
  authorize("Admin", "Parent"),
  validateObjectIdParam("waitlistId"),
  controller.cancelWaitlistHandler,
);

// --- Inactive students ---
router.get(
  "/students/inactive",
  authorize("Admin"),
  controller.listInactiveStudents,
);

module.exports = router;
