const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const payrollController = require("../controllers/payrollController");
const multer = require("multer");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(protect);
router.use(authorize("Admin"));

router.get("/payroll/summary", payrollController.getPayrollSummary);
router.get("/payroll/payslip", payrollController.exportPayslip);
router.get(
  "/payroll/import-template",
  payrollController.downloadPayrollImportTemplate,
);
router.get("/payroll/:teacherId", payrollController.getAdminPayrollByTeacher);
router.get("/payroll", payrollController.getAdminPayroll);
router.post("/payroll/session", payrollController.createAdminSession);
router.post(
  "/payroll/import-excel",
  upload.single("file"),
  payrollController.importPayrollExcel,
);
router.patch(
  "/payroll/session/:id/compensation",
  payrollController.updateSessionCompensation,
);
router.patch("/payroll/session/:id/salary", payrollController.updateSessionSalary);
router.delete("/payroll/session/:id/salary", payrollController.resetSessionSalary);
router.delete("/payroll/session/:id", payrollController.deleteSession);

module.exports = router;
