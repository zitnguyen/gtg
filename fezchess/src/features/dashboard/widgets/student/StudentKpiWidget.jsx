import React, { memo, useMemo } from "react";
import { BookOpen, CheckCircle, Trophy, Wallet } from "lucide-react";
import KpiCard from "../../cards/KpiCard";
import WidgetGrid from "../../layout/WidgetGrid";

const StudentKpiWidget = memo(function StudentKpiWidget({ stats, loading }) {
  const cards = useMemo(() => {
    const safe = stats || {
      attended: 0,
      elo: 0,
      assignments: 0,
      tuitionDue: "--",
    };
    return [
      {
        label: "Số buổi đã học",
        value: `${safe.attended} buổi`,
        sub: "Tổng số buổi đã tham gia",
        trend: { label: "+2 tuần này", tone: "increase" },
        icon: BookOpen,
        accent: "primary",
      },
      {
        label: "Elo Rating",
        value: safe.elo,
        sub: "Cấp bậc hiện tại",
        trend: { label: "Current", tone: "neutral" },
        icon: Trophy,
        accent: "violet",
      },
      {
        label: "Bài tập hoàn thành",
        value: `${safe.assignments}%`,
        sub: "So với bài tập đã giao",
        trend: { label: "+5%", tone: "increase" },
        icon: CheckCircle,
        accent: "amber",
      },
      {
        label: "Học phí sắp tới",
        value: "2.000.000đ",
        sub: `Đến hạn: ${safe.tuitionDue}`,
        icon: Wallet,
        accent: "rose",
      },
    ];
  }, [stats]);

  return (
    <WidgetGrid columns={4} gap="lg">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} loading={loading && !stats} />
      ))}
    </WidgetGrid>
  );
});

export default StudentKpiWidget;
