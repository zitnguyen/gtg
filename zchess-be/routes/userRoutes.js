const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public routes
router.get("/me", protect, userController.getMe);
router.patch("/me", protect, userController.updateMe);
router.post("/me/change-password", protect, userController.changeMyPassword);
router.get("/teachers", userController.getTeachers); // Get all teachers
router.get("/teachers/:id", userController.getTeacherById); // Get teacher detail (public)

// Admin routes (quản lý người dùng)
router.post("/", protect, authorize("Admin"), userController.createUser); // Admin tạo user
router.get("/online", protect, authorize("Admin"), userController.getOnlineUsers);
router.get("/activity-status", protect, authorize("Admin"), userController.getUserActivityStatuses);
router.get("/", protect, authorize("Admin"), userController.getAllUsers);
router.get("/:id", protect, authorize("Admin"), userController.getUserById);
router.put("/:id", protect, authorize("Admin"), userController.updateUser);
router.patch("/:id", protect, authorize("Admin"), userController.updateUser);
router.delete("/:id", protect, authorize("Admin"), userController.deleteUser);

module.exports = router;
