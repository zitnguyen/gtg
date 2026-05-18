import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import payrollApiService from "../services/payrollApiService";
import { getTeacherDisplayName } from "../utils/payrollFormatters";

const createInitialSessionForm = (teacherId = "") => ({
  teacherId,
  classId: "",
  date: "",
  startTime: "",
  endTime: "",
  salary: "",
  note: "",
});

const parseBlobErrorMessage = async (error) => {
  if (!(error?.response?.data instanceof Blob)) return "";
  try {
    const text = await error.response.data.text();
    const parsed = JSON.parse(text);
    return parsed?.message || "";
  } catch {
    return "";
  }
};

export const useAdminPayrollController = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [teacherDetail, setTeacherDetail] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSessionId, setSavingSessionId] = useState("");
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [salaryDraft, setSalaryDraft] = useState({});
  const now = useMemo(() => new Date(), []);
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));
  const [exportingType, setExportingType] = useState("");
  const [classes, setClasses] = useState([]);
  const [creatingSession, setCreatingSession] = useState(false);
  const [importingExcel, setImportingExcel] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [sessionForm, setSessionForm] = useState(createInitialSessionForm());

  const loadTeachers = useCallback(async () => {
    const [teacherRows, summaryData] = await Promise.all([
      payrollApiService.getAdminPayroll(),
      payrollApiService.getPayrollSummary(),
    ]);
    const rows = Array.isArray(teacherRows) ? teacherRows : [];
    setTeachers(rows);
    setSummary(summaryData?.summary || null);
    setSelectedTeacherId((prev) => {
      if (prev || rows.length === 0) return prev;
      return rows[0].teacher?._id || "";
    });
  }, []);

  const loadClasses = useCallback(async () => {
    const rows = await payrollApiService.getClasses();
    setClasses(Array.isArray(rows) ? rows : []);
  }, []);

  const loadTeacherDetail = useCallback(async (teacherId) => {
    if (!teacherId) {
      setTeacherDetail(null);
      return;
    }
    const detail = await payrollApiService.getAdminPayrollByTeacher(teacherId);
    setTeacherDetail(detail || null);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadTeachers(), loadClasses()]);
    } catch {
      toast.error("Không thể tải dữ liệu bảng lương.");
    } finally {
      setLoading(false);
    }
  }, [loadClasses, loadTeachers]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    loadTeacherDetail(selectedTeacherId).catch(() => {
      toast.error("Không thể tải chi tiết bảng lương theo giáo viên.");
    });
  }, [loadTeacherDetail, selectedTeacherId]);

  useEffect(() => {
    setBulkEditMode(false);
    setSalaryDraft({});
    setSessionForm((prev) => ({
      ...prev,
      teacherId: prev.teacherId || selectedTeacherId || "",
    }));
  }, [selectedTeacherId]);

  const selectedTeacherName = useMemo(
    () => getTeacherDisplayName(teacherDetail?.teacher),
    [teacherDetail],
  );

  const availableClasses = useMemo(
    () =>
      classes.filter(
        (item) =>
          String(item.teacherId?._id || item.teacherId) ===
          String(sessionForm.teacherId || selectedTeacherId),
      ),
    [classes, sessionForm.teacherId, selectedTeacherId],
  );

  const refreshCurrentPayroll = useCallback(async () => {
    await Promise.all([loadTeacherDetail(selectedTeacherId), loadTeachers()]);
  }, [loadTeacherDetail, loadTeachers, selectedTeacherId]);

  const startBulkEditSalary = useCallback(() => {
    const drafts = {};
    (teacherDetail?.sessions || []).forEach((session) => {
      drafts[session._id] = {
        salary: session.salary ?? "",
        deductionAmount: Number(session.deductionAmount || 0),
        deductionNote: session.deductionNote || "",
      };
    });
    setSalaryDraft(drafts);
    setBulkEditMode(true);
  }, [teacherDetail?.sessions]);

  const cancelBulkEditSalary = useCallback(() => {
    setBulkEditMode(false);
    setSalaryDraft({});
  }, []);

  const updateSalaryDraft = useCallback((sessionId, patch) => {
    setSalaryDraft((prev) => ({
      ...prev,
      [sessionId]: {
        ...(prev[sessionId] || {}),
        ...patch,
      },
    }));
  }, []);

  const saveBulkSalary = useCallback(async () => {
    const sessions = teacherDetail?.sessions || [];
    const changes = sessions.filter((session) => {
      const draft = salaryDraft[session._id] || {};
      const nextSalary = Number(draft.salary);
      const nextDeduction = Number(draft.deductionAmount || 0);
      const nextNote = String(draft.deductionNote || "").trim();
      if (!Number.isFinite(nextSalary) || nextSalary < 0) return false;
      if (!Number.isFinite(nextDeduction) || nextDeduction < 0) return false;
      return (
        Number(session.salary ?? NaN) !== nextSalary ||
        Number(session.deductionAmount || 0) !== nextDeduction ||
        String(session.deductionNote || "").trim() !== nextNote
      );
    });

    if (changes.length === 0) {
      toast.message("Không có thay đổi lương để lưu.");
      setBulkEditMode(false);
      return;
    }

    try {
      setBulkSaving(true);
      await Promise.all(
        changes.map((session) =>
          payrollApiService.updateSessionCompensation(session._id, {
            salary: Number(salaryDraft[session._id]?.salary),
            deductionAmount: Number(
              salaryDraft[session._id]?.deductionAmount || 0,
            ),
            deductionNote: String(
              salaryDraft[session._id]?.deductionNote || "",
            ).trim(),
          }),
        ),
      );
      await refreshCurrentPayroll();
      setBulkEditMode(false);
      setSalaryDraft({});
      toast.success(`Đã cập nhật ${changes.length} ca lương.`);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || "Không thể cập nhật lương hàng loạt.",
      );
    } finally {
      setBulkSaving(false);
    }
  }, [refreshCurrentPayroll, salaryDraft, teacherDetail?.sessions]);

  const resetSalary = useCallback(
    async (sessionId) => {
      try {
        setSavingSessionId(sessionId);
        await payrollApiService.resetSessionSalary(sessionId);
        await refreshCurrentPayroll();
        updateSalaryDraft(sessionId, {
          salary: "",
          deductionAmount: 0,
          deductionNote: "",
        });
        toast.success("Đã đặt lại lương ca dạy.");
      } catch (e) {
        toast.error(e?.response?.data?.message || "Không thể đặt lại lương.");
      } finally {
        setSavingSessionId("");
      }
    },
    [refreshCurrentPayroll, updateSalaryDraft],
  );

  const handleExport = useCallback(
    async (type) => {
      if (!selectedTeacherId) {
        toast.error("Vui lòng chọn giáo viên trước khi xuất phiếu lương.");
        return;
      }
      try {
        setExportingType(type);
        await payrollApiService.exportPayslip({
          teacherId: selectedTeacherId,
          month: filterMonth,
          year: filterYear,
          type,
          fallback: `Payslip_${selectedTeacherName}_${filterMonth}_${filterYear}`,
        });
        toast.success(`Đã xuất phiếu lương ${type.toUpperCase()}.`);
      } catch (e) {
        const blobMessage = await parseBlobErrorMessage(e);
        toast.error(
          blobMessage ||
            e?.response?.data?.message ||
            "Xuất phiếu lương thất bại.",
        );
      } finally {
        setExportingType("");
      }
    },
    [filterMonth, filterYear, selectedTeacherId, selectedTeacherName],
  );

  const handleCreateSession = useCallback(
    async (event) => {
      event.preventDefault();
      try {
        setCreatingSession(true);
        await payrollApiService.createAdminSession({
          teacherId: sessionForm.teacherId || selectedTeacherId,
          classId: sessionForm.classId,
          date: sessionForm.date,
          startTime: sessionForm.startTime,
          endTime: sessionForm.endTime,
          salary: sessionForm.salary === "" ? null : Number(sessionForm.salary),
          note: sessionForm.note,
        });
        setSessionForm(createInitialSessionForm(selectedTeacherId || ""));
        await refreshCurrentPayroll();
        toast.success("Đã thêm ca lương.");
      } catch (e) {
        toast.error(
          e?.response?.data?.message || "Không thể tạo ca bảng lương.",
        );
      } finally {
        setCreatingSession(false);
      }
    },
    [refreshCurrentPayroll, selectedTeacherId, sessionForm],
  );

  const handleDeleteSession = useCallback(
    async (sessionId) => {
      if (!window.confirm("Bạn có chắc muốn xóa ca dạy này?")) return;
      try {
        await payrollApiService.deleteSession(sessionId);
        await refreshCurrentPayroll();
        toast.success("Đã xóa ca dạy.");
      } catch (e) {
        toast.error(e?.response?.data?.message || "Không thể xóa ca dạy.");
      }
    },
    [refreshCurrentPayroll],
  );

  const handleImportExcel = useCallback(async () => {
    if (!excelFile) {
      toast.error("Vui lòng chọn file Excel trước khi import.");
      return;
    }
    try {
      setImportingExcel(true);
      const result = await payrollApiService.importPayrollExcel(excelFile);
      await refreshCurrentPayroll();
      toast.success(result?.message || "Import bảng lương thành công.");
      setExcelFile(null);
    } catch (e) {
      const msg = e?.response?.data?.message || "Import bảng lương thất bại.";
      const details = Array.isArray(e?.response?.data?.errors)
        ? ` ${e.response.data.errors.slice(0, 3).join(" | ")}`
        : "";
      toast.error(`${msg}${details}`);
    } finally {
      setImportingExcel(false);
    }
  }, [excelFile, refreshCurrentPayroll]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      setDownloadingTemplate(true);
      await payrollApiService.downloadPayrollImportTemplate();
      toast.success("Đã tải file mẫu import bảng lương.");
    } catch (e) {
      const blobMessage = await parseBlobErrorMessage(e);
      toast.error(
        blobMessage || e?.response?.data?.message || "Không thể tải file mẫu.",
      );
    } finally {
      setDownloadingTemplate(false);
    }
  }, []);

  return {
    availableClasses,
    bulkEditMode,
    bulkSaving,
    cancelBulkEditSalary,
    classes,
    creatingSession,
    downloadingTemplate,
    excelFile,
    exportingType,
    filterMonth,
    filterYear,
    handleCreateSession,
    handleDeleteSession,
    handleDownloadTemplate,
    handleExport,
    handleImportExcel,
    importingExcel,
    loading,
    resetSalary,
    salaryDraft,
    saveBulkSalary,
    selectedTeacherId,
    selectedTeacherName,
    sessionForm,
    setExcelFile,
    setFilterMonth,
    setFilterYear,
    setSelectedTeacherId,
    setSessionForm,
    setSalaryDraft,
    startBulkEditSalary,
    summary,
    teacherDetail,
    teachers,
    updateSalaryDraft,
    savingSessionId,
  };
};
