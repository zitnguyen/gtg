const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const controller = require("../controllers/studentPuzzleController");

const router = express.Router();
router.use(protect);
router.use(authorize("Parent", "Student"));

router.get("/assignments/today", controller.getTodayAssignments);
router.post("/attempt/:puzzleId/move", controller.submitMove);

module.exports = router;
