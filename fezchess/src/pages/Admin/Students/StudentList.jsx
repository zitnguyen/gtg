import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Edit, Eye, Plus, RotateCcw, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  TableSkeleton,
} from "../../../components/ui";
import studentService from "../../../services/studentService";
import authService from "../../../services/authService";
import useUndoDelete from "../../../hooks/useUndoDelete";
import formMetadataService from "../../../services/formMetadataService";
import DynamicFormFields from "../../../components/forms/DynamicFormFields";

const normalizeRole = (role) => String(role || "").trim().toLowerCase();
const isAdminUser = (user) => normalizeRole(user?.role) === "admin";
const FALLBACK_FILTER_FIELDS = [
  {
    name: "keyword",
    label: "Từ khóa",
    type: "text",
    required: false,
    placeholder: "Tìm theo tên học viên hoặc phụ huynh",
  },
  {
    name: "status",
    label: "Trạng thái",
    type: "select",
    required: false,
    options: [
      { value: "all", label: "Tất cả trạng thái" },
      { value: "active", label: "Đang học" },
      { value: "inactive", label: "Không hoạt động" },
      { value: "completed", label: "Hoàn thành" },
      { value: "archived", label: "Đã lưu trữ" },
    ],
  },
];

const getStudentStatus = (student) => {
  if (student?.isDeleted || student?.lifecycleStatus === "archived") {
    return { value: "archived", label: "Đã lưu trữ", tone: "neutral" };
  }
  if (student?.lifecycleStatus === "inactive") {
    return { value: "inactive", label: "Không hoạt động", tone: "warning" };
  }
  const total = Number(student?.totalLessons ?? student?.totalSessions ?? 0);
  const completed = Number(student?.completedLessons ?? 0);
  if (total > 0 && completed >= total) {
    return { value: "completed", label: "Hoàn thành", tone: "success" };
  }
  return { value: "active", label: "Đang học", tone: "info" };
};

const getStudentProgress = (student) => {
  const studied = Number(student?.completedLessons ?? 0);
  const total = Number(student?.totalLessons ?? student?.totalSessions ?? 0);
  return {
    studied: Number.isFinite(studied) ? studied : 0,
    total: Number.isFinite(total) ? total : 0,
  };
};

