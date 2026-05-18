import parentService from "../../../services/parentService";
import assessmentService from "../../../services/assessmentService";
import attendanceService from "../../../services/attendanceService";
import classService from "../../../services/classService";
import progressService from "../../../services/progressService";
import studentService from "../../../services/studentService";
import { safeArray } from "../utils/formatters";

const parentDashboardFacade = {
  async loadChildren(parentId) {
    if (!parentId) return [];
    const res = await parentService.getStudents(parentId);
    return safeArray(res);
  },

  async loadChildStats(child) {
    if (!child?._id) {
      return {
        attendancePresent: 0,
        attendanceTotal: 0,
        pendingAssignments: 0,
        achievements: 0,
      };
    }
    const childId = child._id;
    const completedLessons = Number(
      child.completedLessons ??
        child.completedSessions ??
        child.doneLessons ??
        0,
    );
    const totalLessons = Number(
      child.totalLessons ?? child.totalSessions ?? child.lessonCount ?? 0,
    );

    const [assessmentsRes, attendanceRes, classesRes] = await Promise.all([
      assessmentService.getByStudent(childId),
      attendanceService.getByStudentAndDate(childId),
      classService.getAll(),
    ]);

    const assessments = safeArray(assessmentsRes);
    const attendanceList = safeArray(attendanceRes);
    const classes = safeArray(classesRes);

    const attendancePresent = attendanceList.filter(
      (item) => item?.status === "present",
    ).length;
    const attendanceTotal = attendanceList.length;

    const relatedClassIds = classes
      .filter((item) => {
        const studentList = Array.isArray(item?.studentIds)
          ? item.studentIds
          : [];
        return studentList.some(
          (st) => String(st?._id || st) === String(childId),
        );
      })
      .map((item) => item?._id)
      .filter(Boolean);

    const progressRows = await Promise.all(
      relatedClassIds.map(async (classId) => {
        try {
          return await progressService.getByStudentClass(childId, classId);
        } catch {
          return null;
        }
      }),
    );
    const validProgressRows = progressRows.filter(Boolean);
    const progressSessionCount = validProgressRows.reduce((sum, row) => {
      const sessions = Array.isArray(row?.sessions) ? row.sessions : [];
      return sum + sessions.length;
    }, 0);
    const hasTeacherFeedback = validProgressRows.some((row) => {
      const fb = row?.teacherFeedback || {};
      return Boolean(fb.strengths || fb.weaknesses || fb.improvementPlan);
    });

    const pendingFromStudent = Number(
      child.pendingAssignments ??
        child.unfinishedAssignments ??
        child.homeworkPending ??
        0,
    );
    const pendingAssignments =
      pendingFromStudent > 0
        ? pendingFromStudent
        : Math.max(totalLessons - completedLessons, 0);

    const achievements =
      assessments.length > 0
        ? assessments.length
        : progressSessionCount > 0
          ? progressSessionCount
          : hasTeacherFeedback
            ? 1
            : 0;

    return {
      attendancePresent,
      attendanceTotal,
      pendingAssignments,
      achievements,
    };
  },

  async loadLeaderboard({ level, childId, limit = 10 }) {
    if (!level) return { items: [], myChildRank: null, totalInLevel: 0 };
    const response = await studentService.getLeaderboard({
      level,
      limit,
      childId: childId || undefined,
    });
    return {
      items: safeArray(response?.items),
      myChildRank: response?.myChildRank ?? null,
      totalInLevel: Number(response?.totalInLevel || 0),
    };
  },
};

export default parentDashboardFacade;
