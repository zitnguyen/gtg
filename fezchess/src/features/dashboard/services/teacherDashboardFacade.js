import teacherDashboardService from "../../../services/teacherDashboardService";
import { safeArray } from "../utils/formatters";

const teacherDashboardFacade = {
  async loadOverview() {
    const [dashboardRes, classesRes, studentsRes, attendanceRes, financeRes] =
      await Promise.allSettled([
        teacherDashboardService.getDashboard(),
        teacherDashboardService.getClasses(),
        teacherDashboardService.getStudents(),
        teacherDashboardService.getAttendance(),
        teacherDashboardService.getFinance(),
      ]);

    const dashboard =
      dashboardRes.status === "fulfilled" ? dashboardRes.value || {} : {};
    const classes =
      classesRes.status === "fulfilled" ? safeArray(classesRes.value) : [];
    const students =
      studentsRes.status === "fulfilled" ? safeArray(studentsRes.value) : [];
    const attendance =
      attendanceRes.status === "fulfilled"
        ? safeArray(attendanceRes.value)
        : [];
    const finance =
      financeRes.status === "fulfilled" ? financeRes.value || {} : {};

    return {
      stats: dashboard?.stats || {},
      todaySchedule: safeArray(dashboard?.todaySchedule),
      latestAttendance:
        safeArray(dashboard?.latestAttendance).length > 0
          ? safeArray(dashboard.latestAttendance)
          : attendance.slice(0, 8),
      classes,
      students,
      finance,
      hasError: dashboardRes.status === "rejected",
    };
  },
};

export default teacherDashboardFacade;
