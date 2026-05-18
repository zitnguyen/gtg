import React, { useEffect, useState } from "react";
import { Save, ArrowLeft, Download, Trash2 } from "lucide-react";
import LessonContentQuickPicker from "./LessonContentQuickPicker";

const ProgressAssessmentForm = ({
  title = "Chi Tiết Phiếu Học Tập",
  backLabel = "Quay lại danh sách",
  onBack,
  loading = false,
  saving = false,
  sessions = [],
  setSessions,
  teacherFeedback,
  setTeacherFeedback,
  onSave,
  onDelete,
  onExport,
  showDelete = true,
  showExport = true,
  readOnly = false,
  studentName,
  className,
}) => {
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);

  useEffect(() => {
    if (activeSessionIndex >= sessions.length && sessions.length > 0) {
      setActiveSessionIndex(sessions.length - 1);
    }
  }, [sessions.length, activeSessionIndex]);

  const formatSessionDate = (session) => {
    const rawDate = session?.date || session?.attendanceId?.date || null;
    if (!rawDate) return "Chưa có ngày";
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return "Chưa có ngày";
    return parsed.toLocaleDateString("vi-VN");
  };

  const handleRemoveSession = (indexToRemove) => {
    setSessions((prevSessions) =>
      prevSessions.filter((_, index) => index !== indexToRemove),
    );
    setActiveSessionIndex((prev) => {
      if (prev === indexToRemove) return Math.max(0, indexToRemove - 1);
      if (prev > indexToRemove) return prev - 1;
      return prev;
    });
  };

  if (loading) return <div className="p-10 text-center">Đang tải...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        {backLabel}
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <div className="flex gap-3">
          {showDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              title="Xóa phiếu học tập"
            >
              <Trash2 className="w-4 h-4" />
              Xóa Phiếu
            </button>
          )}
          {showExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Xuất File Word
            </button>
          )}
          {!readOnly && (
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
            </button>
          )}
        </div>
      </div>

      {(studentName || className) && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-6">
          <div className="text-base md:text-lg text-blue-900">
            <span className="font-semibold">Học viên:</span>{" "}
            {studentName || "N/A"}
          </div>
          <div className="text-base md:text-lg text-blue-800 mt-2">
            <span className="font-semibold">Lớp:</span> {className || "N/A"}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Nội Dung Chi Tiết
          </h2>
          {sessions.length === 0 ? (
            <p className="text-gray-500 italic">
              Chưa có dữ liệu điểm danh để tạo buổi học.
            </p>
          ) : (
            <>
              <LessonContentQuickPicker
                sessions={sessions}
                setSessions={setSessions}
                readOnly={readOnly}
                activeSessionIndex={activeSessionIndex}
                onActiveSessionChange={setActiveSessionIndex}
              />
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Buổi / Ngày
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Nội Dung Học
                    </th>
                    {!readOnly && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        Thao Tác
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sessions.map((session, index) => (
                    <tr
                      key={index}
                      className={
                        !readOnly && activeSessionIndex === index
                          ? "bg-primary/5 ring-1 ring-inset ring-primary/30"
                          : undefined
                      }
                      onClick={() => {
                        if (!readOnly) setActiveSessionIndex(index);
                      }}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        Buổi {index + 1}{" "}
                        {!readOnly && activeSessionIndex === index ? (
                          <span className="text-[10px] font-semibold text-primary uppercase">
                            (đang chọn)
                          </span>
                        ) : null}
                        <br />
                        <span className="text-gray-500 font-normal">
                          {formatSessionDate(session)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          className={`w-full p-2 border rounded-md focus:outline-none text-sm min-h-[80px] ${
                            !readOnly && activeSessionIndex === index
                              ? "border-primary ring-1 ring-primary/20"
                              : "border-gray-200 focus:border-primary"
                          }`}
                          placeholder="Nhập nội dung bài học..."
                          value={session.content || ""}
                          readOnly={readOnly}
                          onFocus={() => setActiveSessionIndex(index)}
                          onChange={(e) => {
                            const newSessions = [...sessions];
                            newSessions[index].content = e.target.value;
                            setSessions(newSessions);
                          }}
                        />
                      </td>
                      {!readOnly && (
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveSession(index)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title={`Xóa buổi ${index + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                            Xóa
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Đánh Giá Của Giáo Viên
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ưu điểm
              </label>
              <textarea
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary min-h-[100px]"
                value={teacherFeedback?.strengths || ""}
                readOnly={readOnly}
                onChange={(e) =>
                  setTeacherFeedback({
                    ...teacherFeedback,
                    strengths: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhược điểm
              </label>
              <textarea
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary min-h-[100px]"
                value={teacherFeedback?.weaknesses || ""}
                readOnly={readOnly}
                onChange={(e) =>
                  setTeacherFeedback({
                    ...teacherFeedback,
                    weaknesses: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hướng khắc phục
              </label>
              <textarea
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary min-h-[100px]"
                value={teacherFeedback?.improvementPlan || ""}
                readOnly={readOnly}
                onChange={(e) =>
                  setTeacherFeedback({
                    ...teacherFeedback,
                    improvementPlan: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressAssessmentForm;
