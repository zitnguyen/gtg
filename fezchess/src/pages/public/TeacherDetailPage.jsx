import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import teacherService from "../../services/teacherService";

const TRAINING_LEVEL_LABELS = {
  beginner: "Huấn luyện cơ bản",
  intermediate: "Huấn luyện trung cấp",
  advanced: "Huấn luyện nâng cao",
};

const TeacherDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await teacherService.getPublicById(id);
        setTeacher(data || null);
      } catch (e) {
        setError(e?.response?.data?.message || "Không thể tải chi tiết giáo viên.");
        setTeacher(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-gray-500">Đang tải...</div>;
  }

  if (error || !teacher) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          {error || "Không tìm thấy giáo viên."}
        </div>
        <button
          onClick={() => navigate("/teachers")}
          className="mt-4 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-12 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Chi tiết giáo viên</h1>
          <button
            onClick={() => navigate("/teachers")}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Quay lại
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-100">
                {teacher.avatarUrl ? (
                  <img
                    src={teacher.avatarUrl}
                    alt={teacher.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
                    {(teacher.fullName || teacher.username || "T").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{teacher.fullName || "-"}</div>
                <div className="text-sm text-gray-500">{teacher.specialization || "Giáo viên"}</div>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">
              Thông tin cá nhân & chuyên môn
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Họ và tên</div>
                <div className="font-medium text-gray-900">{teacher.fullName || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Số điện thoại</div>
                <div className="font-medium text-gray-900">{teacher.phone || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Chuyên môn</div>
                <div className="font-medium text-gray-900">{teacher.specialization || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Cấp độ huấn luyện</div>
                <div className="font-medium text-gray-900">
                  {TRAINING_LEVEL_LABELS[teacher.trainingLevel] || "-"}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Năm kinh nghiệm</div>
                <div className="font-medium text-gray-900">{teacher.experienceYears || 0}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-gray-500">Chứng chỉ</div>
                <div className="font-medium text-gray-900">{teacher.certificates || "-"}</div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDetailPage;
