import payrollService from "../../../services/payrollService";
import classService from "../../../services/classService";

const payrollApiService = {
  getAdminPayroll: () => payrollService.getAdminPayroll(),
  getPayrollSummary: () => payrollService.getPayrollSummary(),
  getAdminPayrollByTeacher: (teacherId) =>
    payrollService.getAdminPayrollByTeacher(teacherId),
  getClasses: () => classService.getAll(),
  createAdminSession: (payload) => payrollService.createAdminSession(payload),
  updateSessionCompensation: (sessionId, payload) =>
    payrollService.updateSessionCompensation(sessionId, payload),
  resetSessionSalary: (sessionId) => payrollService.resetSessionSalary(sessionId),
  deleteSession: (sessionId) => payrollService.deleteSession(sessionId),
  exportPayslip: (payload) => payrollService.exportPayslip(payload),
  importPayrollExcel: (file) => payrollService.importPayrollExcel(file),
  downloadPayrollImportTemplate: () =>
    payrollService.downloadPayrollImportTemplate(),
};

export default payrollApiService;
