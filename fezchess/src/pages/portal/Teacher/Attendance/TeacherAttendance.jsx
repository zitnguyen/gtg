import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import attendanceService from "../../../../services/attendanceService";
import classService from "../../../../services/classService";
import { toast } from "sonner";
import authService from "../../../../services/authService";

const TeacherAttendance = () => {
  const user = authService.getCurrentUser();
  const teacherId = user?._id || user?.userId;
  const [params] = useSearchParams();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(params.get("classId") || "");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasScheduleOnDate = (classSlots, dateValue) => {
    if (!Array.isArray(classSlots) || classSlots.length === 0) {
      return false;
    }
    const targetDay = new Date(dateValue).getDay(); // 0..6
    return classSlots.some(
      (slot) => Number(slot?.day) === Number(targetDay),
    );
  };

  useEffect(() => {
    const loadClasses = async () => {
      try {
        if (!teacherId) return;
        const data = await classService.getByTeacher(teacherId);
        setClasses(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load classes", error);
        toast.error(
          error?.response?.data?.message || "Không tải được danh sách lớp",
        );
      }
    };
    loadClasses();
  }, [teacherId]);

  useEffect(() => {
    const loadRows = async () => {
      if (!selectedClassId) {
        setRows([]);
        return;
      }
      try {
        setLoading(true);
        const [selectedClass, attendance] = await Promise.all([
          classService.getById(selectedClassId),
          attendanceService.getByClassAndDate(selectedClassId, selectedDate),
        ]);
        const students = Array.isArray(selectedClass?.studentIds)
          ? selectedClass.studentIds
          : [];
        const att = Array.isArray(attendance) ? attendance : [];
        const classSlots = Array.isArray(selectedClass?.scheduleSlots)
          ? selectedClass.scheduleSlots
          : [];

        const merged = students.map((student) => {
          const sid = String(student?._id || student);
          const rec = att.find((a) => String(a.studentId?._id || a.studentId) === sid);
          const hasScheduleToday = hasScheduleOnDate(classSlots, selectedDate);
          return {
            studentId: sid,
            name: student?.fullName || "Học viên",
            code: student?.studentId || "",
            status: rec?.status || "absent",
            note: rec?.note || "",
            hasScheduleToday,
          };
        });
        setRows(merged);
      } catch (error) {
        console.error("Failed to load attendance rows", error);
        toast.error(
          error?.response?.data?.message ||
            "Không tải được điểm danh. Vui lòng thử lại.",
        );
      } finally {
        setLoading(false);
      }
    };
    loadRows();
  }, [selectedClassId, selectedDate]);

  const stats = useMemo(() => {
    const schedulableRows = rows.filter((r) => r.hasScheduleToday);
    const present = schedulableRows.filter((r) => r.status === "present").length;
    return {
      present,
      absent: schedulableRows.length - present,
      total: schedulableRows.length,
    };
  }, [rows]);

  const saveAttendance = async () => {
    try {
      setSaving(true);
      await Promise.all(
        rows
          .filter((r) => r.hasScheduleToday)
          .map((r) =>
          attendanceService.mark({
            classId: selectedClassId,
            studentId: r.studentId,
            date: selectedDate,
            status: r.status,
            note: r.note,
          }),
        ),
      );
      toast.success("Đã lưu điểm danh");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Lưu điểm danh thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Điểm danh lớp học</h1>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="border rounded px-3 py-2"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
        >
          <option value="">-- Chọn lớp --</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.className}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="border rounded px-3 py-2"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          onClick={saveAttendance}
          disabled={
            saving ||
            !selectedClassId ||
            rows.filter((r) => r.hasScheduleToday).length === 0
          }
        >
          {saving ? "Đang lưu..." : "Lưu điểm danh"}
        </button>
      </div>

      <div className="text-sm text-gray-600">
        Tổng: {stats.total} | Có mặt: {stats.present} | Vắng: {stats.absent}
      </div>

      <div className="bg-white border rounded overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-500">Đang tải danh sách...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Học viên</th>
                <th className="text-left px-4 py-2">Mã</th>
                <th className="text-left px-4 py-2">Trạng thái</th>
                <th className="text-left px-4 py-2">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.studentId} className="border-t">
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2">{r.code || "N/A"}</td>
                  <td className="px-4 py-2">
                    {r.hasScheduleToday ? (
                      <select
                        className="border rounded px-2 py-1"
                        value={r.status}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x.studentId === r.studentId
                                ? { ...x, status: e.target.value }
                                : x,
                            ),
                          )
                        }
                      >
                        <option value="present">Có mặt</option>
                        <option value="absent">Vắng</option>
                      </select>
                    ) : (
                      <span className="text-gray-400 text-xs font-medium">
                        Không có lịch học hôm nay
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      className="border rounded px-2 py-1 w-full disabled:bg-gray-50 disabled:text-gray-400"
                      value={r.note}
                      disabled={!r.hasScheduleToday}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((x) =>
                            x.studentId === r.studentId ? { ...x, note: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-gray-500" colSpan={4}>
                    Chưa có dữ liệu điểm danh.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TeacherAttendance;
