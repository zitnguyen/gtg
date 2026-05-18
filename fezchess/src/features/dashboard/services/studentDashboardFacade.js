import studentService from "../../../services/studentService";
import enrollmentService from "../../../services/enrollmentService";
import authService from "../../../services/authService";
import { CURRENT_STUDENT_ID } from "../../../mockAuth";
import { safeArray } from "../utils/formatters";

const resolveStudentId = async (user) => {
  const u = user || authService.getCurrentUser();
  if (u?.linkedStudentId) return u.linkedStudentId;
  if (CURRENT_STUDENT_ID) return CURRENT_STUDENT_ID;
  if (u?.fullName) {
    const matches = await studentService.getAll({ keyword: u.fullName });
    const found =
      safeArray(matches).find((s) => s.fullName === u.fullName) ||
      safeArray(matches)[0];
    if (found) return found._id;
  }
  const all = await studentService.getAll();
  return safeArray(all)[0]?._id || null;
};

const buildUpcomingClasses = (enrollments) =>
  safeArray(enrollments).map((enr, index) => ({
    id: enr.classId?._id,
    title: enr.classId?.className,
    teacher: "Giáo viên",
    platform: "Phòng học 1",
    time: enr.classId?.schedule || "18:00",
    date: "HÀNG TUẦN",
    status: "offline",
    isHighlight: index === 0,
  }));

const studentDashboardFacade = {
  async loadOverview(user) {
    const studentId = await resolveStudentId(user);
    if (!studentId) {
      return {
        student: null,
        upcomingClasses: [],
        eloHistory: [],
        stats: {
          attended: 0,
          elo: 0,
          assignments: 0,
          tuitionDue: "--",
        },
      };
    }

    const [studentRes, enrollmentsRes] = await Promise.allSettled([
      studentService.getById(studentId),
      enrollmentService.getByStudent(studentId),
    ]);

    const student =
      studentRes.status === "fulfilled" ? studentRes.value : null;
    const enrollments =
      enrollmentsRes.status === "fulfilled"
        ? safeArray(enrollmentsRes.value)
        : [];

    const elo = Number(student?.elo || 1200);
    // Backend currently doesn't expose Elo history; preserve mock series so
    // existing UI is unchanged. When backend wires this up, the shape stays
    // identical (array of { month, elo }).
    const baseElo = elo || 1200;
    const eloHistory = [
      { month: "T1", elo: Math.max(800, baseElo - 200) },
      { month: "T2", elo: Math.max(800, baseElo - 50) },
      { month: "T3", elo: Math.max(800, baseElo - 80) },
      { month: "T4", elo: Math.max(800, baseElo + 50) },
      { month: "T5", elo: Math.max(800, baseElo - 20) },
      { month: "T6", elo: baseElo },
    ];

    return {
      student,
      upcomingClasses: buildUpcomingClasses(enrollments).slice(0, 5),
      eloHistory,
      stats: {
        attended: Number(student?.attendedSessions || 24),
        elo,
        assignments: Number(student?.assignmentCompletion || 85),
        tuitionDue: student?.tuitionDueDate
          ? new Date(student.tuitionDueDate).toLocaleDateString("vi-VN")
          : "20/11",
      },
    };
  },
};

export default studentDashboardFacade;
