const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

router.use(protect);

router.post("/", authorize("Admin"), notificationController.createNotification);
router.get("/", notificationController.getMyNotifications);
router.patch("/read-all", notificationController.markAllNotificationsRead);
router.get("/:id", notificationController.getNotificationDetail);
router.patch("/:id/read", notificationController.markNotificationRead);

module.exports = router;
