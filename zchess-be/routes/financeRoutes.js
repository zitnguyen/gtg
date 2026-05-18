const express = require("express");
const router = express.Router();
const financeController = require("../controllers/financeController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.use(authorize("Admin"));

router.get("/stats", financeController.getFinanceStats);
router.get("/chart", financeController.getFinanceChartData);
router.get("/cost-structure", financeController.getCostStructure);
router.get("/transactions", financeController.getTransactions);
router.get("/report", financeController.getFinanceReport);
router.get("/export", financeController.exportFinanceReport);
router.post("/transactions", financeController.createTransaction);
router.put("/transactions/:id", financeController.updateTransaction);
router.delete("/transactions/:id", financeController.deleteTransaction);
router.post("/pay-tuition", financeController.payTuition);
router.get("/tuition-debts", financeController.getTuitionDebts);

module.exports = router;
