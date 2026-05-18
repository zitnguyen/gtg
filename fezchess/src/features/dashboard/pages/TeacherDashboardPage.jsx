import React from "react";
import DashboardLayout from "../layout/DashboardLayout";
import DashboardHeader from "../layout/DashboardHeader";
import WidgetGrid from "../layout/WidgetGrid";
import TeacherKpiWidget from "../widgets/teacher/TeacherKpiWidget";
import TodayScheduleWidget from "../widgets/teacher/TodayScheduleWidget";
import TeacherFinanceWidget from "../widgets/teacher/TeacherFinanceWidget";
import ClassListWidget from "../widgets/teacher/ClassListWidget";
import LatestAttendanceWidget from "../widgets/teacher/LatestAttendanceWidget";
import useTeacherDashboard from "../hooks/useTeacherDashboard";

const safeUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const TeacherDashboardPage = () => {
  const { data, isLoading, error } = useTeacherDashboard();
  const user = safeUser();
  const hasError = error || data?.hasError;

  return (
    <DashboardLayout
      header={
        <DashboardHeader
          eyebrow="Giáo viên"
          title="Dashboard giáo viên"
          subtitle={`Xin chào ${user?.fullName || "Giáo viên"}, đây là tổng quan lớp học hôm nay.`}
        />
      }
      banner={
        hasError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            Không thể tải dữ liệu tổng quan giáo viên.
          </div>
        ) : null
      }
    >
      <TeacherKpiWidget data={data} loading={isLoading} />

      <WidgetGrid columns={2} gap="lg">
        <TodayScheduleWidget
          schedule={data?.todaySchedule}
          loading={isLoading}
        />
        <TeacherFinanceWidget
          finance={data?.finance}
          loading={isLoading}
        />
      </WidgetGrid>

      <ClassListWidget classes={data?.classes} loading={isLoading} />

      <LatestAttendanceWidget
        attendance={data?.latestAttendance}
        loading={isLoading}
      />

      {!isLoading &&
      data &&
      Array.isArray(data.students) &&
      data.students.length === 0 &&
      Array.isArray(data.classes) &&
      data.classes.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          Chưa có dữ liệu học viên theo lớp. Vui lòng kiểm tra ghi danh.
        </div>
      ) : null}
    </DashboardLayout>
  );
};

export default TeacherDashboardPage;
