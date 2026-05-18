const express = require("express");
const router = express.Router();
const revenueController = require("../controllers/revenueController");
const { protect, authorize } = require("../middleware/authMiddleware");

// CRUD routes — :id là `revenueId` (số), không phải ObjectId Mongo
router.get("/", protect, authorize("Admin"), revenueController.getAllRevenues);
router.get("/:id", protect, authorize("Admin"), revenueController.getRevenueById);
router.post("/", protect, authorize("Admin"), revenueController.createRevenue);
router.put("/:id", protect, authorize("Admin"), revenueController.updateRevenue);
router.delete("/:id", protect, authorize("Admin"), revenueController.deleteRevenue);

module.exports = router;
