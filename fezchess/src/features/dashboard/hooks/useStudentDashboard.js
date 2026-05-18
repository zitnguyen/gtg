import { useMemo } from "react";
import useDashboardQuery from "./useDashboardQuery";
import studentDashboardFacade from "../services/studentDashboardFacade";

export default function useStudentDashboard(user) {
  const userKey = user?._id || user?.fullName || "anon";
  const query = useDashboardQuery(
    ["dashboard:student:overview", userKey],
    () => studentDashboardFacade.loadOverview(user),
    { ttl: 60_000, enabled: Boolean(user) },
  );
  return useMemo(() => query, [query.data, query.error, query.isLoading]);
}
