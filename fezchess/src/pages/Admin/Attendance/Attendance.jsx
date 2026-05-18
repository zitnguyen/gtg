import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Save,
  CheckCircle,
  XCircle,
  Loader2,
  BookOpen,
} from "lucide-react";
import classService from "../../../services/classService";
import attendanceService from "../../../services/attendanceService";
import { toast } from "sonner";

const Attendance = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await classService.getAll();
        setClasses(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!selectedClassId) {
        setRows([]);
        return;
      }
      setLoading(true);
      try {
        const selectedClass = await classService.getById(selectedClassId);
        const list = Array.isArray(selectedClass?.studentIds)
          ? selectedClass.studentIds
          : [];

        const attendance = await attendanceService.getByClassAndDate(
          selectedClassId,
          selectedDate,
        );
        const attList = Array.isArray(attendance) ? attendance : [];

        const activeDay = new Date(selectedDate).getDay();
        const classSlots = Array.isArray(selectedClass?.scheduleSlots)
          ? selectedClass.scheduleSlots
          : [];
        const canMark = classSlots.some((slot) => Number(slot?.day) === activeDay);

        const merged = list.map((student) => {
          const sid = student?._id || student;
          const rec = attList.find(
            (a) => String(a.studentId?._id || a.studentId) === String(sid),
          );
          return {
            studentMongoId: String(sid),
            name: student?.fullName || "Học viên",
            code: student?.studentId || "",
            status: rec?.status || "absent",
            note: rec?.note || "",
            recordId: rec?._id || null,
            canMark,
          };
        });
        setRows(merged);
      } catch (e) {
        console.error(e);
        toast.error("Không tải được danh sách học viên / điểm danh.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedClassId, selectedDate]);

  const stats = useMemo(() => {
    const present = rows.filter((r) => r.status === "present").length;
    const absent = rows.filter((r) => r.status === "absent").length;
    return { present, absent, total: rows.length };
  }, [rows]);

  const handleStatusChange = (studentMongoId, newStatus) => {
    setRows((prev) =>
      prev.map((r) =>
        r.studentMongoId === studentMongoId ? { ...r, status: newStatus } : r,
      ),
    );
  };

  const handleNoteChange = (studentMongoId, note) => {
    setRows((prev) =>
      prev.map((r) =>
        r.studentMongoId === studentMongoId ? { ...r, note } : r,
      ),
    );
  };

  const handleSave = async () => {
    if (!selectedClassId) return;
    setSaving(true);
    try {
      await Promise.all(
        rows
          .filter((r) => r.canMark)
          .map((r) =>
            attendanceService.mark({
              classId: selectedClassId,
              studentId: r.studentMongoId,
              date: selectedDate,
              status: r.status,
              note: r.note,
            }),
          ),
      );
      toast.success("Đã lưu điểm danh thành công!");
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Lỗi khi lưu điểm danh.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Điểm danh</h1>
          <p className="text-sm text-gray-500 mt-1">
            Chọn lớp + ngày, điểm danh theo danh sách học viên trong lớp.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <BookOpen className="text-primary shrink-0" size={18} />
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full min-w-0 sm:min-w-[200px]"
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
          </div>
          <div className="relative w-full sm:w-auto">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm"
            />
            <Calendar
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !selectedClassId || rows.length === 0}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed font-medium"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            <span>{saving ? "Đang lưu..." : "Lưu điểm danh"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">Tổng học viên</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {stats.total}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">Có mặt</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {stats.present}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500">Vắng</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {stats.absent}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Loader2 className="animate-spin mb-3 text-primary" size={32} />
            <span>Đang tải...</span>
          </div>
        ) : !selectedClassId ? (
          <div className="py-16 text-center text-gray-500">
            Vui lòng chọn lớp học.
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            Lớp chưa có học viên.
          </div>
        ) : (
          <>
          <div className="md:hidden divide-y divide-gray-100">
            {rows.map((r, index) => (
              <div key={`m-${r.studentMongoId}`} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">{r.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">#{index + 1} • Mã: {r.code || "—"}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${r.status === "present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {r.status === "present" ? "Có mặt" : "Vắng"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!r.canMark}
                    onClick={() => handleStatusChange(r.studentMongoId, "present")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                      r.status === "present"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-white border-gray-200 text-gray-600"
                    } ${!r.canMark ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Có mặt
                  </button>
                  <button
                    type="button"
                    disabled={!r.canMark}
                    onClick={() => handleStatusChange(r.studentMongoId, "absent")}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                      r.status === "absent"
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-white border-gray-200 text-gray-600"
                    } ${!r.canMark ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Vắng
                  </button>
                </div>
                <input
                  type="text"
                  value={r.note}
                  disabled={!r.canMark}
                  onChange={(e) => handleNoteChange(r.studentMongoId, e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border border-gray-200 text-sm ${!r.canMark ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
                  placeholder={r.canMark ? "Ghi chú..." : "Không có lịch học trong ngày"}
                />
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    STT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Học viên
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {rows.map((r, index) => (
                  <tr key={r.studentMongoId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{r.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Mã: {r.code || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                          <button
                            type="button"
                            disabled={!r.canMark}
                            onClick={() =>
                              handleStatusChange(r.studentMongoId, "present")
                            }
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                              r.status === "present"
                                ? "bg-white text-green-600 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500"
                            } ${!r.canMark ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <CheckCircle size={16} className="inline mr-1" />
                            Có mặt
                          </button>
                          <button
                            type="button"
                            disabled={!r.canMark}
                            onClick={() =>
                              handleStatusChange(r.studentMongoId, "absent")
                            }
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                              r.status === "absent"
                                ? "bg-white text-red-600 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500"
                            } ${!r.canMark ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <XCircle size={16} className="inline mr-1" />
                            Vắng
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={r.note}
                        disabled={!r.canMark}
                        onChange={(e) =>
                          handleNoteChange(r.studentMongoId, e.target.value)
                        }
                        className={`w-full px-4 py-2 rounded-lg border border-gray-200 text-sm ${!r.canMark ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
                        placeholder={
                          r.canMark ? "Ghi chú..." : "Không có lịch học trong ngày"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Attendance;
