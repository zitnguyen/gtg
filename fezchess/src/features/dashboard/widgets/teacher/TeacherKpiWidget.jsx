import React, { memo, useMemo } from "react";
import { BookOpen, Calendar, Clock, Users } from "lucide-react";
import KpiCard from "../../cards/KpiCard";
import WidgetGrid from "../../layout/WidgetGrid";
import { safeArray } from "../../utils/formatters";

const TeacherKpiWidget = memo(function TeacherKpiWidget({ data, loading }) {
  const cards = useMemo(() => {
    const stats = data?.stats || {};
    const classes = safeArray(data?.classes);
    const todaySchedule = safeArray(data?.todaySchedule);
    const finance = data?.finance || {};
    return [
      {
        label: "Lớp đang dạy",
        value: stats.totalClasses ?? classes.length ?? 0,
        sub: "Theo phân công hiện tại",
        icon: BookOpen,
        accent: "primary",
      },
      {
        label: "Tổng học viên",
        value:
          stats.totalStudents ??
          classes.reduce(
            (sum, item) => sum + (item.currentStudents || 0),
            0,
          ),
        sub: "Học viên theo lớp",
        icon: Users,
        accent: "violet",
      },
      {
        label: "Lịch dạy hôm nay",
        value: stats.todaySchedulesCount ?? todaySchedule.length,
        sub: "Lớp có lịch trong ngày",
        icon: Calendar,
        accent: "amber",
      },
      {
        label: "Buổi đã chốt",
        value: finance.confirmedSessions ?? 0,
        sub: `${Number(finance.totalHours || 0).toFixed(1)} giờ dạy`,
        icon: Clock,
        accent: "emerald",
      },
    ];
  }, [data]);

  return (
    <WidgetGrid columns={4} gap="lg">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} loading={loading && !data} />
      ))}
    </WidgetGrid>
  );
});

export default TeacherKpiWidget;
