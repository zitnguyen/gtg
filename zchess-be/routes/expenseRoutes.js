const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const { protect, authorize } = require("../middleware/authMiddleware");

// CRUD routes — :id là `expenseId` (số)
router.get("/", protect, authorize("Admin"), expenseController.getAllExpenses);
router.get("/:id", protect, authorize("Admin"), expenseController.getExpenseById);
router.post("/", protect, authorize("Admin"), expenseController.createExpense);
router.put("/:id", protect, authorize("Admin"), expenseController.updateExpense);
router.delete("/:id", protect, authorize("Admin"), expenseController.deleteExpense);

module.exports = router;
