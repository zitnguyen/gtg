const express = require("express");
const router = express.Router();
const enrollmentController = require("../controllers/enrollmentController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validateObjectIdParam } = require("../middleware/paramValidationMiddleware");

router.post(
  "/",
  protect,
  authorize("Admin", "Teacher"),
  enrollmentController.enrollStudent,
);
router.post(
  "/withdraw",
  protect,
  authorize("Admin", "Teacher"),
  enrollmentController.withdrawStudent,
);

router.get(
  "/class/:classId",
  protect,
  authorize("Admin", "Teacher"),
  validateObjectIdParam("classId"),
  enrollmentController.getEnrollmentsByClass,
);
router.get(
  "/student/:studentId",
  protect,
  authorize("Admin", "Teacher", "Parent", "Student"),
  validateObjectIdParam("studentId"),
  enrollmentController.getStudentEnrollments,
);

router.get(
  "/",
  protect,
  authorize("Admin", "Teacher"),
  enrollmentController.listEnrollments,
);
router.get(
  "/:id",
  protect,
  authorize("Admin", "Teacher"),
  validateObjectIdParam("id"),
  enrollmentController.getEnrollmentById,
);
router.put(
  "/:id",
  protect,
  authorize("Admin", "Teacher"),
  validateObjectIdParam("id"),
  enrollmentController.updateEnrollment,
);
router.delete(
  "/:id",
  protect,
  authorize("Admin", "Teacher"),
  validateObjectIdParam("id"),
  enrollmentController.deleteEnrollment,
);

module.exports = router;
