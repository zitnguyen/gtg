import React, { memo, useMemo } from "react";
import { Activity, DollarSign, UserPlus, Users } from "lucide-react";
import KpiCard from "../../cards/KpiCard";
import WidgetGrid from "../../layout/WidgetGrid";
import { formatCompactCurrency, formatTrend } from "../../utils/formatters";

const AdminKpiWidget = memo(function AdminKpiWidget({ data, loading }) {
  const cards = useMemo(() => {
    const safe = data || {
      totalStudents: 0,
      newEnrollmentsCount: 0,
      totalRevenue: 0,
      studentGrowth: "0%",
      enrollmentGrowth: "0%",
      revenueGrowth: "0%",
    };
    return [
      {
        label: "Tổng số học viên",
        value: safe.totalStudents,
        trend: formatTrend(safe.studentGrowth),
        icon: Users,
        accent: "primary",
      },
      {
        label: "Học viên mới (tháng này)",
        value: safe.newEnrollmentsCount,
        trend: formatTrend(safe.enrollmentGrowth),
        icon: UserPlus,
        accent: "violet",
      },
      {
        label: "Doanh thu tháng",
        value: formatCompactCurrency(safe.totalRevenue),
        trend: formatTrend(safe.revenueGrowth),
        icon: DollarSign,
        accent: "emerald",
      },
      {
        label: "Hoạt động",
        value: "Ổn định",
        sub: "Hệ thống vận hành 24/7",
        trend: { label: "+95%", tone: "increase" },
        icon: Activity,
        accent: "amber",
      },
    ];
  }, [data]);

  return (
    <WidgetGrid columns={4} gap="lg">
      {cards.map((card) => (
        <KpiCard
          key={card.label}
          {...card}
          loading={loading && !data}
        />
      ))}
    </WidgetGrid>
  );
});

export default AdminKpiWidget;
