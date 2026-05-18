const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validateObjectIdParam } = require("../middleware/paramValidationMiddleware");

router.use(protect);

/**
 * Portal phụ huynh: chỉ đọc danh sách con (không phải GET / — full list admin-only).
 * Đặt trước block Admin để không bị nuốt bởi GET /:id.
 */
router.get("/my-children", authorize("Parent"), studentController.getMyChildren);
router.get(
  "/leaderboard",
  authorize("Admin", "Teacher", "Parent", "Student"),
  studentController.getLeaderboard,
);

router.get(
  "/parent/:parentId",
  authorize("Admin", "Parent"),
  validateObjectIdParam("parentId"),
  studentController.getStudentsByParentId,
);

/** CRUD học viên: chỉ Admin — GET/POST /, GET/PATCH/PUT/DELETE /:id */
router.use(authorize("Admin"));

router.get("/", studentController.getAllStudents);
router.get("/:id", validateObjectIdParam("id"), studentController.getStudentById);
router.post("/", studentController.createStudent);
router.put("/:id", validateObjectIdParam("id"), studentController.updateStudent);
router.patch("/:id", validateObjectIdParam("id"), studentController.updateStudent);
router.post("/:id/restore", validateObjectIdParam("id"), studentController.restoreStudent);
router.delete("/:id", validateObjectIdParam("id"), studentController.deleteStudent);

module.exports = router;
