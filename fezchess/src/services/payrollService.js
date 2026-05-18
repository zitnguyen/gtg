import axiosClient from "../api/axiosClient";

const getFilenameFromDisposition = (disposition, fallback) => {
  if (!disposition) return fallback;
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      return fallback;
    }
  }
  const plain = disposition.match(/filename="([^"]+)"/i);
  if (plain?.[1]) return plain[1];
  return fallback;
};

const payrollService = {
  createTeacherSession: async (payload) => {
    return axiosClient.post("/teacher/sessions", payload);
  },
  getTeacherSessions: async () => {
    return axiosClient.get("/teacher/sessions");
  },
  getAdminPayroll: async () => {
    return axiosClient.get("/admin/payroll");
  },
  getAdminPayrollByTeacher: async (teacherId) => {
    return axiosClient.get(`/admin/payroll/${teacherId}`);
  },
  createAdminSession: async (payload) => {
    return axiosClient.post("/admin/payroll/session", payload);
  },
  importPayrollExcel: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosClient.post("/admin/payroll/import-excel", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  downloadPayrollImportTemplate: async () => {
    const response = await axiosClient.get("/admin/payroll/import-template", {
      responseType: "blob",
    });
    const contentType =
      response?.headers?.["content-type"] ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const blob = new Blob([response.data], { type: contentType });
    const disposition = response?.headers?.["content-disposition"] || "";
    const filename = getFilenameFromDisposition(
      disposition,
      "Payroll_Import_Template.xlsx",
    );
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  deleteSession: async (sessionId) => {
    return axiosClient.delete(`/admin/payroll/session/${sessionId}`);
  },
  updateSessionSalary: async (sessionId, salary) => {
    return axiosClient.patch(`/admin/payroll/session/${sessionId}/salary`, { salary });
  },
  updateSessionCompensation: async (sessionId, payload) => {
    return axiosClient.patch(`/admin/payroll/session/${sessionId}/compensation`, payload);
  },
  resetSessionSalary: async (sessionId) => {
    return axiosClient.delete(`/admin/payroll/session/${sessionId}/salary`);
  },
  getPayrollSummary: async () => {
    return axiosClient.get("/admin/payroll/summary");
  },
  exportPayslip: async ({ teacherId, month, year, type = "excel", fallback = "payslip" }) => {
    const response = await axiosClient.get("/admin/payroll/payslip", {
      params: { teacherId, month, year, type },
      responseType: "blob",
    });
    const contentType = response?.headers?.["content-type"] || "application/octet-stream";
    const blob = new Blob([response.data], { type: contentType });
    const ext = type === "pdf" ? "pdf" : "xlsx";
    const disposition = response?.headers?.["content-disposition"] || "";
    const filename = getFilenameFromDisposition(disposition, `${fallback}.${ext}`);

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default payrollService;
