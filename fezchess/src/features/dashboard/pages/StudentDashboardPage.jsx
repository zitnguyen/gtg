import React from "react";
import authService from "../../../services/authService";
import DashboardLayout from "../layout/DashboardLayout";
import DashboardHeader from "../layout/DashboardHeader";
import WidgetGrid from "../layout/WidgetGrid";
import StudentKpiWidget from "../widgets/student/StudentKpiWidget";
import EloLineWidget from "../widgets/student/EloLineWidget";
import HomeworkWidget from "../widgets/student/HomeworkWidget";
import UpcomingClassesWidget from "../widgets/student/UpcomingClassesWidget";
import useStudentDashboard from "../hooks/useStudentDashboard";

const StudentDashboardPage = () => {
  const user = authService.getCurrentUser();
  const { data, isLoading } = useStudentDashboard(user);

  const fullName =
    user?.fullName || data?.student?.fullName || "Học viên";

  return (
    <DashboardLayout
      header={
        <DashboardHeader
          eyebrow="Học viên"
          title={`Xin chào, ${fullName} 👋`}
          subtitle="Cùng xem lại tiến độ học tập và các hoạt động tuần này."
        />
      }
    >
      <StudentKpiWidget stats={data?.stats} loading={isLoading} />

      <WidgetGrid columns={3} gap="lg">
        <WidgetGrid.Item span={2}>
          <div className="flex flex-col gap-5">
            <EloLineWidget data={data?.eloHistory} loading={isLoading} />
            <HomeworkWidget />
          </div>
        </WidgetGrid.Item>
        <WidgetGrid.Item>
          <UpcomingClassesWidget
            items={data?.upcomingClasses}
            loading={isLoading}
          />
        </WidgetGrid.Item>
      </WidgetGrid>
    </DashboardLayout>
  );
};

export default StudentDashboardPage;
