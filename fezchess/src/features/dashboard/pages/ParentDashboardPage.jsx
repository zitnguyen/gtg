import React from "react";
import authService from "../../../services/authService";
import DashboardLayout from "../layout/DashboardLayout";
import WidgetGrid from "../layout/WidgetGrid";
import ChildSwitcher from "../widgets/parent/ChildSwitcher";
import ChildHeaderWidget from "../widgets/parent/ChildHeaderWidget";
import ProgressCircleWidget from "../widgets/parent/ProgressCircleWidget";
import ParentStatsWidget from "../widgets/parent/ParentStatsWidget";
import LeaderboardWidget from "../widgets/parent/LeaderboardWidget";
import useParentDashboard from "../hooks/useParentDashboard";

const ParentDashboardPage = () => {
  const user = authService.getCurrentUser();
  const dashboard = useParentDashboard(user?._id);

  if (dashboard.isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Đang tải thông tin...</div>;
  }

  if (dashboard.error) {
    return (
      <div className="p-6">
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700"
        >
          <p className="mb-2 font-semibold">Không tải được dữ liệu phụ huynh.</p>
          <p>
            {dashboard.error?.response?.data?.message ||
              dashboard.error?.message ||
              "Vui lòng thử lại sau."}
          </p>
        </div>
      </div>
    );
  }

  if (!dashboard.children.length) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-dashed border-border bg-background py-12 text-center">
          <p className="text-muted-foreground mb-4">
            Chưa có thông tin học viên nào được liên kết.
          </p>
          <p className="text-sm text-muted-foreground">
            Vui lòng liên hệ trung tâm để cập nhật hồ sơ.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      className="p-4 md:p-6"
      banner={
        <ChildSwitcher
          children={dashboard.children}
          selectedChildId={dashboard.selectedChildId}
          onSelect={dashboard.setSelectedChildId}
        />
      }
    >
      <WidgetGrid columns={3} gap="md">
        <WidgetGrid.Item span={2}>
          <ChildHeaderWidget child={dashboard.selectedChild} />
        </WidgetGrid.Item>
        <WidgetGrid.Item>
          <ProgressCircleWidget
            percent={dashboard.stats.progressPercent}
            completedLessons={dashboard.stats.completedLessons}
            totalLessons={dashboard.stats.totalLessons}
            childId={dashboard.selectedChildId}
          />
        </WidgetGrid.Item>
      </WidgetGrid>

      <ParentStatsWidget
        stats={dashboard.stats}
        childId={dashboard.selectedChildId}
      />

      <LeaderboardWidget
        child={dashboard.selectedChild}
        level={dashboard.leaderboardLevel}
        onLevelChange={dashboard.setLeaderboardLevel}
        data={dashboard.leaderboard}
        loading={dashboard.leaderboardLoading}
      />
    </DashboardLayout>
  );
};

export default ParentDashboardPage;
