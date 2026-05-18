/**
 * Task: Trang chi tiết khóa học — bố cục tham khảo hoidanit.vn (flash sale, meta, gồm gì, outline CK, accordion)
 * Tác giả: DucManh-BlueOC
 */
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { loginNavigationState } from "../../utils/loginRedirect";
import courseService from "../../services/courseService";
import reviewService from "../../services/reviewService";
import { usePublicCms } from "../../context/PublicCmsContext";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronDown,
  FileText,
  Globe,
  PlayCircle,
  Puzzle,
  Sparkles,
  Star,
  Swords,
  Tag,
  Target,
  User,
} from "lucide-react";

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function extractLearningBullets(description) {
  const lines = String(description || "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const bullets = lines
    .filter((l) => /^[-•*]\s/.test(l))
    .map((l) => l.replace(/^[-•*]\s*/, ""));
  if (bullets.length >= 3) return bullets.slice(0, 14);
  return null;
}

function formatStudyHours(totalMinutes) {
  const m = Number(totalMinutes) || 0;
  if (m <= 0) return null;
  const h = m / 60;
  if (h >= 10) return `${Math.round(h)} giờ`;
  if (h >= 1) return `${h.toFixed(1).replace(/\.0$/, "")} giờ`;
  return `${m} phút`;
}

function computeCurriculumStats(curriculum, canViewContent) {
  const chapters = Array.isArray(curriculum) ? curriculum : [];
  let lessonCount = 0;
  let totalMinutes = 0;
  chapters.forEach((ch) => {
    if (canViewContent && Array.isArray(ch.lessons)) {
      lessonCount += ch.lessons.length;
      ch.lessons.forEach((l) => {
        totalMinutes += Number(l.duration) || 0;
      });
    } else {
      lessonCount += Number(ch.lessonCount) || 0;
    }
  });
  const hoursLabel = formatStudyHours(totalMinutes);
  return {
    chapterCount: chapters.length,
    lessonCount,
    totalMinutes,
    hoursLabel,
  };
}

const CourseDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [canViewContent, setCanViewContent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [editingReviewId, setEditingReviewId] = useState("");
  const [editingReviewForm, setEditingReviewForm] = useState({
    rating: 5,
    comment: "",
  });
  const [openChapters, setOpenChapters] = useState(() => new Set());

  const user = readUser();
  const currentRole = String(user?.role || "").toLowerCase();
  const isAdmin = currentRole === "admin";
  const canSubmitReview = Boolean(user && canViewContent);
  const { cms } = usePublicCms();
  const detailTheme = cms?.courseDetail || {};
  const globalTheme = cms?.theme || {};

  const listPrice = Number(course?.price) || 0;
  const salePrice = Number(course?.salePrice) || 0;
  const hasSale = salePrice > 0 && salePrice < listPrice;
  const payPrice = hasSale ? salePrice : listPrice;
  const discountPct =
    hasSale && listPrice > 0
      ? Math.round(((listPrice - salePrice) / listPrice) * 100)
      : 0;

  const stats = useMemo(
    () => computeCurriculumStats(curriculum, canViewContent),
    [curriculum, canViewContent],
  );

  const avgRating = useMemo(() => {
    if (!reviews.length) return null;
    const s = reviews.reduce((a, r) => a + (Number(r.rating) || 0), 0);
    return (s / reviews.length).toFixed(1);
  }, [reviews]);

  const learningBullets = useMemo(() => {
    if (!course) return [];
    const fromDesc = extractLearningBullets(course.description);
    if (fromDesc) return fromDesc;
    return [
      `Lộ trình ${course.level} — tập trung ${course.category}`,
      "Video bài giảng, ví dụ minh họa và bài tập thực hành",
      "Theo dõi tiến độ qua từng chương, ôn tập phù hợp trình độ",
    ];
  }, [course]);

  const instructorName =
    course?.instructor?.fullName === "Administrator"
      ? "HLV Z Chess"
      : course?.instructor?.fullName || "HLV Z Chess";

  const mapToastMessage = (message, fallback) => {
    const raw = String(message || "").trim();
    if (!raw) return fallback;
    const normalized = raw.toLowerCase();
    if (normalized.includes("you have already reviewed this course")) {
      return "Bạn đã đánh giá khóa học này rồi.";
    }
    return raw;
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await courseService.getCourseBySlug(slug);
        setCourse(res.course);
        setCurriculum(res.curriculum || []);
        setCanViewContent(Boolean(res.canViewContent));
        if (res.course?._id) {
          const reviewData = await reviewService.getByCourseId(res.course._id);
          setReviews(Array.isArray(reviewData) ? reviewData : []);
        }
      } catch (error) {
        console.error("Failed to fetch course", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [slug]);

  useEffect(() => {
    if (!curriculum.length) return;
    setOpenChapters((prev) => {
      const next = new Set(prev);
      if (next.size === 0 && curriculum[0]?._id) {
        next.add(String(curriculum[0]._id));
      }
      return next;
    });
  }, [curriculum]);

  const toggleChapter = (id) => {
    const key = String(id);
    setOpenChapters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const location = useLocation();

  const handleEnroll = async () => {
    if (!user) {
      navigate("/login", {
        state: { from: { pathname: `/courses/${slug}/checkout` } },
      });
      return;
    }
    if (canViewContent) {
      const firstLessonId = curriculum?.[0]?.lessons?.[0]?._id;
      if (firstLessonId) {
        navigate(`/learning/${slug}/${firstLessonId}`);
        return;
      }
      toast.info("Khóa học chưa có bài học để mở.");
      return;
    }
    navigate(`/courses/${slug}/checkout`);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login", { state: loginNavigationState(location) });
      return;
    }
    if (!course?._id) return;
    if (!canSubmitReview) {
      toast.info(
        "Bạn chưa có quyền xem nội dung khóa học nên chưa thể đánh giá.",
      );
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewService.create({
        courseId: course._id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });
      const reviewData = await reviewService.getByCourseId(course._id);
      setReviews(Array.isArray(reviewData) ? reviewData : []);
      setReviewForm({ rating: 5, comment: "" });
      toast.success("Đã gửi đánh giá thành công.");
    } catch (error) {
      toast.error(
        mapToastMessage(
          error?.response?.data?.message,
          "Không thể gửi đánh giá",
        ),
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const startEditReview = (review) => {
    setEditingReviewId(String(review._id));
    setEditingReviewForm({
      rating: Number(review.rating) || 5,
      comment: review.comment || "",
    });
  };

  const cancelEditReview = () => {
    setEditingReviewId("");
    setEditingReviewForm({ rating: 5, comment: "" });
  };

  const handleUpdateReview = async (reviewId) => {
    if (!isAdmin) return;
    try {
      await reviewService.update(reviewId, {
        rating: Number(editingReviewForm.rating),
        comment: editingReviewForm.comment,
      });
      if (course?._id) {
        const reviewData = await reviewService.getByCourseId(course._id);
        setReviews(Array.isArray(reviewData) ? reviewData : []);
      }
      cancelEditReview();
      toast.success("Đã cập nhật đánh giá.");
    } catch (error) {
      toast.error(
        mapToastMessage(
          error?.response?.data?.message,
          "Không thể cập nhật đánh giá",
        ),
      );
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!isAdmin) return;
    const ok = window.confirm("Xóa đánh giá này?");
    if (!ok) return;
    try {
      await reviewService.remove(reviewId);
      setReviews((prev) =>
        prev.filter((item) => String(item._id) !== String(reviewId)),
      );
      if (editingReviewId === String(reviewId)) cancelEditReview();
      toast.success("Đã xóa đánh giá.");
    } catch (error) {
      toast.error(
        mapToastMessage(error?.response?.data?.message, "Không thể xóa đánh giá"),
      );
    }
  };

  const PurchaseCard = ({ className = "" }) => (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden ${className}`}
    >
      <div className="relative aspect-video bg-slate-200">
        {course?.thumbnail ? (
          <img
            src={course.thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white">
            <PlayCircle size={56} className="opacity-50" />
          </div>
        )}
        {hasSale ? (
          <span className="absolute top-3 left-3 rounded-md bg-rose-600 px-2 py-1 text-[11px] font-bold text-white shadow">
            −{discountPct}%
          </span>
        ) : null}
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
          Học phí
        </p>
        <div className="flex flex-wrap items-end gap-2 mb-1">
          <span className="text-2xl sm:text-3xl font-bold text-slate-900">
            {payPrice === 0 ? "Miễn phí" : `${payPrice.toLocaleString("vi-VN")} ₫`}
          </span>
          {hasSale ? (
            <span className="text-base text-slate-400 line-through mb-0.5">
              {listPrice.toLocaleString("vi-VN")} ₫
            </span>
          ) : null}
        </div>
        {avgRating ? (
          <p className="text-sm text-amber-600 font-medium mb-4 flex items-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {avgRating} / 5 · {reviews.length} đánh giá
          </p>
        ) : (
          <p className="text-sm text-slate-500 mb-4">Chưa có đánh giá</p>
        )}
        <button
          type="button"
          onClick={handleEnroll}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-base text-white shadow-md transition hover:opacity-95"
          style={{
            backgroundColor: detailTheme?.primaryButtonColor || "#ea580c",
            color: detailTheme?.primaryButtonTextColor || "#ffffff",
            borderRadius: globalTheme?.buttonRadius || "12px",
          }}
        >
          {canViewContent ? "Học ngay" : "Mua khóa học"}
        </button>
        <p className="text-xs text-slate-500 text-center mt-3 leading-relaxed">
          Truy cập theo tài khoản đã mua · Hỗ trợ qua trung tâm
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-24 text-slate-600 bg-[#f4f6f8] min-h-screen">
        Đang tải…
      </div>
    );
  }
  if (!course) {
    return (
      <div className="text-center py-24 text-slate-600 bg-[#f4f6f8] min-h-screen">
        Không tìm thấy khóa học.
      </div>
    );
  }

  const tagLine =
    Array.isArray(course.tags) && course.tags.length
      ? course.tags.join(", ")
      : course.category;

  const curriculumSummaryParts = [
    `${stats.chapterCount} chương`,
    `${stats.lessonCount} bài giảng`,
    stats.hoursLabel ? `${stats.hoursLabel} nội dung` : null,
  ].filter(Boolean);

  return (
    <div className="bg-[#f4f6f8] min-h-screen pb-28 md:pb-16 text-slate-900">
      {hasSale ? (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-center text-xs sm:text-sm font-medium py-2.5 px-3 flex flex-wrap items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            Ưu đãi · Giảm <strong>{discountPct}%</strong> — chỉ còn{" "}
            <strong>{payPrice.toLocaleString("vi-VN")} ₫</strong>
          </span>
        </div>
      ) : null}

      <div
        className="text-white pt-10 pb-12 md:pt-14 md:pb-16 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: course?.heroBackground
            ? `linear-gradient(${detailTheme?.overlayColor || "rgba(15, 23, 42, 0.82)"}, ${detailTheme?.overlayColor || "rgba(15, 23, 42, 0.82)"}), url(${course.heroBackground})`
            : undefined,
          backgroundColor: course?.heroBackground ? undefined : "#0f172a",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Link
            to="/courses"
            className="inline-flex text-sm text-white/70 hover:text-white mb-6"
          >
            ← Danh sách khóa học
          </Link>
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              {course.title}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-200/95 leading-relaxed line-clamp-4">
              {course.description?.split("\n")[0]?.replace(/^[-•*]\s*/, "") ||
                course.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
              {avgRating ? (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  {avgRating} ({reviews.length} đánh giá)
                </span>
              ) : (
                <span className="text-slate-400">Chưa có đánh giá</span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                Ngôn ngữ: Tiếng Việt
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Tag className="h-4 w-4" />
                Tags: {tagLine}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4" />
                Tác giả: {instructorName}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 md:-mt-10 relative z-[1]">
        <div className="md:hidden mb-6">
          <PurchaseCard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-2 space-y-10">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-orange-500" />
                Khóa học này bao gồm
              </h2>
              <ul className="space-y-2.5 text-slate-700 text-sm sm:text-base">
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  Video bài giảng theo từng chương, có thể xem lại không giới hạn
                </li>
                {stats.hoursLabel ? (
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    Khoảng <strong>{stats.hoursLabel}</strong> nội dung (ước
                    lượng theo thời lượng bài)
                  </li>
                ) : null}
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  {stats.lessonCount} bài giảng trong {stats.chapterCount} chương
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  Hỗ trợ theo lộ trình {course.level} — {course.category}
                </li>
              </ul>
            </section>

            {/* Task: Chessable-style — cách học qua video + bàn cờ + bài tập nước đúng — DucManh-BlueOC */}
            <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 via-white to-white p-5 sm:p-8 shadow-sm">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Puzzle className="h-5 w-5 text-indigo-600 shrink-0" />
                Cách bạn sẽ học (lý thuyết + luyện nước)
              </h2>
              <p className="text-sm text-slate-600 mb-6 max-w-2xl leading-relaxed">
                Khóa học có thể gồm video, bài đọc, bàn cờ có chú thích và bài
                tập bắt buộc đi đúng nước — cùng một lộ trình như các nền tảng
                khoá học cờ chuyên sâu: xem → hiểu → lặp lại đúng nước cần nhớ.
              </p>
              <div className="grid sm:grid-cols-3 gap-5">
                <div className="rounded-xl border border-slate-100 bg-white/90 p-4 shadow-sm">
                  <Target className="h-8 w-8 text-orange-500 mb-2" />
                  <p className="font-semibold text-slate-900 text-sm">Mục tiêu rõ</p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Chủ đề <strong>{course.category}</strong>, trình độ{" "}
                    <strong>{course.level}</strong> — bạn biết mình đang cải
                    thiện phần nào.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white/90 p-4 shadow-sm">
                  <BookOpen className="h-8 w-8 text-orange-500 mb-2" />
                  <p className="font-semibold text-slate-900 text-sm">Học có hướng dẫn</p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Bài video/bài đọc kết hợp bàn cờ nội bộ: xem biến, đọc ghi
                    chú từng nước.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white/90 p-4 shadow-sm">
                  <Puzzle className="h-8 w-8 text-orange-500 mb-2" />
                  <p className="font-semibold text-slate-900 text-sm">Luyện nước đúng</p>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Bài cờ bật chế độ bài tập và import FEN/PGN — hệ thống chấm
                    đúng/sai theo đáp án.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
                Những gì bạn sẽ học
              </h2>
              <ul className="space-y-2.5 text-slate-700 text-sm sm:text-base list-none">
                {learningBullets.map((line, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="text-orange-500 font-bold shrink-0">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-2 border-b border-slate-100">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Nội dung khóa học
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {curriculumSummaryParts.join(" · ")}
                </p>
                {!canViewContent ? (
                  <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Đăng ký khóa học để xem đầy đủ danh sách bài và học trực
                    tuyến.
                  </p>
                ) : null}
              </div>
              <div className="divide-y divide-slate-100">
                {curriculum.length > 0 ? (
                  curriculum.map((chapter, chIdx) => {
                    const cid = String(chapter._id);
                    const isOpen = openChapters.has(cid);
                    const nLessons = canViewContent
                      ? chapter.lessons?.length || 0
                      : chapter.lessonCount || 0;
                    return (
                      <div key={chapter._id} className="bg-white">
                        <button
                          type="button"
                          onClick={() => toggleChapter(chapter._id)}
                          className="w-full flex items-center justify-between gap-3 px-5 sm:px-8 py-4 text-left hover:bg-slate-50/80 transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">
                              Chương {chIdx + 1}: {chapter.title}
                            </p>
                            <p className="text-sm text-slate-500 mt-0.5">
                              {nLessons} bài giảng
                            </p>
                          </div>
                          <ChevronDown
                            className={`h-5 w-5 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        {isOpen ? (
                          <div className="px-5 sm:px-8 pb-4 pt-0 border-t border-slate-50 bg-slate-50/50">
                            {canViewContent && chapter.lessons?.length ? (
                              <ul className="space-y-0">
                                {chapter.lessons.map((lesson, liIdx) => (
                                  <li key={lesson._id}>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        navigate(
                                          `/learning/${slug}/${lesson._id}`,
                                        )
                                      }
                                      className="w-full flex items-center gap-3 py-2.5 px-2 rounded-lg text-left text-sm text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                                    >
                                      <span className="text-slate-400 font-mono text-xs w-14 shrink-0">
                                        #{chIdx + 1}.{liIdx + 1}
                                      </span>
                                      {lesson.type === "video" ? (
                                        <PlayCircle className="h-4 w-4 text-slate-400 shrink-0" />
                                      ) : lesson.type === "chess" ? (
                                        <Swords className="h-4 w-4 text-amber-600 shrink-0" />
                                      ) : (
                                        <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                                      )}
                                      <span className="flex-1 min-w-0">
                                        {lesson.title}
                                        {lesson.isFree ? (
                                          <span className="ml-2 text-[10px] uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                            Học thử
                                          </span>
                                        ) : null}
                                      </span>
                                      {lesson.duration > 0 ? (
                                        <span className="text-xs text-slate-400 shrink-0">
                                          {lesson.duration}p
                                        </span>
                                      ) : null}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-500 py-2">
                                {canViewContent
                                  ? "Chưa có bài trong chương này."
                                  : `Nội dung ${nLessons} bài — mở khóa để xem chi tiết.`}
                              </p>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    Nội dung đang được cập nhật…
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
                Mô tả chi tiết
              </h2>
              <div className="prose prose-slate prose-sm sm:prose-base max-w-none whitespace-pre-wrap text-slate-700 leading-relaxed">
                {course.description}
              </div>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 uppercase tracking-wide">
                Giảng viên
              </h2>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-start gap-5">
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <User className="h-8 w-8 text-slate-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {instructorName}
                  </h3>
                  <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                    Đội ngũ HLV, kiện tướng giàu kinh nghiệm tại Z Chess — đồng
                    hành cùng học viên từng bước.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 uppercase tracking-wide">
                Đánh giá khóa học
              </h2>
              {avgRating ? (
                <p className="text-amber-600 font-semibold mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  {avgRating} trên 5 · {reviews.length} đánh giá
                </p>
              ) : null}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm mb-6">
                {canSubmitReview ? (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <select
                        value={reviewForm.rating}
                        onChange={(e) =>
                          setReviewForm((prev) => ({
                            ...prev,
                            rating: e.target.value,
                          }))
                        }
                        className="border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                      >
                        <option value={5}>5 sao</option>
                        <option value={4}>4 sao</option>
                        <option value={3}>3 sao</option>
                        <option value={2}>2 sao</option>
                        <option value={1}>1 sao</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Nhận xét của bạn…"
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm((prev) => ({
                            ...prev,
                            comment: e.target.value,
                          }))
                        }
                        className="sm:col-span-3 border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold disabled:opacity-60"
                    >
                      {submittingReview ? "Đang gửi…" : "Gửi đánh giá"}
                    </button>
                  </form>
                ) : (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Chỉ học viên đã được cấp quyền xem nội dung mới gửi đánh giá.
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-8 text-center text-slate-500 text-sm">
                    Chưa có đánh giá nào cho khóa học này.
                  </div>
                ) : (
                  reviews.map((r) => (
                    <div
                      key={r._id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-900">
                          {r.userId?.fullName || "Học viên"}
                        </span>
                        <span className="text-amber-500 text-sm font-semibold">
                          {"★".repeat(Number(r.rating) || 0)}
                        </span>
                      </div>
                      {editingReviewId === String(r._id) ? (
                        <div className="space-y-3">
                          <select
                            value={editingReviewForm.rating}
                            onChange={(e) =>
                              setEditingReviewForm((prev) => ({
                                ...prev,
                                rating: e.target.value,
                              }))
                            }
                            className="border border-slate-300 rounded-lg px-3 py-2 w-full sm:w-auto"
                          >
                            <option value={5}>5 sao</option>
                            <option value={4}>4 sao</option>
                            <option value={3}>3 sao</option>
                            <option value={2}>2 sao</option>
                            <option value={1}>1 sao</option>
                          </select>
                          <input
                            type="text"
                            value={editingReviewForm.comment}
                            onChange={(e) =>
                              setEditingReviewForm((prev) => ({
                                ...prev,
                                comment: e.target.value,
                              }))
                            }
                            className="w-full border border-slate-300 rounded-lg px-3 py-2"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateReview(r._id)}
                              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm"
                            >
                              Lưu
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditReview}
                              className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-sm"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-700 text-sm">
                          {r.comment || "Không có nhận xét."}
                        </p>
                      )}
                      {isAdmin && editingReviewId !== String(r._id) ? (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEditReview(r)}
                            className="text-xs px-2 py-1 rounded border border-slate-200"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(r._id)}
                            className="text-xs px-2 py-1 rounded border border-slate-200"
                          >
                            Xóa
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <PurchaseCard />
            </div>
          </aside>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-slate-500 uppercase tracking-wide">
            Giá
          </p>
          <p className="text-lg font-bold text-slate-900">
            {payPrice === 0 ? "Miễn phí" : `${payPrice.toLocaleString("vi-VN")} ₫`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleEnroll}
          className="shrink-0 px-6 py-2.5 rounded-xl font-bold text-white text-sm"
          style={{
            backgroundColor: detailTheme?.primaryButtonColor || "#ea580c",
            color: detailTheme?.primaryButtonTextColor || "#ffffff",
          }}
        >
          {canViewContent ? "Học ngay" : "Mua"}
        </button>
      </div>
    </div>
  );
};

export default CourseDetail;
