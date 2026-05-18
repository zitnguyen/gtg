/**
 * Task: Routes ván cờ live — bắt buộc đăng nhập
 * Tác giả: DucManh-BlueOC
 */
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const liveGameController = require("../controllers/liveGameController");

router.post("/", protect, liveGameController.createGame);
router.get("/:code", protect, liveGameController.getByCode);
router.post("/:code/join", protect, liveGameController.joinByCode);
router.post("/:code/resign", protect, liveGameController.resign);

module.exports = router;