const StudentList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();
  const isAdmin = isAdminUser(currentUser);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterConfig, setFilterConfig] = useState([]);
  const [filters, setFilters] = useState({ keyword: "", status: "all" });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [highlightedRowId, setHighlightedRowId] = useState(null);
  const { scheduleUndoDelete } = useUndoDelete();
  const lastToastKeyRef = useRef("");

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        const [data, metadata] = await Promise.all([
          studentService.getAll({ includeDeleted: true }),
          formMetadataService.getFormConfig("student", "filter"),
        ]);
        if (!mounted) return;
        setStudents(Array.isArray(data) ? data : []);
        setFilterConfig(
          Array.isArray(metadata?.fields) && metadata.fields.length > 0
            ? metadata.fields
            : FALLBACK_FILTER_FIELDS,
        );
      } catch (error) {
        if (!mounted) return;
        setFilterConfig(FALLBACK_FILTER_FIELDS);
        toast.error(error?.response?.data?.message || "Không tải được danh sách học viên");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    const updatedId = location.state?.updatedStudentId || location.state?.updatedStudent?._id;
    if (!updatedId) return;
    const toastKey = `student-updated-${updatedId}-${location.state?.updatedAt || ""}`;
    if (lastToastKeyRef.current === toastKey) return;
    lastToastKeyRef.current = toastKey;
    setHighlightedRowId(updatedId);
    toast.success("✔ Cập nhật thành công", { id: toastKey });
    navigate(location.pathname, { replace: true, state: {} });
    const timeout = setTimeout(() => setHighlightedRowId(null), 2000);
    return () => clearTimeout(timeout);
  }, [location.state?.updatedAt, location.state?.updatedStudentId, location.state?.updatedStudent?._id, location.pathname, navigate]);

  useEffect(() => {
    if (location.state?.createdAt) {
      const toastKey = `student-created-${location.state.createdAt}`;
      if (lastToastKeyRef.current === toastKey) return;
      lastToastKeyRef.current = toastKey;
      toast.success("✔ Tạo thành công", { id: toastKey });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.createdAt, location.pathname, navigate]);

  const filteredStudents = useMemo(() => {
      const term = String(filters.keyword || "")
        .trim()
        .toLowerCase();
    return students.filter((student) => {
      const status = getStudentStatus(student).value;
        if (filters.status !== "all" && status !== filters.status) return false;
      if (!term) return true;
      return (
        String(student?.fullName || "").toLowerCase().includes(term) ||
        String(student?.parentId?.fullName || "").toLowerCase().includes(term)
      );
    });
  }, [students, filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDelete = (studentId) => {
    const deletingStudent = students.find((item) => item._id === studentId);
    if (!deletingStudent) return;
    setDeleteConfirmId(null);
    scheduleUndoDelete({
      id: studentId,
      item: deletingStudent,
      removeOptimistic: () =>
        setStudents((prev) => prev.filter((item) => item._id !== studentId)),
      restoreOptimistic: (item) => setStudents((prev) => [item, ...prev]),
      commitDelete: () => studentService.delete(studentId),
      successMessage: "✔ Xóa thành công",
      pendingMessage: "Đã xóa học viên - Hoàn tác?",
      errorMessage: "❌ Xóa thất bại",
    });
  };

  const handleRestore = async (studentId) => {
    try {
      const restored = await studentService.restore(studentId);
      setStudents((prev) =>
        prev.map((item) => (item._id === studentId ? { ...item, ...restored } : item)),
      );
      toast.success("Đã khôi phục học viên");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể khôi phục học viên");
    }
  };

  const studentToDelete = useMemo(
    () => students.find((item) => item._id === deleteConfirmId),
    [students, deleteConfirmId],
  );

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          403 — Bạn không có quyền truy cập chức năng quản lý học viên.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý học viên"
        description="Danh sách và thao tác CRUD học viên dành cho Admin."
        meta={
          loading ? null : (
            <Badge tone="neutral" size="sm">
              {students.length} học viên
            </Badge>
          )
        }
        actions={
          <Button
            onClick={() => navigate("/admin/students/create")}
            leftIcon={<Plus size={16} />}
          >
            Tạo học viên
          </Button>
        }
      />

      <Card padded={false} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DynamicFormFields
            fields={filterConfig}
            values={filters}
            errors={{}}
            onChange={handleFilterChange}
          />
        </div>
      </Card>

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Họ tên
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ngày sinh
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  SĐT
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Phụ huynh
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tiến độ
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Trạng thái
                </th>
                <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {loading ? (
                <TableSkeleton rows={6} cols={7} />
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      icon={<Users className="w-7 h-7" />}
                      title="Không có học viên phù hợp"
                      description="Thử bỏ lọc, hoặc tạo học viên mới để bắt đầu."
                      action={
                        <Button
                          leftIcon={<Plus size={16} />}
                          onClick={() => navigate("/admin/students/create")}
                        >
                          Tạo học viên
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const status = getStudentStatus(student);
                  const progress = getStudentProgress(student);
                  return (
                    <tr
                      key={student._id}
                      className={`transition-colors ${
                        highlightedRowId === student._id
                          ? "bg-emerald-50/70"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <td className="px-6 py-3.5 text-sm font-medium text-foreground">
                        {student.fullName || "N/A"}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">
                        {student.dateOfBirth
                          ? new Date(student.dateOfBirth).toLocaleDateString("vi-VN")
                          : "-"}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">
                        {student.parentId?.phone || "-"}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">
                        {student.parentId?.fullName || "-"}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-foreground/90 tabular-nums">
                        <span className="font-semibold">{progress.studied}</span>
                        <span className="text-muted-foreground"> / {progress.total} buổi</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge tone={status.tone} size="sm" dot>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex justify-end items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => navigate(`/admin/students/${student._id}`)}
                            aria-label="Chi tiết"
                            title="Chi tiết"
                          >
                            <Eye size={16} />
                          </Button>
                          {student.isDeleted ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleRestore(student._id)}
                              aria-label="Khôi phục"
                              title="Khôi phục"
                              className="text-emerald-600 hover:bg-emerald-50"
                            >
                              <RotateCcw size={16} />
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => navigate(`/admin/students/${student._id}/edit`)}
                                aria-label="Sửa"
                                title="Sửa"
                                className="text-blue-600 hover:bg-blue-50"
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setDeleteConfirmId(student._id)}
                                aria-label="Xoá"
                                title="Xoá"
                                className="text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteConfirmId)}
        onOpenChange={(next) => {
          if (!next) setDeleteConfirmId(null);
        }}
        title="Xoá học viên?"
        description={
          studentToDelete
            ? `Bạn sắp xoá "${studentToDelete.fullName || "học viên"}". Có thể hoàn tác trong vài giây.`
            : "Hành động này có thể hoàn tác."
        }
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        destructive
        onConfirm={() => handleDelete(deleteConfirmId)}
      />
    </div>
  );
};

export default StudentList;
