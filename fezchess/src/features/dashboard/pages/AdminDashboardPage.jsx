import React, { useLayoutEffect } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import WidgetGrid from "../layout/WidgetGrid";
import AdminKpiWidget from "../widgets/admin/AdminKpiWidget";
import RevenueBarWidget from "../widgets/admin/RevenueBarWidget";
import StudentLevelDonutWidget from "../widgets/admin/StudentLevelDonutWidget";
import RecentEnrollmentsWidget from "../widgets/admin/RecentEnrollmentsWidget";
import useAdminDashboard from "../hooks/useAdminDashboard";
import { useShellTopBarOptional } from "../../../layouts/navigation/shell/ShellTopBarContext";

const AdminDashboardPage = () => {
  const { data, isLoading, isValidating } = useAdminDashboard();
  const shell = useShellTopBarOptional();

  useLayoutEffect(() => {
    const setTopBar = shell?.setTopBar;
    if (!setTopBar) return undefined;
    setTopBar({ mobileTitle: "Tổng quan" });
    return () => setTopBar(null);
  }, [shell?.setTopBar]);

  return (
    <DashboardLayout>
      <AdminKpiWidget data={data} loading={isLoading} />

      <WidgetGrid columns={3} gap="lg">
        <WidgetGrid.Item span={2}>
          <RevenueBarWidget
            data={data?.revenueChart}
            loading={isLoading || (isValidating && !data)}
          />
        </WidgetGrid.Item>
        <WidgetGrid.Item>
          <StudentLevelDonutWidget
            data={data?.levelDistribution}
            totalStudents={data?.totalStudents}
            loading={isLoading}
          />
        </WidgetGrid.Item>
      </WidgetGrid>

      <RecentEnrollmentsWidget
        data={data?.recentEnrollments}
        loading={isLoading}
      />
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
