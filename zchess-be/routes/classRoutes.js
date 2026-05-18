const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");
const { protect, optionalProtect, authorize } = require("../middleware/authMiddleware");

// Valid Roles: Admin usually manages classes. Teachers might view.
// Public can view "Active" or "Pending" classes for registration? Let's assume Public View for now.

// Public
router.get("/", optionalProtect, classController.getAllClasses);
router.get(
  "/teacher/:teacherId",
  protect,
  authorize("Admin", "Teacher"),
  classController.getClassesByTeacher,
);
router.get("/:id", optionalProtect, classController.getClassById);

// Admin Only
router.post("/", protect, authorize("Admin"), classController.createClass);
router.put("/:id", protect, authorize("Admin"), classController.updateClass);
router.post(
  "/:id/students",
  protect,
  authorize("Admin"),
  classController.addStudentToClass,
);
router.delete(
  "/:id/students/:studentId",
  protect,
  authorize("Admin"),
  classController.removeStudentFromClass,
);
router.delete("/:id", protect, authorize("Admin"), classController.deleteClass);

module.exports = router;
