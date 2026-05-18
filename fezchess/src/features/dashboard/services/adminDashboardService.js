import studentService from "../../../services/studentService";
import enrollmentService from "../../../services/enrollmentService";
import financeService from "../../../services/financeService";
import { getSkillLevelLabel } from "../../../utils/studentLevel";
import { CHART_PALETTE } from "../charts/chartTheme";
import { safeArray } from "../utils/formatters";

const computeGrowth = (current, previous) => {
  if (previous > 0) {
    const growth = ((current - previous) / previous) * 100;
    return (growth > 0 ? "+" : "") + growth.toFixed(0) + "%";
  }
  return current > 0 ? "+100%" : "0%";
};

const buildLevelData = (students) => {
  if (!students.length) return [];
  const counts = {};
  students.forEach((s) => {
    const lvl = getSkillLevelLabel(s.skillLevel);
    counts[lvl] = (counts[lvl] || 0) + 1;
  });
  return Object.keys(counts).map((key, index) => ({
    name: `${key} (${Math.round((counts[key] / students.length) * 100)}%)`,
    rawName: key,
    value: counts[key],
    fill: CHART_PALETTE[index % CHART_PALETTE.length],
  }));
};

const buildRevenueChart = (financeChart) => {
  return safeArray(financeChart).map((item) => ({
    name: item.name,
    value: item.income || item.value || 0,
  }));
};

/**
 * Admin dashboard facade. Loads & normalises the same APIs the legacy
 * MainDashboard used. No business logic was changed; we just centralise
 * derived values (growth %, level distribution, revenue series) here.
 */
const adminDashboardService = {
  async loadOverview() {
    const [studentsRes, enrollmentsRes, financeStatsRes, financeChartRes] =
      await Promise.allSettled([
        studentService.getAll(),
        enrollmentService.getAll(),
        financeService.getFinanceStats(),
        financeService.getFinanceChart(),
      ]);

    const students =
      studentsRes.status === "fulfilled"
        ? safeArray(studentsRes.value)
        : [];
    const enrollments =
      enrollmentsRes.status === "fulfilled"
        ? safeArray(enrollmentsRes.value)
        : [];

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    const studentsPriorToThisMonth = students.filter((s) => {
      if (!s.enrollmentDate) return false;
      const d = new Date(s.enrollmentDate);
      return d < new Date(thisYear, thisMonth, 1);
    }).length;

    const enrollmentsThisMonth = enrollments.filter((e) => {
      const d = new Date(e.enrollmentDate);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    const enrollmentsLastMonth = enrollments.filter((e) => {
      const d = new Date(e.enrollmentDate);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    }).length;

    const recentEnrollments = enrollments
      .filter((e) => {
        const d = new Date(e.enrollmentDate);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .sort(
        (a, b) => new Date(b.enrollmentDate) - new Date(a.enrollmentDate),
      )
      .slice(0, 5);

    const financeStatsRaw =
      financeStatsRes.status === "fulfilled"
        ? financeStatsRes.value
        : null;
    const financeStats = Array.isArray(financeStatsRaw?.data)
      ? financeStatsRaw.data
      : safeArray(financeStatsRaw);
    const totalRevenue = financeStats[0]?.value || 0;
    const revenueGrowth = financeStats[0]?.change || "0%";

    const financeChartRaw =
      financeChartRes.status === "fulfilled" ? financeChartRes.value : null;
    const financeChart = Array.isArray(financeChartRaw?.data)
      ? financeChartRaw.data
      : safeArray(financeChartRaw);

    return {
      totalStudents: students.length,
      newEnrollmentsCount: enrollmentsThisMonth,
      totalRevenue,
      studentGrowth: computeGrowth(students.length, studentsPriorToThisMonth),
      enrollmentGrowth: computeGrowth(
        enrollmentsThisMonth,
        enrollmentsLastMonth,
      ),
      revenueGrowth,
      recentEnrollments,
      revenueChart: buildRevenueChart(financeChart),
      levelDistribution: buildLevelData(students),
    };
  },
};

export default adminDashboardService;
