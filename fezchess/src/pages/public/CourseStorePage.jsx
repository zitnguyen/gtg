import React, { useState, useEffect, useMemo } from "react";
import courseService from "../../services/courseService";
import { PlayCircle, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { usePublicCms } from "../../context/PublicCmsContext";
import ScrollReveal from "../../components/common/ScrollReveal";

/**
 * Task: Course store — lọc chủ đề/trình độ (API), giá KM, UX tham khảo Chessable
 * Tác giả: DucManh-BlueOC
 */

/** Nhãn chủ đề khớp enum Course.category (BE) — UX kiểu Chessable */
const TOPIC_TABS = [
  { key: "all", label: "Tất cả chủ đề", api: null },
  { key: "Opening", label: "Khai cuộc", api: "Opening" },
  { key: "Strategy", label: "Chiến lược", api: "Strategy" },
  { key: "Tactics", label: "Chiến thuật", api: "Tactics" },
  { key: "Endgame", label: "Cờ tàn", api: "Endgame" },
  { key: "General", label: "Tổng hợp", api: "General" },
];

const LEVEL_TABS = [
  { key: "all", label: "Mọi trình độ", api: null },
  { key: "beginner", label: "Mới bắt đầu", api: "Beginner" },
  { key: "intermediate", label: "Trung cấp", api: "Intermediate" },
  { key: "kids", label: "Thiếu nhi", api: "Beginner" },
];

const CATEGORY_LABEL_VI = {
  Opening: "Khai cuộc",
  Strategy: "Chiến lược",
  Tactics: "Chiến thuật",
  Endgame: "Cờ tàn",
  General: "Tổng hợp",
};

const CourseStorePage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topicFilter, setTopicFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { cms } = usePublicCms();
  const page = cms?.courseStore || {};
  const COURSES_PER_PAGE = 6;

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const topicTab = TOPIC_TABS.find((t) => t.key === topicFilter);
        const levelTab = LEVEL_TABS.find((l) => l.key === levelFilter);
        const params = {};
        if (topicTab?.api) params.category = topicTab.api;
        if (levelTab?.api) params.level = levelTab.api;
        const res = await courseService.getPublishedCourses(params);
        const data = Array.isArray(res) ? res : [];
        setCourses(data);
      } catch (error) {
        console.error("Failed to fetch courses", error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [topicFilter, levelFilter]);

  const filteredCourses = courses;

  const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);

  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * COURSES_PER_PAGE;
    return filteredCourses.slice(startIndex, startIndex + COURSES_PER_PAGE);
  }, [filteredCourses, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [topicFilter, levelFilter]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage, topicFilter, levelFilter]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const cardPriceLine = (course) => {
    const list = Number(course?.price) || 0;
    const sale = Number(course?.salePrice) || 0;
    const hasSale = sale > 0 && sale < list;
    const pay = hasSale ? sale : list;
    if (pay === 0) return { main: "Miễn phí", sub: null };
    return {
      main: `${pay.toLocaleString("vi-VN")}đ`,
      sub: hasSale ? `${list.toLocaleString("vi-VN")}đ` : null,
    };
  };

  const spotlightCourse = filteredCourses[0] || courses[0] || null;

  return (
    <div
      className="min-h-screen bg-[#f5f5f5] pb-16"
      style={{
        fontFamily:
          page?.fontFamily && page.fontFamily !== "inherit"
            ? page.fontFamily
            : undefined,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 md:pt-10">
        <ScrollReveal className="mb-7">
          <h1 className="text-4xl md:text-5xl font-bold text-black leading-tight">
            {page?.title || "Làm chủ bàn cờ"}
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl text-sm md:text-base">
            {page?.description ||
              "Từ những nước đi đầu tiên đến chiến lược nâng cao, khám phá các khóa học được thiết kế cho mọi độ tuổi và trình độ."}
          </p>
        </ScrollReveal>

        <ScrollReveal className="space-y-3 mb-7">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Chủ đề
          </p>
          <div className="flex flex-wrap gap-2.5">
            {TOPIC_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTopicFilter(tab.key)}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                  topicFilter === tab.key
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 pt-1">
            Trình độ
          </p>
          <div className="flex flex-wrap gap-2.5">
            {LEVEL_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setLevelFilter(tab.key)}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                  levelFilter === tab.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="text-center py-16 text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-200">
            Không tìm thấy khóa học phù hợp.
          </div>
        ) : (
          <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {paginatedCourses.map((course) => (
              <Link
                to={`/courses/${course.slug}`}
                key={course._id}
                className="group block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 transition-all duration-300"
              >
                <div className="relative h-44 bg-gray-200">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                      <PlayCircle size={42} className="opacity-60" />
                    </div>
                  )}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 max-w-[calc(100%-1rem)]">
                    <span className="bg-blue-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">
                      {String(course.level || "—")}
                    </span>
                    {course.category ? (
                      <span className="bg-white/95 text-gray-800 px-2.5 py-1 rounded-full text-[10px] font-bold border border-gray-200">
                        {CATEGORY_LABEL_VI[course.category] || course.category}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1.5 line-clamp-2 leading-tight">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-3 min-h-[32px]">
                    {course.description ||
                      "Khóa học thực chiến giúp bạn tiến bộ qua từng bài."}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen size={13} />
                      {course.totalLessons || 0} bài học
                    </span>
                    <span className="font-semibold text-gray-900 inline-flex items-baseline gap-2">
                      {(() => {
                        const { main, sub } = cardPriceLine(course);
                        return (
                          <>
                            <span>{main}</span>
                            {sub ? (
                              <span className="text-gray-400 line-through text-[11px] font-normal">
                                {sub}
                              </span>
                            ) : null}
                          </>
                        );
                      })()}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 active:scale-[0.98]"
                  >
                    Đăng ký ngay
                  </button>
                </div>
              </Link>
            ))}
          </ScrollReveal>
        )}

        {!loading && filteredCourses.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                  currentPage === pageNumber
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-blue-400"
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        )}

        {/* Task: Strip giải thích mô hình khoá học + bài tập (Chessable-like) — DucManh-BlueOC */}
        <ScrollReveal className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Học và luyện theo lộ trình có cấu trúc
          </h2>
          <p className="text-sm text-gray-600 mb-6 max-w-3xl leading-relaxed">
            Giống các nền tảng khoá học cờ chuyên sâu: bạn chọn chủ đề phù hợp,
            học qua video hoặc bàn cờ có hướng dẫn, sau đó củng cố bằng bài
            tập nước đi (chế độ chấm đúng/sai). Z Chess dùng chung một khóa học
            cho lý thuyết và bài cờ — admin gắn bài tập FEN/PGN ngay trong từng
            bài học.
          </p>
          <ol className="grid md:grid-cols-3 gap-6 text-sm text-gray-700 list-none m-0 p-0">
            <li className="rounded-xl border border-gray-100 bg-slate-50/80 p-4">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
                Bước 1
              </span>
              <p className="mt-2 font-semibold text-gray-900">Chọn chủ đề & trình độ</p>
              <p className="mt-1 text-gray-600 leading-relaxed">
                Lọc khai cuộc, chiến thuật, cờ tàn… và mức phù hợp để không bị
                quá tải.
              </p>
            </li>
            <li className="rounded-xl border border-gray-100 bg-slate-50/80 p-4">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
                Bước 2
              </span>
              <p className="mt-2 font-semibold text-gray-900">Học trên bàn & video</p>
              <p className="mt-1 text-gray-600 leading-relaxed">
                Từng bài có thể là video, bài đọc hoặc bàn cờ nội bộ với chuỗi
                nước và ghi chú.
              </p>
            </li>
            <li className="rounded-xl border border-gray-100 bg-slate-50/80 p-4">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
                Bước 3
              </span>
              <p className="mt-2 font-semibold text-gray-900">Luyện nước đúng</p>
              <p className="mt-1 text-gray-600 leading-relaxed">
                Bài cờ bật chế độ bài tập + import FEN/PGN giúp nhớ mẫu và phản
                xạ tình huống.
              </p>
            </li>
          </ol>
        </ScrollReveal>

        {spotlightCourse && (
          <ScrollReveal className="mt-10 bg-[#efefef] border border-gray-200 rounded-xl p-5 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-gray-500 mb-2">
                Khóa học nổi bật
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-3">
                {spotlightCourse.title}
              </h2>
              <p className="text-sm text-gray-600 mb-4 max-w-xl">
                {spotlightCourse.description ||
                  "Khóa học chuyên sâu giúp bạn nâng cao tư duy chiến thuật, phân tích thế trận và ra quyết định chính xác."}
              </p>
              <div className="space-y-1.5 text-sm text-gray-700 mb-5">
                <div>• Hỏi đáp trực tiếp cùng huấn luyện viên</div>
                <div>• Bài tập tương tác theo tình huống</div>
                <div>• Báo cáo tiến bộ cá nhân hóa</div>
              </div>
              <div className="flex gap-2.5">
                <Link
                  to={`/courses/${spotlightCourse.slug}`}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-700"
                >
                  Bắt đầu học
                </Link>
                <Link
                  to={`/courses/${spotlightCourse.slug}`}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-black text-sm font-semibold"
                >
                  Xem lộ trình
                </Link>
              </div>
            </div>
            <div className="relative h-56 md:h-64 rounded-xl overflow-hidden border border-gray-300">
              {spotlightCourse.thumbnail ? (
                <img
                  src={spotlightCourse.thumbnail}
                  alt={spotlightCourse.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white">
                  <PlayCircle size={54} />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center text-white">
                  <PlayCircle size={28} />
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
};

export default CourseStorePage;
