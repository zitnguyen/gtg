import React, { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import progressLessonTemplateService from "../../services/progressLessonTemplateService";

export const buildSessionContentFromLesson = (lesson) => {
  const title = String(lesson?.title || "").trim();
  const content = String(lesson?.content || "").trim();
  if (!title) return content;
  if (!content || content === title) return title;
  return `${title}\n${content}`;
};

const lessonPreviewText = (lesson) => {
  const title = String(lesson?.title || "").trim();
  const content = String(lesson?.content || "").trim();
  if (!content || content === title) return title;
  return content;
};

const LessonContentQuickPicker = ({
  sessions,
  setSessions,
  readOnly = false,
  activeSessionIndex: controlledIndex,
  onActiveSessionChange,
}) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [internalIndex, setInternalIndex] = useState(0);
  const [selectedLevelId, setSelectedLevelId] = useState("");

  const activeSessionIndex = controlledIndex ?? internalIndex;
  const setActiveSessionIndex = onActiveSessionChange ?? setInternalIndex;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await progressLessonTemplateService.getAll();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setTemplates(list);
        if (list.length > 0) {
          setSelectedLevelId(String(list[0]._id));
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.response?.data?.message ||
              "Không tải được mẫu nội dung học.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeSessionIndex >= sessions.length && sessions.length > 0) {
      setActiveSessionIndex(sessions.length - 1);
    }
  }, [sessions.length, activeSessionIndex]);

  const selectedLevel = useMemo(
    () =>
      templates.find((item) => String(item._id) === String(selectedLevelId)) ||
      null,
    [templates, selectedLevelId],
  );

  const lessons = useMemo(() => {
    const raw = Array.isArray(selectedLevel?.lessons)
      ? [...selectedLevel.lessons]
      : [];
    return raw.sort(
      (a, b) => Number(a.order || 0) - Number(b.order || 0),
    );
  }, [selectedLevel]);

  const applyLesson = (lesson) => {
    const text = buildSessionContentFromLesson(lesson);
    if (!text) return;
    setSessions((prev) =>
      prev.map((session, index) =>
        index === activeSessionIndex ? { ...session, content: text } : session,
      ),
    );
  };

  if (readOnly || sessions.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-semibold text-gray-800">
          Chèn nhanh nội dung học
        </span>
        <span className="text-xs text-gray-500">
          Chọn buổi (hoặc bấm vào ô bên dưới) → level → bấm bài học
        </span>
        <span className="ml-auto text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md">
          Đang chèn vào: Buổi {activeSessionIndex + 1}
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải mẫu bài học...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-gray-500">
          Chưa có mẫu nội dung. Admin vào{" "}
          <strong>Mẫu nội dung học</strong> để tạo level và bài học.
        </p>
      ) : templates.every((t) => !(t.lessons || []).length) ? (
        <p className="text-sm text-amber-700">
          Đã có level nhưng chưa có bài học mẫu. Admin cần nhập{" "}
          <strong>tên bài</strong> trong từng level rồi bấm{" "}
          <strong>Lưu level</strong>.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-600 shrink-0">
              Buổi:
            </span>
            {sessions.length > 8 ? (
              <select
                value={activeSessionIndex}
                onChange={(e) =>
                  setActiveSessionIndex(Number(e.target.value))
                }
                className="border border-gray-200 rounded-md px-2 py-1 text-sm bg-white min-w-[140px]"
              >
                {sessions.map((_, index) => (
                  <option key={index} value={index}>
                    Buổi {index + 1}
                  </option>
                ))}
              </select>
            ) : (
              sessions.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveSessionIndex(index)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    activeSessionIndex === index
                      ? "bg-primary text-primary-foreground"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Buổi {index + 1}
                </button>
              ))
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-600 shrink-0">
              Level:
            </span>
            {templates.map((level) => (
              <button
                key={level._id}
                type="button"
                onClick={() => setSelectedLevelId(String(level._id))}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  String(selectedLevelId) === String(level._id)
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {level.levelLabel}
                <span className="ml-1 text-gray-400">
                  ({(level.lessons || []).length})
                </span>
              </button>
            ))}
          </div>

          {lessons.length === 0 ? (
            <p className="text-sm text-gray-500">
              Level này chưa có bài học mẫu.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {lessons.map((lesson, index) => (
                <button
                  key={lesson._id || `${lesson.title}-${index}`}
                  type="button"
                  onClick={() => applyLesson(lesson)}
                  title={buildSessionContentFromLesson(lesson)}
                  className="px-3 py-2 rounded-lg text-left text-xs sm:text-sm bg-white border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors max-w-full sm:max-w-[280px]"
                >
                  <span className="font-medium text-gray-900 block truncate">
                    {lesson.title}
                  </span>
                  {lessonPreviewText(lesson) !== lesson.title ? (
                    <span className="text-gray-500 line-clamp-2 mt-0.5">
                      {lessonPreviewText(lesson)}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonContentQuickPicker;
