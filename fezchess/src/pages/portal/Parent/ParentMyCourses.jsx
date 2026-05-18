import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle } from "lucide-react";
import courseService from "../../../services/courseService";

/** Gộp khóa từ tất cả con, bỏ trùng theo _id (BE: GET /courses/parent/my-courses → { children }). */
function flattenParentCourses(payload) {
  const rows = Array.isArray(payload?.children) ? payload.children : [];
  const out = [];
  const seen = new Set();
  for (const row of rows) {
    for (const course of row?.courses || []) {
      const key = String(course?._id || "");
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(course);
    }
  }
  return out;
}

const ParentMyCourses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await courseService.getParentMyCourses();
        setCourses(flattenParentCourses(data));
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Khóa học của con</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Các khóa học online được cấp quyền cho con bạn (theo hồ sơ học viên).
        </p>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Đang tải dữ liệu...</div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-border bg-background p-8 text-center text-muted-foreground">
          Chưa có khóa học nào được gán cho các con trong tài khoản của bạn.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div
              key={course._id}
              className="rounded-lg border border-border bg-background p-3 flex gap-3 items-center"
            >
              <img
                src={course.thumbnail || "https://placehold.co/120x80?text=Course"}
                alt={course.title}
                className="w-28 h-20 rounded object-cover bg-muted"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{course.title}</div>
                <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {course.description || "Khóa học khả dụng"}
                </div>
                <button
                  className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-sm hover:opacity-90"
                  type="button"
                  onClick={() => {
                    navigate(`/courses/${course.slug}`);
                  }}
                >
                  <PlayCircle size={16} />
                  Vào học
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentMyCourses;
