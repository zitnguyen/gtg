import { useState, useEffect } from "react";
import ScrollReveal from "../common/ScrollReveal";
import CourseCard from "../cards/CourseCard";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import courseService from "../../services/courseService";
import { usePublicCms } from "../../context/PublicCmsContext";
import { useTheme } from "../../context/ThemeContext";

const CoursesSection = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { cms } = usePublicCms();
  const { isDark } = useTheme();
  const section = cms?.home?.courses || {};
  const theme = cms?.theme || {};
  const primaryButtonStyle = {
    backgroundColor: isDark ? "#FFFFFF" : "#000000",
    color: isDark ? "#000000" : "#FFFFFF",
    borderColor: isDark ? "#FFFFFF" : "#000000",
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await courseService.getPublishedCourses({ limit: 3 });
        // Handle response format if it's wrapped or just array
        const data = Array.isArray(res) ? res : res.data || [];
        // Take first 3 for Home Page
        setCourses(data.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch courses", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <section className="py-12 md:py-14 bg-white">
      <div className="container mx-auto px-4">
        <ScrollReveal className="mb-7 md:mb-9">
          <div className="flex items-end justify-between gap-4">
            <div>
              {/* Task: Align courses header with tkcursor-style eyebrow label — Author: DucManh-BlueOC */}
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-cyan-400 mb-1.5">
                {section?.badge || "Chương trình"}
              </p>
              <h2 className="font-display text-[28px] md:text-3xl font-bold text-foreground mb-1.5">
                {section?.title || "Khóa học nổi bật"}
              </h2>
              <p className="text-muted-foreground max-w-2xl text-sm">
            {section?.description ||
              "Các khóa học được thiết kế phù hợp với từng trình độ, từ người mới bắt đầu đến kỳ thủ chuyên nghiệp."}
              </p>
            </div>
            <Link to="/courses" className="hidden md:inline text-sm font-medium text-black">
              Xem tất cả →
            </Link>
          </div>
        </ScrollReveal>

        {/* Course Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {loading ? (
            <div className="col-span-full text-center text-muted-foreground">
              Đang tải dữ liệu...
            </div>
          ) : courses.length > 0 ? (
            courses.map((course, index) => (
              <ScrollReveal key={course._id} delay={index * 0.1}>
                <Link to={`/courses/${course.slug}`}>
                  <CourseCard
                    title={course.title}
                    description={
                      course.description || "Khóa học cờ vua chất lượng cao"
                    }
                    image={
                      course.thumbnail ||
                      "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=400&h=300&fit=crop"
                    }
                    level={course.level}
                    duration={`${course.totalLessons || 0} bài`}
                    students={course.enrolledStudents || 0}
                    rating={5.0}
                    price={
                      course.price === 0
                        ? "Miễn phí"
                        : `${course.price?.toLocaleString()}đ`
                    }
                    buttonText={section?.cardButtonText || "Xem chi tiết"}
                    buttonBgColor={section?.cardButtonBgColor}
                    buttonTextColor={section?.cardButtonTextColor}
                    buttonBorderColor={section?.cardButtonBorderColor}
                  />
                </Link>
              </ScrollReveal>
            ))
          ) : (
            <div className="col-span-full text-center text-muted-foreground">
              Chưa có khóa học nào được mở.
            </div>
          )}
        </div>

        {/* CTA */}
        <ScrollReveal delay={0.3} className="text-center mt-8 md:hidden">
          <Link to="/courses">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-secondary text-secondary-foreground border border-border px-6 py-2.5 rounded-lg font-medium transition-colors"
              style={{
                borderRadius: theme?.buttonRadius || undefined,
                ...primaryButtonStyle,
              }}
            >
              {section?.buttonText || "Xem tất cả khóa học →"}
            </motion.button>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default CoursesSection;
