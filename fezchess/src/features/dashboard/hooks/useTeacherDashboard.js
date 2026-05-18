import useDashboardQuery from "./useDashboardQuery";
import teacherDashboardFacade from "../services/teacherDashboardFacade";

export default function useTeacherDashboard() {
  return useDashboardQuery(
    "dashboard:teacher:overview",
    () => teacherDashboardFacade.loadOverview(),
    { ttl: 45_000 },
  );
}
