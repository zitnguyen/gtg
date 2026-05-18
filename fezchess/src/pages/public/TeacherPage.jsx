import React, { useState, useEffect, useMemo } from "react";
import teacherService from "../../services/teacherService";
import { useNavigate } from "react-router-dom";
import { usePublicCms } from "../../context/PublicCmsContext";
import { GraduationCap, Trophy } from "lucide-react";
import ScrollReveal from "../../components/common/ScrollReveal";

const TRAINING_LEVEL_LABELS = {
  beginner: "Huấn luyện cơ bản",
  intermediate: "Huấn luyện trung cấp",
  advanced: "Huấn luyện nâng cao",
};

const TeacherPage = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const { cms } = usePublicCms();
  const page = cms?.teachersPage || {};

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const data = await teacherService.getAll();
        setTeachers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch teachers", error);
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const tabs = [
    { key: "all", label: "Tất cả giáo viên" },
    { key: "beginner", label: "Huấn luyện cơ bản" },
    { key: "intermediate", label: "Huấn luyện trung cấp" },
    { key: "advanced", label: "Huấn luyện nâng cao" },
  ];

  const filteredTeachers = useMemo(() => {
    if (activeFilter === "all") return teachers;
    return teachers.filter((teacher) =>
      String(teacher?.trainingLevel || teacher?.specialization || "")
        .toLowerCase()
        .includes(activeFilter),
    );
  }, [teachers, activeFilter]);

  const spotlightTeacher = filteredTeachers[0] || teachers[0] || null;

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
            {page?.title || "Đội ngũ giáo viên"}
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl text-sm md:text-base">
            {page?.description ||
              "Học cùng đội ngũ giáo viên giàu kinh nghiệm với lộ trình bài bản cho từng trình độ."}
          </p>
        </ScrollReveal>

        <ScrollReveal className="flex flex-wrap gap-2.5 mb-7">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                activeFilter === tab.key
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </ScrollReveal>

        {loading ? (
          <div className="text-center py-16 text-gray-500">
            Đang tải danh sách giáo viên...
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-200">
            Không tìm thấy giáo viên phù hợp.
          </div>
        ) : (
          <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher._id}
                className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 transition-all duration-300"
              >
                <div className="relative h-52 bg-gray-200">
                  <img
                    src={
                      teacher.avatarUrl ||
                      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80"
                    }
                    alt={teacher.fullName}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-blue-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">
                    {TRAINING_LEVEL_LABELS[teacher?.trainingLevel] ||
                      teacher.specialization ||
                      "Giáo viên"}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1 leading-tight line-clamp-2">
                    {teacher.fullName}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-3 min-h-[32px]">
                    {teacher.certification ||
                      "Giáo viên cờ vua được chứng nhận, tập trung vào tiến bộ thực chất của học viên."}
                  </p>

                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap size={13} />
                      {teacher.experienceYears || 0}+ năm kinh nghiệm
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/teachers/${teacher._id}`)}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold hover:from-sky-600 hover:to-blue-700 transition-all duration-300 active:scale-[0.98]"
                  >
                    Xem hồ sơ
                  </button>
                </div>
              </div>
            ))}
          </ScrollReveal>
        )}

        {spotlightTeacher && (
          <ScrollReveal className="mt-10 bg-[#efefef] border border-gray-200 rounded-xl p-5 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-gray-500 mb-2">
                Giáo viên nổi bật
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-3">
                {spotlightTeacher.fullName}
              </h2>
              <p className="text-sm text-gray-600 mb-4 max-w-xl">
                {spotlightTeacher.specialization ||
                  "Giáo viên chuyên nghiệp với phương pháp thực chiến, lấy học viên làm trung tâm cho mọi trình độ."}
              </p>
              <div className="space-y-1.5 text-sm text-gray-700 mb-5">
                <div className="inline-flex items-center gap-2">
                  <Trophy size={14} className="text-yellow-500" />
                  Lộ trình huấn luyện hướng thi đấu
                </div>
                <div>• Phản hồi cá nhân hóa theo tuần</div>
                <div>• Bài tập chiến thuật và phân tích ván đấu</div>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => navigate(`/teachers/${spotlightTeacher._id}`)}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 active:scale-[0.98]"
                >
                  Đặt lịch học
                </button>
                <button
                  onClick={() => navigate(`/teachers/${spotlightTeacher._id}`)}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-black text-sm font-semibold transition-all duration-300 hover:bg-gray-50 active:scale-[0.98]"
                >
                  Xem hồ sơ
                </button>
              </div>
            </div>
            <div className="relative h-56 md:h-64 rounded-xl overflow-hidden border border-gray-300">
              <img
                src={
                  spotlightTeacher.avatarUrl ||
                  "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80"
                }
                alt={spotlightTeacher.fullName}
                className="w-full h-full object-cover"
              />
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
};

export default TeacherPage;
