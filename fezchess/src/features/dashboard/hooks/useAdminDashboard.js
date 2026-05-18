import useDashboardQuery from "./useDashboardQuery";
import adminDashboardService from "../services/adminDashboardService";

export default function useAdminDashboard() {
  return useDashboardQuery(
    "dashboard:admin:overview",
    () => adminDashboardService.loadOverview(),
    { ttl: 60_000 },
  );
}
