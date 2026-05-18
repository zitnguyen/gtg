import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import progressLessonTemplateService from "../../../services/progressLessonTemplateService";

const emptyLesson = (order = 0) => ({
  order,
  title: "",
  content: "",
});

const mapLevelToForm = (level) => {
  const lessons = (level?.lessons || []).map((lesson, index) => ({
    _id: lesson._id,
    order: lesson.order ?? index,
    title: lesson.title || "",
    content: lesson.content || "",
  }));
  return {
    levelKey: level?.levelKey || "",
    levelLabel: level?.levelLabel || "",
    sortOrder: level?.sortOrder ?? 0,
    isActive: level?.isActive !== false,
    lessons: lessons.length > 0 ? lessons : [emptyLesson(0)],
  };
};

const ProgressLessonTemplateAdmin = () => {
  const [levels, setLevels] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadLevels = useCallback(async () => {
    setError("");
    try {
      const data = await progressLessonTemplateService.getAll();
      const list = Array.isArray(data) ? data : [];
      setLevels(list);
      return list;
    } catch (e) {
      setError(e?.response?.data?.message || "Không tải được danh sách level.");
      return [];
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const list = await loadLevels();
      if (cancelled) return;
      if (list.length > 0) {
        const first = list[0];
        setSelectedId(String(first._id));
        setForm(mapLevelToForm(first));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadLevels]);

  const selectLevel = (level) => {
    setSelectedId(String(level._id));
    setForm(mapLevelToForm(level));
    setError("");
  };

  const handleCreateLevel = () => {
    const nextIndex = levels.length + 1;
    setSelectedId("");
    setForm({
      levelKey: `level${nextIndex}`,
      levelLabel: `Level ${nextIndex}`,
      sortOrder: nextIndex,
      isActive: true,
      lessons: [emptyLesson(0)],
    });
    setError("");
  };

  const handleSave = async () => {
    if (!form?.levelKey?.trim() || !form?.levelLabel?.trim()) {
      setError("Mã level và tên level là bắt buộc.");
      return;
    }
    const lessons = (form.lessons || [])
      .map((lesson, index) => {
        const title = String(lesson.title || "").trim();
        const content = String(lesson.content || "").trim();
        return {
          order: Number(lesson.order ?? index),
          title,
          content,
        };
      })
      .filter((lesson) => lesson.title);

    if (lessons.length === 0) {
      setError(
        "Chưa có bài học nào được lưu. Vui lòng nhập ít nhất tên bài (ô đầu tiên trong mỗi khối Bài).",
      );
      toast.error("Cần nhập tên bài trước khi lưu.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = {
        levelKey: form.levelKey.trim(),
        levelLabel: form.levelLabel.trim(),
        sortOrder: Number(form.sortOrder || 0),
        isActive: Boolean(form.isActive),
        lessons,
      };

      let savedId = selectedId;
      if (selectedId) {
        await progressLessonTemplateService.update(selectedId, payload);
      } else {
        const created = await progressLessonTemplateService.create(payload);
        savedId = String(created._id);
        setSelectedId(savedId);
      }

      const list = await loadLevels();
      const saved = list.find((item) => String(item._id) === String(savedId));
      if (saved) {
        setForm(mapLevelToForm(saved));
        setLevels(list);
      }
      toast.success(
        `Đã lưu level "${form.levelLabel.trim()}" với ${lessons.length} bài học mẫu.`,
      );
    } catch (e) {
      setError(e?.response?.data?.message || "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLevel = async () => {
    if (!selectedId) return;
    if (!window.confirm("Xóa level này và toàn bộ bài học mẫu?")) return;
    try {
      await progressLessonTemplateService.remove(selectedId);
      const list = await loadLevels();
      if (list.length > 0) {
        selectLevel(list[0]);
      } else {
        setSelectedId("");
        setForm(null);
      }
      alert("Đã xóa level.");
    } catch (e) {
      setError(e?.response?.data?.message || "Xóa thất bại.");
    }
  };

  const patchForm = (patch) => {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const updateLesson = (index, field, value) => {
    setForm((prev) => {
      if (!prev) return prev;
      const lessons = [...(prev.lessons || [])];
      lessons[index] = { ...lessons[index], [field]: value };
      return { ...prev, lessons };
    });
  };

  const addLesson = () => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        lessons: [
          ...(prev.lessons || []),
          emptyLesson(prev.lessons?.length || 0),
        ],
      };
    });
  };

  const removeLesson = (index) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = (prev.lessons || []).filter((_, i) => i !== index);
      return {
        ...prev,
        lessons: next.length > 0 ? next : [emptyLesson(0)],
      };
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Link
        to="/progress"
        className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại Phiếu học tập
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mẫu nội dung học</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Tạo level cố định và bài học mẫu. Giáo viên chỉ cần bấm để điền
            nội dung khi ghi phiếu học tập.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateLevel}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Thêm level
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 space-y-1">
            <p className="text-xs font-semibold uppercase text-gray-500 px-2 py-1">
              Danh sách level
            </p>
            {levels.map((level) => (
              <button
                key={level._id}
                type="button"
                onClick={() => selectLevel(level)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  String(selectedId) === String(level._id)
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-gray-50 text-gray-800"
                }`}
              >
                {level.levelLabel}
                <span className="block text-xs text-gray-500">
                  {(level.lessons || []).length} bài
                </span>
              </button>
            ))}
            {!selectedId && form && (
              <p className="px-2 py-2 text-xs text-primary font-medium">
                Level mới (chưa lưu)
              </p>
            )}
          </div>

          {form ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã level
                  </label>
                  <input
                    value={form.levelKey}
                    onChange={(e) => patchForm({ levelKey: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="level1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên hiển thị
                  </label>
                  <input
                    value={form.levelLabel}
                    onChange={(e) => patchForm({ levelLabel: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Level 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thứ tự
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => patchForm({ sortOrder: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => patchForm({ isActive: e.target.checked })}
                    />
                    Đang dùng (hiện cho giáo viên)
                  </label>
                </div>
              </div>

              <div>
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
                  Mỗi bài cần có <strong>tên bài</strong> (bắt buộc). Nội dung chi
                  tiết có thể để trống — hệ thống sẽ dùng tên bài khi chèn nhanh.
                </p>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900">Bài học mẫu</h2>
                  <button
                    type="button"
                    onClick={addLesson}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm bài
                  </button>
                </div>
                <div className="space-y-4">
                  {(form.lessons || []).map((lesson, index) => (
                    <div
                      key={lesson._id || `lesson-${index}`}
                      className="border border-gray-100 rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          Bài {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLesson(index)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                          title="Xóa bài"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Tên bài <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={lesson.title}
                        onChange={(e) =>
                          updateLesson(index, "title", e.target.value)
                        }
                        placeholder="vd: Buổi 1 — Cách di chuyển quân"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      />
                      <textarea
                        value={lesson.content}
                        onChange={(e) =>
                          updateLesson(index, "content", e.target.value)
                        }
                        placeholder="Nội dung chi tiết sẽ chèn vào phiếu học tập..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[100px]"
                      />
                    </div>
                  ))}
                </div>
                {(form.lessons || []).length === 0 && (
                  <p className="text-sm text-gray-500">
                    Bấm &quot;Thêm bài&quot; để thêm bài học mẫu.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Đang lưu..." : "Lưu level"}
                </button>
                {selectedId && (
                  <button
                    type="button"
                    onClick={handleDeleteLevel}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa level
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-500">
              Chọn một level hoặc bấm &quot;Thêm level&quot; để bắt đầu.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressLessonTemplateAdmin;
