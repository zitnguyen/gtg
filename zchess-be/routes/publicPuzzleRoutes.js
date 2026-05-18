/**
 * Task: Câu đố công khai (proxy Lichess daily) — không cần đăng nhập
 * Tác giả: DucManh-BlueOC
 */
const express = require("express");
const router = express.Router();
const publicPuzzleController = require("../controllers/publicPuzzleController");

router.get("/daily", publicPuzzleController.getDailyPuzzle);

module.exports = router;
